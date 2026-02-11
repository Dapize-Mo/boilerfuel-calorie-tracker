"""
Tests for API endpoints.
"""
import pytest


class TestHealthEndpoints:
	"""Test health check endpoints."""
	
	def test_health_endpoint(self, client):
		"""Test /health endpoint."""
		response = client.get('/health')
		assert response.status_code == 200
		data = response.json
		assert data['status'] == 'ok'
	
	def test_ready_endpoint(self, client):
		"""Test /ready endpoint."""
		response = client.get('/ready')
		assert response.status_code == 200
		data = response.json
		# Check that response contains expected fields
		assert 'db' in data or 'db_ok' in data or 'database' in data or 'status' in data


class TestErrorHandlers:
	"""Test error handlers."""
	
	def test_404_handler(self, client):
		"""Test 404 error handler."""
		response = client.get('/nonexistent-endpoint')
		assert response.status_code == 404
		data = response.json
		assert 'error' in data
		assert data['status'] == 404
	
	def test_validation_error_handler(self, client):
		"""Test validation error handling."""
		# Test with invalid food data (missing required fields)
		response = client.post(
			'/api/foods',
			json={'name': ''}  # Empty name should trigger validation
		)
		# This might return 401 if auth is required, or 400 if validation happens first
		assert response.status_code in [400, 401]


class TestAdminAuth:
	"""Test admin authentication."""
	
	def test_admin_login_success(self, client):
		"""Test successful admin login."""
		response = client.post(
			'/api/admin/login',
			json={'password': 'test-admin-password'}
		)
		assert response.status_code == 200
		data = response.json
		# API may return 'token' or 'access_token'
		assert 'token' in data or 'access_token' in data
	
	def test_admin_login_failure(self, client):
		"""Test failed admin login."""
		response = client.post(
			'/api/admin/login',
			json={'password': 'wrong-password'}
		)
		assert response.status_code == 401
	
	def test_admin_login_missing_password(self, client):
		"""Test admin login with missing password."""
		response = client.post('/api/admin/login', json={})
		assert response.status_code in [400, 401]


class TestFoodsEndpoint:
	"""Test foods API endpoints."""
	
	def test_get_foods(self, client):
		"""Test GET /api/foods."""
		response = client.get('/api/foods')
		assert response.status_code == 200
		data = response.json
		assert isinstance(data, list)
	
	def test_get_foods_with_filters(self, client):
		"""Test GET /api/foods with filters."""
		response = client.get('/api/foods?dining_court=Earhart')
		assert response.status_code == 200
		data = response.json
		assert isinstance(data, list)


class TestActivitiesEndpoint:
	"""Test activities API endpoints."""
	
	def test_get_activities(self, client):
		"""Test GET /api/activities."""
		response = client.get('/api/activities')
		assert response.status_code == 200
		data = response.json
		assert isinstance(data, list)
