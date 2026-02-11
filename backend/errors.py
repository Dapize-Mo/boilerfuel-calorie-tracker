"""
Custom error classes for better error handling and user feedback.
"""


class APIError(Exception):
    """Base class for API errors with status code and message."""
    
    def __init__(self, message, status_code=500, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload
    
    def to_dict(self):
        """Convert error to dictionary for JSON response."""
        rv = dict(self.payload or ())
        rv['error'] = self.message
        rv['status'] = self.status_code
        return rv


class ValidationError(APIError):
    """Raised when input validation fails."""
    
    def __init__(self, message, payload=None):
        super().__init__(message, status_code=400, payload=payload)


class AuthenticationError(APIError):
    """Raised when authentication fails."""
    
    def __init__(self, message="Authentication required", payload=None):
        super().__init__(message, status_code=401, payload=payload)


class AuthorizationError(APIError):
    """Raised when user lacks required permissions."""
    
    def __init__(self, message="Insufficient permissions", payload=None):
        super().__init__(message, status_code=403, payload=payload)


class NotFoundError(APIError):
    """Raised when a requested resource is not found."""
    
    def __init__(self, message="Resource not found", payload=None):
        super().__init__(message, status_code=404, payload=payload)


class ConflictError(APIError):
    """Raised when a request conflicts with existing data."""
    
    def __init__(self, message="Resource conflict", payload=None):
        super().__init__(message, status_code=409, payload=payload)


class DatabaseError(APIError):
    """Raised when a database operation fails."""
    
    def __init__(self, message="Database error occurred", payload=None):
        super().__init__(message, status_code=500, payload=payload)


class ExternalAPIError(APIError):
    """Raised when an external API call fails."""
    
    def __init__(self, message="External service unavailable", payload=None):
        super().__init__(message, status_code=503, payload=payload)
