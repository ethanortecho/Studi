"""
Production settings for studi project.

These settings are used for Render deployment.
- DEBUG disabled for security
- PostgreSQL database from Render
- Restrictive CORS for security
- Secret key from environment variables
"""

import os
from .base import *

# Override MIDDLEWARE to include whitenoise for static file serving
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files in production
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware', 
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# SECURITY WARNING: SECRET_KEY must be set as environment variable in production
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set in production")

# SECURITY WARNING: Never run with debug=True in production!
DEBUG = False

# Production hosts - Render sets RENDER_EXTERNAL_HOSTNAME automatically
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS = [RENDER_EXTERNAL_HOSTNAME]
else:
    # Fallback if RENDER_EXTERNAL_HOSTNAME not set
    ALLOWED_HOSTS = [os.environ.get('ALLOWED_HOST', 'localhost')]

# Database - PostgreSQL from Render
# Render sets DATABASE_URL automatically when you add PostgreSQL addon
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

# CORS settings - restrictive for production security
CORS_ALLOWED_ORIGINS = [
    # Add your frontend URLs here when deployed
    # "https://your-app.com",
    # "https://your-app.netlify.app",
]
CORS_ALLOW_CREDENTIALS = True

# JWT settings - use production secret key
SIMPLE_JWT.update({
    'SIGNING_KEY': SECRET_KEY,
})

# Production security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Static files configuration for whitenoise
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # Where collectstatic puts files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'  # Compression + cache busting

# Whitenoise settings for better performance
WHITENOISE_USE_FINDERS = True  # Find static files automatically
WHITENOISE_AUTOREFRESH = True  # Auto-refresh in development-like scenarios

print("🔒 Running in PRODUCTION mode")