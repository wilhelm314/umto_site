from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import psycopg
from typing import Optional

from schemas.auth import Token
from utils.auth import (
    authenticate_user,
    create_access_token,
    save_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM,
)
from core.database import get_db_connection
from jose import jwt, JWTError

router = APIRouter()

# Cookie settings
COOKIE_SECURE = False  # Set to False in development if not using HTTPS
COOKIE_HTTPONLY = True
COOKIE_SAMESITE = "lax"
ACCESS_TOKEN_EXPIRE_SECONDS = ACCESS_TOKEN_EXPIRE_MINUTES * 60


@router.post("/login")
async def login_for_access_token(
    response: Response,  # for manipulating the response sent back to the browser eg. response.set_cookie()
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """
    OAuth2 compatible token login, set cookies for future requests
    """
    # Authenticate the user
    user = await authenticate_user(
        form_data.username, form_data.password
    )  # username here is email
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user account is active
    if user["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not active",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )

    # Save tokens to database
    token_saved = await save_token(user["id"], access_token)
    if not token_saved:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create authentication token",
        )

    # Update user's last login time and count
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE users
                    SET last_login_at = %s, login_count = login_count + 1
                    WHERE id = %s
                    """,
                    (datetime.utcnow(), user["id"]),
                )
                conn.commit()
    except Exception as e:
        # Don't fail the login if this update fails
        print(f"Error updating login stats: {e}")

    # Set cookies in the response
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS,
        expires=ACCESS_TOKEN_EXPIRE_SECONDS,
        httponly=COOKIE_HTTPONLY,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )

    # Return success response
    return {"message": "Login successful"}


@router.post("/logout")
async def logout(response: Response, current_user=Depends(get_current_user)):
    """
    Logout a user by invalidating their tokens and clearing cookies
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE token
                    SET status = false
                    WHERE user_id = %s
                    """,
                    (current_user["id"],),
                )
                conn.commit()

        # Clear cookies
        response.delete_cookie(
            key="access_token",
            httponly=COOKIE_HTTPONLY,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
        )
        response.delete_cookie(
            key="refresh_token",
            httponly=COOKIE_HTTPONLY,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
        )

        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}",
        )
