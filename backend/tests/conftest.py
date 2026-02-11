"""
Test configuration and fixtures for pytest.
"""
import os
import pytest
from app import app as flask_app, db


@pytest.fixture
def app():
	"""Create test Flask application."""
	flask_app.config.update({
		'TESTING': True,
		'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
		'JWT_SECRET_KEY': 'test-secret-key',
		'ADMIN_PASSWORD': 'test-admin-password'
	})
	
	with flask_app.app_context():
		db.create_all()
		yield flask_app
		db.session.remove()
		db.drop_all()


@pytest.fixture
def client(app):
	"""Create test client."""
	return app.test_client()


@pytest.fixture
def runner(app):
	"""Create test CLI runner."""
	return app.test_cli_runner()


@pytest.fixture
def admin_token(client):
	"""Get admin authentication token."""
	response = client.post(
		'/api/admin/login',
		json={'password': 'test-admin-password'}
	)
	if response.status_code == 200:
		data = response.json
		return data.get('access_token') or data.get('token')
	return None


@pytest.fixture
def auth_headers(admin_token):
	"""Get headers with admin authentication."""
	if admin_token:
		return {
			'Authorization': f'Bearer {admin_token}',
			'Content-Type': 'application/json'
		}
	return {'Content-Type': 'application/json'}
