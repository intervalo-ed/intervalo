"""
auth.py — Clerk-based authentication.

The frontend talks to Clerk directly and gets a short-lived session JWT (RS256,
signed by Clerk). It attaches that JWT as `Authorization: Bearer <token>` on
every API request. We verify the token against Clerk's JWKS endpoint and
look up / lazily provision the matching `User` row in our DB.

Environment variables:
  CLERK_JWKS_URL     — e.g. https://<your-clerk-domain>/.well-known/jwks.json
  CLERK_ISSUER       — e.g. https://<your-clerk-domain>  (value of `iss` claim)
  CLERK_AUDIENCE     — optional, only set if your session template uses `aud`
"""

import os
import time
from pathlib import Path
from typing import Optional

import httpx
import jwt
from dotenv import load_dotenv
from jwt import PyJWKClient
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models import User

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# ── Configuration ────────────────────────────────────────────────────────────

CLERK_JWKS_URL = os.environ.get("CLERK_JWKS_URL", "")
CLERK_ISSUER = os.environ.get("CLERK_ISSUER", "")
CLERK_AUDIENCE = os.environ.get("CLERK_AUDIENCE") or None
CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY", "")  # only needed for JIT user enrichment

# Clerk rotates signing keys, so we reuse a PyJWKClient (it caches keys by kid)
# instead of re-fetching the JWKS on every request.
_jwks_client: Optional[PyJWKClient] = None


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        if not CLERK_JWKS_URL:
            raise RuntimeError(
                "CLERK_JWKS_URL is not set. Add it to backend/.env "
                "(see your Clerk dashboard → API Keys)."
            )
        _jwks_client = PyJWKClient(CLERK_JWKS_URL, cache_keys=True, lifespan=3600)
    return _jwks_client


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    clerk_user_id: Optional[str] = None


class ClerkClaims(BaseModel):
    """Subset of the Clerk session JWT claims we care about."""
    sub: str                          # Clerk user id, e.g. "user_2aBcDeF..."
    email: Optional[str] = None
    name: Optional[str] = None


# ── JWT verification ─────────────────────────────────────────────────────────

def verify_clerk_token(token: str) -> Optional[ClerkClaims]:
    """
    Verify a Clerk session JWT. Returns None on any failure (invalid sig,
    expired, wrong issuer, etc).

    Clerk session JWTs are RS256 and carry `sub` (user id) plus whatever
    claims the session template exposes. By default we read `email` and
    `name` from the token; if your template doesn't expose them, set up one
    that does, or we'll fall back to the Clerk REST API (see
    `fetch_clerk_user` below).
    """
    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token).key
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER or None,
            audience=CLERK_AUDIENCE,  # None → skip aud check
            options={
                "require": ["exp", "sub"],
                "verify_aud": CLERK_AUDIENCE is not None,
            },
            leeway=10,  # small clock skew tolerance
        )
    except jwt.PyJWTError:
        return None

    sub = payload.get("sub")
    if not sub:
        return None

    # Clerk's default session template exposes these under these names; custom
    # templates may rename them. We keep lookups defensive.
    email = (
        payload.get("email")
        or payload.get("primary_email")
        or payload.get("email_address")
    )
    name = (
        payload.get("name")
        or payload.get("full_name")
        or _join_name(payload.get("first_name"), payload.get("last_name"))
    )

    return ClerkClaims(sub=sub, email=email, name=name)


def _join_name(first: Optional[str], last: Optional[str]) -> Optional[str]:
    parts = [p for p in (first, last) if p]
    return " ".join(parts) if parts else None


# ── Fallback: fetch user details from the Clerk REST API ─────────────────────

_clerk_user_cache: dict[str, tuple[float, dict]] = {}
_CLERK_USER_CACHE_TTL = 300  # seconds


def fetch_clerk_user(clerk_user_id: str) -> Optional[dict]:
    """
    Fetch user details from Clerk's Backend API as a fallback when the session
    JWT doesn't carry email/name. Requires CLERK_SECRET_KEY.

    Result is cached in-process for 5 minutes to keep signup latency down.
    """
    if not CLERK_SECRET_KEY:
        return None

    now = time.time()
    cached = _clerk_user_cache.get(clerk_user_id)
    if cached and cached[0] > now:
        return cached[1]

    try:
        resp = httpx.get(
            f"https://api.clerk.com/v1/users/{clerk_user_id}",
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            timeout=5.0,
        )
        resp.raise_for_status()
    except httpx.HTTPError:
        return None

    data = resp.json()
    _clerk_user_cache[clerk_user_id] = (now + _CLERK_USER_CACHE_TTL, data)
    return data


def _extract_email_and_name(user_data: dict) -> tuple[Optional[str], Optional[str]]:
    """Pull (email, name) out of a Clerk Backend API user payload."""
    # Primary email
    email = None
    primary_id = user_data.get("primary_email_address_id")
    for addr in user_data.get("email_addresses", []) or []:
        if addr.get("id") == primary_id:
            email = addr.get("email_address")
            break
    if not email and user_data.get("email_addresses"):
        email = user_data["email_addresses"][0].get("email_address")

    # Name
    name = _join_name(user_data.get("first_name"), user_data.get("last_name"))
    if not name:
        name = user_data.get("username") or email

    return email, name


# ── User management ──────────────────────────────────────────────────────────

def get_or_create_user_from_clerk(db: Session, claims: ClerkClaims) -> User:
    """
    Find the local `User` row for this Clerk identity, or create one on first
    sight (JIT provisioning). Safe to call on every authenticated request.

    Matching order:
      1. `clerk_user_id` (stable id from Clerk, `sub` claim)
      2. `email` (covers users who existed before the Clerk switch, if any)
    """
    # 1. Exact Clerk ID match
    user = db.query(User).filter(User.clerk_user_id == claims.sub).first()
    if user:
        return user

    # We need email + name to create/attach. Token might not carry them.
    email = claims.email
    name = claims.name
    if not email or not name:
        data = fetch_clerk_user(claims.sub)
        if data:
            fallback_email, fallback_name = _extract_email_and_name(data)
            email = email or fallback_email
            name = name or fallback_name

    if not email:
        raise ValueError(
            f"Clerk user {claims.sub} has no email on the JWT and no "
            "CLERK_SECRET_KEY is configured to look it up."
        )
    if not name:
        name = email  # last-ditch fallback so NOT NULL constraint holds

    # 2. Existing row matched by email → link to Clerk
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.clerk_user_id = claims.sub
        if not user.name:
            user.name = name
        db.commit()
        db.refresh(user)
        return user

    # 3. Brand new — create it
    user = User(
        clerk_user_id=claims.sub,
        email=email,
        name=name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
