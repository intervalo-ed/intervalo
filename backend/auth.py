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
  CLERK_SECRET_KEY   — optional, para completar email/nombre vía la Backend API
                       cuando el JWT no los trae
  CLERK_WEBHOOK_SECRET — `whsec_…`, firma de los webhooks (ver clerk_webhook.py)
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
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import handles
from models import User
from usernames import assign_unique_username

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# ── Configuration ────────────────────────────────────────────────────────────

CLERK_JWKS_URL = os.environ.get("CLERK_JWKS_URL", "")
CLERK_ISSUER = os.environ.get("CLERK_ISSUER", "")
CLERK_AUDIENCE = os.environ.get("CLERK_AUDIENCE") or None
CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY", "")  # only needed for JIT user enrichment

print(f"[clerk-auth] JWKS={CLERK_JWKS_URL!r} ISSUER={CLERK_ISSUER!r} AUD={CLERK_AUDIENCE!r}", flush=True)

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
    username: Optional[str] = None
    display_name: Optional[str] = None
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
    except jwt.PyJWTError as e:
        print(f"[clerk-auth] verify failed: {type(e).__name__}: {e}", flush=True)
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

PROVISION_ATTEMPTS = 3


class UserProvisioningError(RuntimeError):
    """No se pudo crear ni enlazar la fila de `users` tras varios intentos."""


def _resolve_email_and_name(claims: ClerkClaims) -> tuple[str, str]:
    """Email y nombre definitivos para la fila, o ValueError si no hay email.

    Va fuera del loop de reintentos: puede pegarle a la API de Clerk (5s de
    timeout) y ese resultado no cambia entre intentos.
    """
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
    return email, name or email  # sin nombre, el email sostiene el NOT NULL


def _registrar_handle(db: Session, user: User) -> None:
    """Deja el @ de esta persona anotado en el registro. No commitea.

    El alta escribía `users.username` directo, y esa columna dejó de ser la
    autoridad cuando nació `handles`: es una caché que el registro baja. Un @ que
    solo existe en la caché es invisible para el minijuego —`alias_taken` le
    pregunta al registro— así que un invitado podía reclamar el mismo string y
    quedaban dos personas con el mismo @, cada una resolviendo sus links `?r=`.

    Y hacia el otro lado: al unificarse con su jugador, `handles.vincular` no
    encontraba nada que retirar y el username viejo quedaba LIBRE para cualquiera.

    Reusa el @ que la persona ya tenía si sigue siendo suyo o si está libre —
    nadie tiene por qué perder su nombre porque el registro llegó después—; solo
    pide uno nuevo cuando ese string ya es de otro.
    """
    if handles.activo_de_usuario(db, user.id) is not None:
        return
    actual = (user.username or "").strip()
    if actual:
        fila = handles.duenio(db, actual)
        if fila is None or fila.user_id == user.id:
            handles.reclamar(db, actual, user_id=user.id)
            return
    handles.reclamar(db, assign_unique_username(db, user.name), user_id=user.id)


def _link_existing_by_email(db: Session, user: User, sub: str, name: str) -> User:
    """Fila preexistente encontrada por email → engancharla a esta identidad."""
    user.clerk_user_id = sub
    if not user.name:
        user.name = name
    _registrar_handle(db, user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_user_from_clerk(
    db: Session, claims: ClerkClaims, *, via: str = "request"
) -> User:
    """
    Find the local `User` row for this Clerk identity, or create one on first
    sight (JIT provisioning). Safe to call on every authenticated request.

    Matching order:
      1. `clerk_user_id` (stable id from Clerk, `sub` claim)
      2. `email` (covers users who existed before the Clerk switch, if any)

    Los escritores compiten de dos maneras. Dentro del propio request path,
    porque esto corre en TODA request autenticada y el alta se intenta en
    paralelo desde varias a la vez (el dashboard pide los tres cursos de una).
    Y contra el webhook de Clerk, que dispara `user.created` casi en el mismo
    instante en que el navegador hace su primera llamada.

    Los tres SELECT de acá son TOCTOU contra las constraints únicas de
    `clerk_user_id`, `email` y `username`, así que el INSERT puede perder la
    carrera. Reintentamos en vez de resolver de una: el perdedor vuelve a leer
    y encuentra la fila del ganador — salvo en el caso de `username`, donde no
    hay fila que reusar porque es otra persona con el mismo nombre, y lo que
    hace falta es que `assign_unique_username` genere el candidato siguiente.
    Sin el loop, ese caso le devolvía un 500 al usuario justo en el signup.
    """
    email, name = _resolve_email_and_name(claims)

    for attempt in range(PROVISION_ATTEMPTS):
        try:
            user = db.query(User).filter(User.clerk_user_id == claims.sub).first()
            if user:
                return user

            user = db.query(User).filter(User.email == email).first()
            if user:
                return _link_existing_by_email(db, user, claims.sub, name)

            user = User(clerk_user_id=claims.sub, email=email, name=name)
            db.add(user)
            # El flush primero: el registro necesita el `id` de la fila, y el @
            # lo baja él a `users.username` (handles._sincronizar_cache).
            db.flush()
            _registrar_handle(db, user)
            db.commit()
            db.refresh(user)
            print(
                f"[provision] created user id={user.id} clerk={claims.sub} via={via}",
                flush=True,
            )
            return user
        except (IntegrityError, handles.HandleTomado) as exc:
            # `HandleTomado` es la misma carrera vista un instante antes: otra
            # transacción commiteó el @ entre que `assign_unique_username` lo dio
            # por libre y el registro fue a tomarlo. Se reintenta igual, y el
            # intento siguiente genera el candidato que sigue.
            db.rollback()
            print(
                f"[provision] race en el intento {attempt + 1} para {claims.sub}: "
                f"{getattr(exc, 'orig', exc)}",
                flush=True,
            )

    raise UserProvisioningError(
        f"no se pudo provisionar {claims.sub} tras {PROVISION_ATTEMPTS} intentos"
    )
