from fastapi import APIRouter
from api.endpoints import users, auth

api_router = APIRouter(prefix="/api")


api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
