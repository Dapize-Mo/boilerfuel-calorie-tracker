"""
Pytest configuration and shared fixtures for the BoilerFuel backend test suite.
Uses an in-memory SQLite database so tests run without a real PostgreSQL instance.
"""

import os
import pytest

# Configure a lightweight in-memory SQLite DB *before* importing the app so
# Flask-SQLAlchemy picks up the URI at module-load time.
os.environ.setdefault('DATABASE_URL', 'sqlite://')
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret-key')
os.environ.setdefault('ADMIN_PASSWORD', 'test-admin-pass')

from app import app as flask_app, db as _db  # noqa: E402  (import after env setup)


@pytest.fixture(scope='session')
def app():
    """Return a Flask application configured for testing."""
    flask_app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI='sqlite://',
        JWT_SECRET_KEY='test-secret-key',
        ADMIN_PASSWORD='test-admin-pass',
        RATELIMIT_ENABLED=False,
    )
    yield flask_app


@pytest.fixture(scope='session')
def _db_setup(app):
    """Create all tables once per test session."""
    with app.app_context():
        _db.create_all()
    yield _db
    with app.app_context():
        _db.drop_all()


@pytest.fixture()
def client(app, _db_setup):
    """Return a test client with a clean database for each test."""
    with app.app_context():
        # Wipe tables before each test for isolation
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()

    with app.test_client() as c:
        yield c


@pytest.fixture()
def admin_token(client):
    """Return a valid JWT admin token."""
    resp = client.post(
        '/api/admin/login',
        json={'password': 'test-admin-pass'},
    )
    assert resp.status_code == 200, f"Admin login failed: {resp.get_json()}"
    return resp.get_json()['token']


@pytest.fixture()
def auth_headers(admin_token):
    """Return Authorization headers for admin-protected endpoints."""
    return {'Authorization': f'Bearer {admin_token}'}
