"""
Tests for custom error handling.
"""
import pytest
from errors import (
	APIError, ValidationError, AuthenticationError, AuthorizationError,
	NotFoundError, ConflictError, DatabaseError, ExternalAPIError
)


class TestAPIError:
	"""Test APIError base class."""
	
	def test_api_error_creation(self):
		"""Test creating an API error."""
		error = APIError("Test error", status_code=400)
		assert error.message == "Test error"
		assert error.status_code == 400
		assert error.payload is None
	
	def test_api_error_to_dict(self):
		"""Test converting error to dictionary."""
		error = APIError("Test error", status_code=400, payload={'field': 'value'})
		result = error.to_dict()
		assert result['error'] == "Test error"
		assert result['status'] == 400
		assert result['field'] == 'value'


class TestValidationError:
	"""Test ValidationError."""
	
	def test_validation_error_status_code(self):
		"""Test that ValidationError has 400 status code."""
		error = ValidationError("Invalid input")
		assert error.status_code == 400
		assert error.message == "Invalid input"


class TestAuthenticationError:
	"""Test AuthenticationError."""
	
	def test_authentication_error_status_code(self):
		"""Test that AuthenticationError has 401 status code."""
		error = AuthenticationError()
		assert error.status_code == 401
		assert error.message == "Authentication required"
	
	def test_authentication_error_custom_message(self):
		"""Test AuthenticationError with custom message."""
		error = AuthenticationError("Invalid credentials")
		assert error.message == "Invalid credentials"


class TestAuthorizationError:
	"""Test AuthorizationError."""
	
	def test_authorization_error_status_code(self):
		"""Test that AuthorizationError has 403 status code."""
		error = AuthorizationError()
		assert error.status_code == 403


class TestNotFoundError:
	"""Test NotFoundError."""
	
	def test_not_found_error_status_code(self):
		"""Test that NotFoundError has 404 status code."""
		error = NotFoundError()
		assert error.status_code == 404


class TestConflictError:
	"""Test ConflictError."""
	
	def test_conflict_error_status_code(self):
		"""Test that ConflictError has 409 status code."""
		error = ConflictError()
		assert error.status_code == 409


class TestDatabaseError:
	"""Test DatabaseError."""
	
	def test_database_error_status_code(self):
		"""Test that DatabaseError has 500 status code."""
		error = DatabaseError()
		assert error.status_code == 500


class TestExternalAPIError:
	"""Test ExternalAPIError."""
	
	def test_external_api_error_status_code(self):
		"""Test that ExternalAPIError has 503 status code."""
		error = ExternalAPIError()
		assert error.status_code == 503
