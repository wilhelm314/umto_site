import os
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from fastapi.responses import FileResponse
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from api.router import api_router  # Import the central router
from core.database import _pool


@asynccontextmanager
async def lifespan(instance: FastAPI):
    _pool.open()
    yield
    _pool.close()


app = FastAPI(lifespan=lifespan)
# Add CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.include_router(api_router)

# Include the central API router
# app.mount("/", StaticFiles(directory="../static", html=True), name="static")

# @app.get("/")
# async def index():
#     return FileResponse("static/index.html")


# Fallback route for SPA client-side routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Check if the path exists as a file
    if os.path.exists(os.path.join("static", full_path)):
        return FileResponse(os.path.join("static", full_path))

    # Otherwise serve index.html for client-side routing
    return FileResponse("static/index.html")


def use_route_names_as_operation_ids(app: FastAPI) -> None:
    """
    Simplify operation IDs so that generated API clients have simpler function
    names.
    """
    for route in app.routes:
        if isinstance(route, APIRoute):
            route.operation_id = route.name


use_route_names_as_operation_ids(app)

if __name__ == "__main__":
    import uvicorn
    import argparse

    parser = argparse.ArgumentParser(description="Run FastAPI server.")
    parser.add_argument(
        "--host", type=str, default="0.0.0.0", help="Host to run the server on"
    )
    parser.add_argument(
        "--port", type=int, default=8000, help="Port to run the server on"
    )
    parser.add_argument(
        "--workers", type=int, default=8, help="Number of worker processes to run"
    )
    args = parser.parse_args()
    uvicorn.run("main:app", host=args.host, port=args.port, workers=args.workers)
