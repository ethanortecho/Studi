"""
Staging settings for studi project.

These settings are used for staging deployment on Render.
- Similar to production but with relaxed security for testing
- Separate database from production
- DEBUG can be True for easier debugging
- More permissive CORS for testing different frontend URLs
"""

import os
from .base import *

# Override MIDDLEWARE to include whitenoise for static file serving
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files in staging
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware', 
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# SECURITY WARNING: SECRET_KEY must be set as environment variable in staging
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set in staging")

# DEBUG can be True in staging for easier debugging (but False is safer)
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Staging hosts - Render sets RENDER_EXTERNAL_HOSTNAME automatically
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS = [RENDER_EXTERNAL_HOSTNAME]
else:
    # Fallback if RENDER_EXTERNAL_HOSTNAME not set
    ALLOWED_HOSTS = [os.environ.get('ALLOWED_HOST', 'localhost')]

# Database - PostgreSQL from Render (separate staging database)
import dj_database_url

# Use DATABASE_URL if available (Render provides this)
if os.environ.get('DATABASE_URL'):
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
    }
else:
    # Fallback to individual variables
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('PGDATABASE'),
            'USER': os.environ.get('PGUSER'),
            'PASSWORD': os.environ.get('PGPASSWORD'),
            'HOST': os.environ.get('PGHOST'),
            'PORT': os.environ.get('PGPORT', '5432'),
        }
    }

# CORS settings - more permissive for staging testing
CORS_ALLOWED_ORIGINS = [
    # Add your staging frontend URLs here
    # "https://staging-frontend.netlify.app",
    # "http://localhost:8081",  # For local mobile app testing against staging
]
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL', 'False').lower() == 'true'
CORS_ALLOW_CREDENTIALS = True

# JWT settings - use staging secret key
SIMPLE_JWT.update({
    'SIGNING_KEY': SECRET_KEY,
})

# Staging security settings (less strict than production)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
# X_FRAME_OPTIONS = 'SAMEORIGIN'  # More permissive than production

# Static files configuration for whitenoise
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Whitenoise settings
WHITENOISE_USE_FINDERS = True 
WHITENOISE_AUTOREFRESH = True

print("🧪 Running in STAGING mode")