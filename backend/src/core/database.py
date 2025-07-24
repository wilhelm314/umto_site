# Database connection parameters from environment variables
import os

from dotenv import load_dotenv
import psycopg
import psycopg_pool
import atexit

load_dotenv()


DB_PARAMS = {
    "dbname": os.getenv("DB_NAME", ""),
    "user": os.getenv("DB_USER", ""),
    "password": os.getenv("DB_PASSWORD", ""),
    "host": os.getenv("DB_HOST", ""),
    "port": os.getenv("DB_PORT", ""),
}

if "DB_CONNECTION_STRING" in os.environ:
    _pool = psycopg_pool.ConnectionPool(os.environ["DB_CONNECTION_STRING"], open=False)
    _pool_async = psycopg_pool.AsyncConnectionPool(
        os.environ["DB_CONNECTION_STRING"], open=False
    )
    atexit.register(_pool.close)
    atexit.register(_pool_async.close)
else:
    _pool = psycopg_pool.ConnectionPool(
        f"postgresql://{DB_PARAMS['user']}:{DB_PARAMS['password']}@{DB_PARAMS['host']}:{DB_PARAMS['port']}/{DB_PARAMS['dbname']}",
        min_size=1,
        max_size=10,
        open=False,
    )

    _pool_async = psycopg_pool.AsyncConnectionPool(
        f"postgresql://{DB_PARAMS['user']}:{DB_PARAMS['password']}@{DB_PARAMS['host']}:{DB_PARAMS['port']}/{DB_PARAMS['dbname']}",
        min_size=1,
        max_size=10,
        open=False,
    )


def get_db_connection():
    if _pool.closed:
        _pool.open()
    """Create and return a database connection"""
    try:
        return _pool.connection()
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise


async def get_async_db_connection():
    if _pool_async.closed:
        await _pool_async.open()
    """Create and return an asynchronous database connection"""
    try:
        return _pool_async.connection()
    except Exception as e:
        print(f"Error connecting to database: {e}")
        raise
