"""Alembic environment configuration for BoilerFuel.

This module configures Alembic to work with the Flask application and
Flask-SQLAlchemy models. It supports both online (connected to a live
database) and offline (generating SQL scripts) migration modes.

The database URL is resolved in the following order:
  1. DATABASE_URL environment variable
  2. Flask app config SQLALCHEMY_DATABASE_URI
  3. alembic.ini sqlalchemy.url (fallback)
"""

from __future__ import annotations

import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# ---------------------------------------------------------------------------
# Ensure the backend package is importable regardless of where Alembic is
# invoked from.  We add the backend directory (parent of this migrations
# package) as well as the project root (parent of backend) to sys.path.
# ---------------------------------------------------------------------------
_this_dir = os.path.abspath(os.path.dirname(__file__))
_backend_dir = os.path.abspath(os.path.join(_this_dir, os.pardir))
_project_root = os.path.abspath(os.path.join(_backend_dir, os.pardir))

for _path in (_backend_dir, _project_root):
    if _path not in sys.path:
        sys.path.insert(0, _path)

# ---------------------------------------------------------------------------
# Import the Flask app and its SQLAlchemy instance so that Alembic can
# discover model metadata for autogenerate support.
# ---------------------------------------------------------------------------
from app import app as flask_app  # noqa: E402
from app import db  # noqa: E402

# Alembic Config object – provides access to values in alembic.ini.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model metadata used by Alembic autogenerate to detect schema changes.
target_metadata = db.metadata


def _get_database_url() -> str:
    """Resolve the database URL from the environment or Flask config.

    Priority:
        1. DATABASE_URL env var (handles postgres:// -> postgresql:// fixup)
        2. SQLALCHEMY_DATABASE_URI from the Flask app config
        3. sqlalchemy.url from alembic.ini (last resort)
    """
    url = os.environ.get("DATABASE_URL")

    if not url:
        with flask_app.app_context():
            url = flask_app.config.get("SQLALCHEMY_DATABASE_URI")

    if not url:
        url = config.get_main_option("sqlalchemy.url")

    if url is None:
        raise RuntimeError(
            "No database URL configured. Set DATABASE_URL, configure "
            "SQLALCHEMY_DATABASE_URI in the Flask app, or set sqlalchemy.url "
            "in alembic.ini."
        )

    # Heroku / Railway style postgres:// -> postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This emits the SQL statements that *would* be executed against the
    database, without actually connecting.  Useful for generating migration
    SQL scripts for review or manual application.
    """
    url = _get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates an Engine and associates a connection with the migration
    context so that migrations are executed against the live database.
    """
    # Override the sqlalchemy.url in the ini-file config so that
    # engine_from_config picks up the correct URL.
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = _get_database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------------------------
# Entrypoint – Alembic calls this module; determine online vs offline.
# ---------------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
