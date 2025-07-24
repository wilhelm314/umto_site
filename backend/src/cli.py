import argparse
from datetime import datetime
import os
from pathlib import Path
import secrets
import subprocess
import psycopg
from fastapi import HTTPException
from utils.auth import get_password_hash
from core.database import get_db_connection
import re


def get_password_hash_cmd(args):
    """
    Hash a password using a secure hashing algorithm.
    """
    password = args.password

    if not password:
        raise ValueError("Password cannot be empty")

    # Use a secure hashing algorithm (e.g., bcrypt)
    print(
        f'pwd_hash: "{get_password_hash(password)}"'
    )  # Assuming get_password_hash is defined in utils.auth


def create_user(args):
    """
    Create a new user with the provided username, email, and optional password.
    """
    # Use the provided password or default to a predefined one
    password = args.password

    assert password, "Must give a password"

    hashed_password = get_password_hash(password)

    print(
        f"Creating user with username: {args.username}, email: {args.email}, password: {password}"
    )
    try:
        # Connect to the database
        with get_db_connection() as conn:  # type: ignore
            with conn.cursor() as cur:
                # Insert the user into the database
                cur.execute(
                    """
                    INSERT INTO users (full_name, email, password_hash)
                    VALUES (%s, %s, %s)
                    RETURNING id
                    """,
                    (
                        args.username,
                        args.email,
                        hashed_password,
                    ),
                )
                user_id = cur.fetchone()

                assert user_id, (
                    "Something went wrong creating user - did not get back id"
                )

                conn.commit()

        print(f"User created successfully with ID: {user_id[0]}")  # type: ignore

    except psycopg.errors.UniqueViolation:
        print("Error: A user with this email already exists.")
    except Exception as e:
        print(f"Failed to create user: {str(e)}")


def create_secrets(args):
    """
    Create a secrets file with auto-generated values.
    """
    # Auto-generated values
    jwt_secret_key = secrets.token_hex(32)
    jwt_refresh_secret_key = secrets.token_hex(32)
    pwd_salt = secrets.token_hex(16)

    print(f"""
JWT_SECRET_KEY={jwt_secret_key}
JWT_REFRESH_SECRET_KEY={jwt_refresh_secret_key}
PWD_SALT={pwd_salt}
    """)


def create_env(*_):
    # Default values
    db_name = "umto"
    db_user = "postgres"
    db_host = "localhost"
    db_port = "5432"
    db_password = "postgres"
    # Auto-generated values
    jwt_secret_key = secrets.token_hex(32)
    jwt_refresh_secret_key = secrets.token_hex(32)
    pwd_salt = secrets.token_hex(16)

    # Prompt for ANTHROPIC_API_KEY
    anthropic_api_key = input("Enter ANTHROPIC_API_KEY: ")

    # Create .env file
    env_content = f"""DB_NAME={db_name}

    
DB_USER={db_user}
DB_HOST={db_host}
DB_PORT={db_port}
DB_PASSWORD={db_password}
JWT_SECRET_KEY={jwt_secret_key}
JWT_REFRESH_SECRET_KEY={jwt_refresh_secret_key}
PWD_SALT={pwd_salt}
ANTHROPIC_API_KEY={anthropic_api_key}
"""
    with open("../.env", "w") as env_file:
        env_file.write(env_content)

    print(".env file created successfully.")


def get_db_config():
    """
    Get database configuration from environment variables or use defaults.
    """
    return {
        "dbname": os.getenv("DB_NAME", "jaaw_db1"),
        "user": os.getenv("DB_USER", "postgres"),
        "host": os.getenv("DB_HOST", "localhost"),
        "port": os.getenv("DB_PORT", "5432"),
        "password": os.getenv("DB_PASSWORD", "postgres"),
    }


def get_installed_extensions():
    """
    Get list of all installed extensions in the database.
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT extname 
                    FROM pg_extension 
                    WHERE extname NOT IN ('plpgsql')
                    ORDER BY extname;
                """)
                extensions = [row[0] for row in cur.fetchall()]
                return extensions
    except Exception as e:
        print(f"Warning: Could not retrieve extensions: {str(e)}")
        return []


def create_database_setup_header(db_config):
    """
    Create a header with database setup statements including user, database creation, and extensions.
    """
    extensions = get_installed_extensions()

    header = "-- Database setup statements\n"
    header += f"DO $$ \n"
    header += f"BEGIN\n"
    header += f"   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '{db_config['user']}') THEN\n"
    header += f"      CREATE USER {db_config['user']};\n"
    header += f"   END IF;\n"
    header += f"END\n"
    header += f"$$;\n"
    header += (
        f"ALTER USER {db_config['user']} WITH PASSWORD '{db_config['password']}';\n"
    )
    header += f"DROP DATABASE IF EXISTS {db_config['dbname']};\n"
    header += f"CREATE DATABASE {db_config['dbname']} WITH TEMPLATE = template0 ENCODING = 'UTF8';\n"
    header += f"ALTER DATABASE {db_config['dbname']} OWNER TO {db_config['user']};\n\n"
    header += f"\\connect {db_config['dbname']}\n\n"

    if extensions:
        header += "-- Extensions found in database\n"
        for ext in extensions:
            header += f"CREATE EXTENSION IF NOT EXISTS {ext};\n"
        header += "\n"

    return header


def backup_db_schema(args):
    """
    Create a database backup with schema only (no data).
    """
    db_config = get_db_config()
    timestamp = datetime.now().strftime("%d%m%Y_%H%M%S")

    # Create backups directory if it doesn't exist
    backup_dir = Path("../backups")
    backup_dir.mkdir(exist_ok=True)

    backup_file = backup_dir / f"schema_backup_{timestamp}.sql"

    try:
        # Get installed extensions first
        extensions = get_installed_extensions()
        print(f"Found extensions: {', '.join(extensions) if extensions else 'none'}")

        # Prepare pg_dump command for schema only
        cmd = [
            "pg_dump",
            f"--host={db_config['host']}",
            f"--port={db_config['port']}",
            f"--username={db_config['user']}",
            f"--dbname={db_config['dbname']}",
            "--schema-only",  # Schema only, no data
            "--no-owner",  # Don't include ownership commands
            "--no-privileges",  # Don't include privilege commands
            "--inserts",  # Use INSERT commands instead of COPY
            "--clean",  # Include DROP statements before CREATE
            "--if-exists",  # Use IF EXISTS with DROP statements
            "--verbose",
        ]

        # Set password via environment variable
        env = os.environ.copy()
        env["PGPASSWORD"] = db_config["password"]

        print(f"Creating schema backup: {backup_file}")

        with open(backup_file, "w") as f:
            # Add custom header
            f.write("--\n")
            f.write(f"-- PostgreSQL database schema backup\n")
            f.write(
                f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            )
            f.write(f"-- Database: {db_config['dbname']}\n")
            f.write("-- Schema only (no data)\n")
            f.write("--\n\n")

            # Add database setup and extensions header
            db_setup_header = create_database_setup_header(db_config)
            f.write(db_setup_header)

            # Run pg_dump and write to file
            result = subprocess.run(
                cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env
            )

            if result.returncode == 0:
                # Write the pg_dump output to file
                f.write(result.stdout)
            else:
                raise Exception(f"pg_dump failed: {result.stderr}")

        if result.returncode == 0:
            print(f"Schema backup created successfully: {backup_file}")
            print(f"File size: {backup_file.stat().st_size / 1024:.1f} KB")
            if extensions:
                print(f"Included extensions: {', '.join(extensions)}")
        else:
            print(f"Error creating backup: {result.stderr}")
            # Remove incomplete backup file
            if backup_file.exists():
                backup_file.unlink()

    except FileNotFoundError:
        print(
            "Error: pg_dump not found. Please ensure PostgreSQL client tools are installed."
        )
    except Exception as e:
        print(f"Failed to create schema backup: {str(e)}")
        # Remove incomplete backup file if it exists
        if backup_file.exists():
            backup_file.unlink()


def backup_db_full(args):
    """
    Create a full database backup with schema and data.
    """
    db_config = get_db_config()
    timestamp = datetime.now().strftime("%d%m%Y_%H%M%S")

    # Create backups directory if it doesn't exist
    backup_dir = Path("../backups")
    backup_dir.mkdir(exist_ok=True)
    if "DB_CONNECTION_STRING" in os.environ:
        conn_str = os.environ["DB_CONNECTION_STRING"]
    else:
        conn_str = (
            f"postgresql://{db_config['user']}:{db_config['password']}@"
            f"{db_config['host']}:{db_config['port']}/{db_config['dbname']}"
        )
    # Extract host from connection string for backup file naming
    match = re.search(r"@([^:/]+)", conn_str)
    host_name = match.group(1) if match else db_config["host"]

    backup_file = backup_dir / f"full_backup_{host_name}_{timestamp}.sql"

    try:
        # Get installed extensions first
        extensions = get_installed_extensions()
        print(f"Found extensions: {', '.join(extensions) if extensions else 'none'}")

        # Prepare pg_dump command for full backup
        cmd = [
            "pg_dump",
            conn_str,
            "--no-owner",  # Don't include ownership commands
            "--no-privileges",  # Don't include privilege commands
            "--inserts",  # Use INSERT commands instead of COPY
            "--clean",  # Include DROP statements before CREATE
            "--if-exists",  # Use IF EXISTS with DROP statements
            "--verbose",
        ]

        # Set password via environment variable
        env = os.environ.copy()
        env["PGPASSWORD"] = db_config["password"]

        print(f"Creating full backup: {backup_file}")

        with open(backup_file, "w") as f:
            # Add custom header
            f.write("--\n")
            f.write(f"-- PostgreSQL database full backup\n")
            f.write(
                f"-- Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            )
            f.write(f"-- Database: {db_config['dbname']}\n")
            f.write("-- Includes schema and data\n")
            f.write("--\n\n")

            # Add database setup and extensions header
            db_setup_header = create_database_setup_header(db_config)
            f.write(db_setup_header)

            # Run pg_dump and write to file
            result = subprocess.run(
                cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env
            )

            if result.returncode == 0:
                # Write the pg_dump output to file
                f.write(result.stdout)
            else:
                raise Exception(f"pg_dump failed: {result.stderr}")

        if result.returncode == 0:
            print(f"Full backup created successfully: {backup_file}")
            print(f"File size: {backup_file.stat().st_size / 1024:.1f} KB")
            if extensions:
                print(f"Included extensions: {', '.join(extensions)}")
        else:
            print(f"Error creating backup: {result.stderr}")
            # Remove incomplete backup file
            if backup_file.exists():
                backup_file.unlink()

    except FileNotFoundError:
        print(
            "Error: pg_dump not found. Please ensure PostgreSQL client tools are installed."
        )
    except Exception as e:
        print(f"Failed to create full backup: {str(e)}")
        # Remove incomplete backup file if it exists
        if backup_file.exists():
            backup_file.unlink()


def restore_db(args):
    """
    Restore database from a backup file.
    """
    backup_file = Path(args.file)

    if not backup_file.exists():
        print(f"Error: Backup file '{backup_file}' not found.")
        return

    db_config = get_db_config()

    try:
        # Prepare psql command for restore

        cmd = " ".join(
            [
                f"cp {str(backup_file)} /tmp/sql.sql",
                "&&",
                "sudo",
                "-u",
                "postgres",
                "psql",
                "-v",
                "ON_ERROR_STOP=1",
                "-a",
                "-f",
                "/tmp/sql.sql",
            ]
        )

        # Set password via environment variable
        env = os.environ.copy()
        env["PGPASSWORD"] = db_config["password"]

        print(f"Restoring database from: {backup_file}")

        if not args.force:
            confirm = input(
                "This will overwrite the current database. Continue? (y/N): "
            )
            if confirm.lower() != "y":
                print("Restore cancelled.")
                return

        result = subprocess.run(["bash", "-c", cmd], env=env, text=True)

        if result.returncode == 0:
            print("Database restored successfully!")
        else:
            print(f"Error restoring database. Return code: {result.returncode}")

    except FileNotFoundError:
        print(
            "Error: psql not found. Please ensure PostgreSQL client tools are installed."
        )
    except Exception as e:
        print(f"Failed to restore database: {str(e)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Existing commands
    create_user_parser = subparsers.add_parser("create_user", help="Create a new user")
    create_user_parser.add_argument(
        "--username", required=True, help="Username for the new user"
    )
    create_user_parser.add_argument(
        "--email", required=True, help="Email for the new user"
    )
    create_user_parser.add_argument("--password", help="Password for the new user")

    add_user_to_organisation = subparsers.add_parser(
        "add_user_to_organisation",
        help="Adds a given user to a given organisation with the given permissions",
    )
    add_user_to_organisation.add_argument("--user_id", required=True, help="user id")
    add_user_to_organisation.add_argument(
        "--organisation_id", required=True, help="organisation id"
    )
    add_user_to_organisation.add_argument(
        "--permission_type",
        required=True,
        help="permissions to be granted - must follow: 7 >= perm >= 0, it is a standard int3 permission with access, read, write in the 1, 2, and 4 bit.",
    )

    create_env_parser = subparsers.add_parser(
        "create_env", help="Create a new environment"
    )

    create_org_parser = subparsers.add_parser(
        "create_organisation", help="Create a new organisation"
    )
    create_org_parser.add_argument(
        "--name",
        required=True,
        help="Name of new organisation",
    )

    reset_db_parser = subparsers.add_parser(
        "reset_db", help="Reset the development database with initialization data"
    )

    # New backup commands
    backup_schema_parser = subparsers.add_parser(
        "backup_schema", help="Create a database schema backup (no data)"
    )

    backup_full_parser = subparsers.add_parser(
        "backup_full", help="Create a full database backup (schema + data)"
    )

    restore_parser = subparsers.add_parser(
        "restore_db", help="Restore database from backup file"
    )
    restore_parser.add_argument("file", help="Path to backup file to restore")
    restore_parser.add_argument(
        "--force", action="store_true", help="Skip confirmation prompt"
    )

    subparsers.add_parser(
        "create_secrets", help="Create a secrets file with auto-generated values"
    )

    get_password_hash_parser = subparsers.add_parser("get_pwdhash", help="get_pwdhash")

    get_password_hash_parser.add_argument(
        "--password", help="Password for the new user"
    )

    actions = {
        "create_user": create_user,
        "create_env": create_env,
        "backup_schema": backup_db_schema,
        "backup_full": backup_db_full,
        "restore_db": restore_db,
        "create_secrets": create_secrets,
        "get_pwdhash": get_password_hash_cmd,
    }

    args = parser.parse_args()
    actions[args.command](args)
