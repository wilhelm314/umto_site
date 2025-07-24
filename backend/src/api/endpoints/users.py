from fastapi import APIRouter, Depends, HTTPException
from dotenv import load_dotenv
import psycopg
from schemas.users import (
    UserCreate,
    AdminCreateUserRequest,
    AdminGetClientRequest,
    AdminUpdateUserRequest,
    AdminDeleteClientRequest,
    AdminDeleteClientsRequest,
)
from utils.auth import get_password_hash, get_current_user, get_current_user
from utils.users import generate_password
from core.database import get_db_connection


# Load environment variables
load_dotenv()

ALGORITHM = "HS256"


router = APIRouter()


@router.get("/me")
async def read_users_me(current_user=Depends(get_current_user)):
    """
    Get details of the currently logged in user
    """
    return {
        "id": current_user["id"],
        "full_name": current_user["full_name"],
        "email": current_user["email"],
    }


async def create_user(user: UserCreate, _: dict = Depends(get_current_user)):
    """
    Register a new user
    """
    # Hash the password
    hashed_password = get_password_hash(user.password)

    # Connect to the database
    try:
        # Connect to the database
        with get_db_connection() as conn:  # type: ignore
            # Create a cursor
            with conn.cursor() as cur:
                # Execute the INSERT statement
                cur.execute(
                    """
                    INSERT INTO users (full_name, email, password_hash)
                    VALUES (%s, %s, %s)
                    RETURNING id
                    """,
                    (
                        user.full_name,
                        user.email,
                        hashed_password,
                    ),
                )

                user_id = cur.fetchone()

                conn.commit()

        return {"id": user_id[0], "full_name": user.full_name}  # type: ignore

    except psycopg.errors.UniqueViolation:
        # This catches the specific PostgreSQL unique constraint violation
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-user")
async def admin_create_user(
    request: AdminCreateUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Admin create client user through the dashboard.
    Password is auto generated.
    Only authenticated admin users can access this endpoint.
    """
    # Generate a password for the new client user
    generated_password = generate_password()

    user = UserCreate(
        full_name=request.full_name,
        email=request.email,
        password=generated_password,
    )

    try:
        # Create the client user
        user_result = await create_user(user)

        # Extract the user ID from the result
        client_user_id = user_result["id"]

        # Return success response
        return {
            "message": "User created successfully",
            "user_details": user,
            "user_id": client_user_id,
        }

    except HTTPException as he:
        raise he

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")


@router.post("/update-user")
async def admin_update_user(
    request: AdminUpdateUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Admin update client user through the dashboard.
    Only authenticated admin users can access this endpoint.
    """

    try:
        # Connect to the database
        with get_db_connection() as conn:  # type: ignore
            # Create a cursor
            with conn.cursor() as cur:
                # Execute the INSERT statement
                cur.execute(
                    """
                    UPDATE users 
                    SET full_name = %s, email = %s
                    WHERE id = %s
                    RETURNING id
                    """,
                    (
                        request.full_name,
                        request.email,
                        request.id,
                    ),
                )

                user_id = cur.fetchone()

                conn.commit()

        return {"user_id": user_id[0]}  # type: ignore

    except HTTPException as he:
        raise he

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")
