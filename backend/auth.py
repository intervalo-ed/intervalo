import os
from datetime import datetime, timedelta
from typing import Optional
import httpx
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import User

# Configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/auth/google/callback"
)

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "dev-secret-key-change-in-production-12345678901234567890"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 days

# Pydantic schemas
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    name: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    google_id: Optional[str] = None


class TokenPayload(BaseModel):
    user_id: int
    email: str
    exp: datetime


# Google OAuth helper functions
def get_google_oauth_url() -> str:
    """Generate Google OAuth consent URL."""
    return (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"access_type=offline"
    )


async def exchange_code_for_token(code: str) -> dict:
    """Exchange Google authorization code for access token."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GOOGLE_REDIRECT_URI,
            },
        )
        response.raise_for_status()
        return response.json()


async def get_google_user_info(access_token: str) -> dict:
    """Get user info from Google using access token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()


# JWT helper functions
def create_access_token(
    user_id: int,
    email: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.utcnow() + expires_delta
    to_encode = {
        "user_id": user_id,
        "email": email,
        "exp": expire,
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[TokenPayload]:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        email: str = payload.get("email")
        if user_id is None or email is None:
            return None
        return TokenPayload(
            user_id=user_id,
            email=email,
            exp=datetime.fromtimestamp(payload.get("exp"))
        )
    except JWTError:
        return None


# User management functions
def get_or_create_user(
    db: Session,
    email: str,
    name: str,
    google_id: str
) -> User:
    """Get existing user or create new one."""
    user = db.query(User).filter(User.email == email).first()
    if user:
        # Update google_id if not set
        if not user.google_id:
            user.google_id = google_id
            db.commit()
        return user

    # Create new user
    user = User(
        email=email,
        name=name,
        google_id=google_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


async def authenticate_with_google(
    code: str,
    db: Session
) -> TokenResponse:
    """
    Complete Google OAuth flow:
    1. Exchange code for access token
    2. Get user info from Google
    3. Create/update user in database
    4. Generate JWT
    """
    # Exchange code for access token
    token_response = await exchange_code_for_token(code)
    access_token = token_response.get("access_token")

    if not access_token:
        raise ValueError("Failed to obtain access token from Google")

    # Get user info from Google
    google_user = await get_google_user_info(access_token)

    # Extract user info
    google_id = google_user.get("id")
    email = google_user.get("email")
    name = google_user.get("name", email)

    if not email or not google_id:
        raise ValueError("Failed to get email or ID from Google")

    # Get or create user in database
    user = get_or_create_user(db, email, name, google_id)

    # Generate JWT
    jwt_token = create_access_token(user.id, user.email)

    return TokenResponse(
        access_token=jwt_token,
        user_id=user.id,
        email=user.email,
        name=user.name,
    )
