from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    """Token schema for API responses"""
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    """Token data schema for internal use"""
    username: Optional[str] = None

class RefreshToken(BaseModel):
    """Schema for refresh token requests"""
    refresh_token: str