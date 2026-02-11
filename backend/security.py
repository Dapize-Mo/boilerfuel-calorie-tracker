"""
Security utility functions for authentication and validation.
"""
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from functools import wraps
from flask import request, jsonify
import re

# Initialize password hasher
ph = PasswordHasher()


def hash_password(password: str) -> str:
    """
    Hash a plain text password using Argon2.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return ph.hash(password)


def verify_password(hashed: str, plain: str) -> bool:
    """
    Verify a plain text password against a hash.
    
    Args:
        hashed: Hashed password from database
        plain: Plain text password to verify
        
    Returns:
        True if password matches, False otherwise
    """
    try:
        ph.verify(hashed, plain)
        return True
    except (VerifyMismatchError, InvalidHashError):
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets minimum requirements.
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple of (is_valid, message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain number"
    if not re.search(r'[!@#$%^&*]', password):
        return False, "Password must contain special character (!@#$%^&*)"
    
    return True, "Password is strong"


def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid email format
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def sanitize_input(value: str, max_length: int = 255) -> str:
    """
    Sanitize user input by removing/escaping dangerous characters.
    
    Args:
        value: Input string to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
    """
    if not isinstance(value, str):
        return ""
    
    # Trim to max length
    value = value[:max_length].strip()
    
    # Remove control characters
    value = ''.join(char for char in value if char.isprintable())
    
    return value


def rate_limit_key_func():
    """
    Generate rate limit key based on IP address.
    Handles X-Forwarded-For for proxied requests.
    """
    if request.headers.getlist("X-Forwarded-For"):
        return request.headers.getlist("X-Forwarded-For")[0]
    return request.remote_addr
