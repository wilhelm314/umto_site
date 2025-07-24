from typing import Optional
from pydantic import BaseModel


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str


class AdminCreateUserRequest(BaseModel):
    full_name: str
    email: str
    group_id: Optional[int]


class AdminUpdateUserRequest(BaseModel):
    id: int
    full_name: str
    email: str
    group_id: Optional[int]


class AdminGetClientRequest(BaseModel):
    id: int


class AdminDeleteClientRequest(BaseModel):
    id: int


class AdminDeleteClientsRequest(BaseModel):
    ids: list[int]
