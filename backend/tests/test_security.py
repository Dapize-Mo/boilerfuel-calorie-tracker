"""
Tests for security module.
"""
import pytest
from security import (
    hash_password, verify_password, validate_password_strength,
    validate_email, sanitize_input
)


class TestPasswordHashing:
    """Test password hashing and verification."""
    
    def test_hash_password(self):
        """Test password hashing creates consistent hash."""
        password = "MyPassword123!@#"
        hashed = hash_password(password)
        
        # Hash should be different each time (salt varies)
        assert hashed != password
        assert len(hashed) > len(password)
    
    def test_verify_password_success(self):
        """Test password verification with correct password."""
        password = "MyPassword123!@#"
        hashed = hash_password(password)
        
        assert verify_password(hashed, password) is True
    
    def test_verify_password_failure(self):
        """Test password verification with wrong password."""
        password = "MyPassword123!@#"
        hashed = hash_password(password)
        
        assert verify_password(hashed, "WrongPassword") is False
    
    def test_verify_password_case_sensitive(self):
        """Test that password verification is case-sensitive."""
        password = "MyPassword123!@#"
        hashed = hash_password(password)
        
        assert verify_password(hashed, "mypassword123!@#") is False


class TestPasswordStrengthValidation:
    """Test password strength validation."""
    
    def test_weak_password_too_short(self):
        """Test weak password detection - too short."""
        valid, msg = validate_password_strength("Pass1!")
        assert not valid
        assert "8 characters" in msg
    
    def test_weak_password_no_uppercase(self):
        """Test weak password detection - no uppercase."""
        valid, msg = validate_password_strength("password123!@#")
        assert not valid
        assert "uppercase" in msg
    
    def test_weak_password_no_lowercase(self):
        """Test weak password detection - no lowercase."""
        valid, msg = validate_password_strength("PASSWORD123!@#")
        assert not valid
        assert "lowercase" in msg
    
    def test_weak_password_no_number(self):
        """Test weak password detection - no number."""
        valid, msg = validate_password_strength("PasswordTest!@#")
        assert not valid
        assert "number" in msg
    
    def test_weak_password_no_special_char(self):
        """Test weak password detection - no special character."""
        valid, msg = validate_password_strength("Password123")
        assert not valid
        assert "special character" in msg
    
    def test_strong_password(self):
        """Test strong password validation."""
        valid, msg = validate_password_strength("MyPassword123!@#")
        assert valid
        assert "strong" in msg.lower()


class TestEmailValidation:
    """Test email validation."""
    
    def test_valid_email(self):
        """Test valid email addresses."""
        assert validate_email("user@example.com") is True
        assert validate_email("john.doe@company.co.uk") is True
        assert validate_email("test+tag@domain.org") is True
    
    def test_invalid_email_no_at(self):
        """Test invalid email - no @ symbol."""
        assert validate_email("userexample.com") is False
    
    def test_invalid_email_no_domain(self):
        """Test invalid email - no domain."""
        assert validate_email("user@") is False
    
    def test_invalid_email_no_tld(self):
        """Test invalid email - no TLD."""
        assert validate_email("user@domain") is False
    
    def test_invalid_email_multiple_at(self):
        """Test invalid email - multiple @ symbols."""
        assert validate_email("user@@example.com") is False


class TestInputSanitization:
    """Test input sanitization."""
    
    def test_sanitize_normal_input(self):
        """Test sanitization of normal input."""
        result = sanitize_input("Hello World")
        assert result == "Hello World"
    
    def test_sanitize_removes_control_chars(self):
        """Test sanitization removes control characters."""
        result = sanitize_input("Hello\x00World")
        assert result == "HelloWorld"
    
    def test_sanitize_trims_whitespace(self):
        """Test sanitization trims whitespace."""
        result = sanitize_input("  Hello World  ")
        assert result == "Hello World"
    
    def test_sanitize_respects_max_length(self):
        """Test sanitization respects max length."""
        result = sanitize_input("Hello World", max_length=5)
        assert result == "Hello"
    
    def test_sanitize_non_string_input(self):
        """Test sanitization with non-string input."""
        result = sanitize_input(None)
        assert result == ""
        
        result = sanitize_input(123)
        assert result == ""
