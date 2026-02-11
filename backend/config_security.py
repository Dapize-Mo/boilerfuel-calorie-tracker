"""
Configuration for application security.
"""
import os
from datetime import timedelta

# Rate limiting
RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
RATELIMIT_ENABLED = os.getenv('RATELIMIT_ENABLED', 'true').lower() == 'true'

# Rate limit rules
RATE_LIMITS = {
    'default': '100 per hour',
    'auth': '5 per minute',  # Strict limit on auth endpoints
    'scrape': '1 per hour',  # Scraping is resource intensive
    'api_general': '50 per hour',
}

# CORS
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')

# JWT
JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.getenv('JWT_EXPIRES_DAYS', '7')))
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

# Session
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'true').lower() == 'true'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Password policy
MIN_PASSWORD_LENGTH = 8
REQUIRE_PASSWORD_COMPLEXITY = True

# Timeout
REQUEST_TIMEOUT = 30  # seconds

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
AUDIT_LOGGING_ENABLED = os.getenv('AUDIT_LOGGING_ENABLED', 'true').lower() == 'true'
