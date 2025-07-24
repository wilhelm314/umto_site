import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from dotenv import load_dotenv
import psycopg

from core.database import get_db_connection
from schemas.auth import TokenData

# Load environment variables
load_dotenv()

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
PWD_SALT = os.getenv("PWD_SALT", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# Password context for hashing and verification
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction from request
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password + PWD_SALT, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password + PWD_SALT)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a new JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_user_by_email(email: str):
    """Get a user by email"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Try to find by  email
                cur.execute(
                    """
                    SELECT id, full_name, email, password_hash, status
                    FROM users
                    WHERE email = %s
                    """,
                    (email,),
                )
                user = cur.fetchone()

                assert user, "Failed to get user from email"

                return {
                    "id": user[0],
                    "full_name": user[1],
                    "email": user[2],
                    "password_hash": user[3],
                    "status": user[4],
                }
    except Exception as e:
        print(f"Database error: {e}")
        return None


async def authenticate_user(email: str, password: str):
    """Authenticate a user with email and password"""
    user = await get_user_by_email(email)
    if not user:
        return False
    if not verify_password(password, user["password_hash"]):
        return False
    return user


async def save_token(user_id: int, access_token: str) -> bool:
    """Save token to the database"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # First, invalidate any existing token for this user
                cur.execute(
                    """
                    UPDATE token
                    SET status = false
                    WHERE user_id = %s
                    """,
                    (user_id,),
                )

                # Then insert the new token
                cur.execute(
                    """
                    INSERT INTO token (user_id, access_toke, status, created_date)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (user_id, access_token, True, datetime.utcnow()),
                )
                conn.commit()
                return True
    except Exception as e:
        print(f"Error saving token: {e}")
        return False


async def get_current_user(access_token: Optional[str] = Cookie(None)):
    """
    Get the current user from the access token cookie
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not access_token:
        raise credentials_exception

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")  # type: ignore
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user_by_email(email)
    if user is None:
        raise credentials_exception

    # Verify token is valid in database
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT user_id FROM token
                    WHERE access_toke = %s AND user_id = %s AND status = true
                    """,
                    (access_token, user["id"]),
                    # toke is short for token obv... Too deep to fix now lol
                )
                token_user = cur.fetchone()

                if not token_user:
                    raise credentials_exception
    except Exception as e:
        print(f"Error verifying access token: {e}")
        raise credentials_exception

    return user
