import os
from pathlib import Path
from datetime import timedelta
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'change-me')
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'src.api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'src.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'src.wsgi.application'

DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('DATABASE_PUBLIC_URL') or os.getenv('POSTGRES_URL')
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

if not DATABASE_URL:
    # Build from parts if provided
    host = os.getenv('POSTGRES_HOST') or os.getenv('PGHOST')
    port = os.getenv('POSTGRES_PORT') or os.getenv('PGPORT') or '5432'
    user = os.getenv('POSTGRES_USER') or os.getenv('PGUSER')
    password = os.getenv('POSTGRES_PASSWORD') or os.getenv('PGPASSWORD')
    dbname = os.getenv('POSTGRES_DB') or os.getenv('POSTGRES_DATABASE') or os.getenv('PGDATABASE')
    if host and user and password and dbname:
        DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

if not DATABASE_URL:
    # Default to SQLite for easy local development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': str(BASE_DIR / 'db.sqlite3'),
        }
    }
else:
    # SSL mode handling similar to Flask app
    if DATABASE_URL.startswith('postgresql'):
        sslmode = os.getenv('DATABASE_SSLMODE') or os.getenv('PGSSLMODE')
        if sslmode:
            sep = '&' if '?' in DATABASE_URL else '?'
            DATABASE_URL = f"{DATABASE_URL}{sep}sslmode={sslmode}"
        else:
            if 'sslmode=' not in DATABASE_URL and not any(h in DATABASE_URL for h in ['localhost', '127.0.0.1']):
                sep = '&' if '?' in DATABASE_URL else '?'
                DATABASE_URL = f"{DATABASE_URL}{sep}sslmode=require"

    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=False)
    }

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings to allow frontend including Vercel preview
FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN', '*')

CORS_ALLOW_CREDENTIALS = True

if FRONTEND_ORIGIN == '*':
    CORS_ALLOW_ALL_ORIGINS = True
else:
    origins = [o.strip() for o in FRONTEND_ORIGIN.split(',') if o.strip()]
    CORS_ALLOWED_ORIGINS = origins
    # Also allow Vercel preview deployments like https://*.vercel.app
    CORS_ALLOWED_ORIGIN_REGEXES = [r"^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$"]

# Simple JWT-like settings (we'll hand-roll minimal token)
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'change-me')
JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES_DAYS', '7'))

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
}
