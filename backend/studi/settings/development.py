"""
Development settings for studi project.

These settings are used for local development.
- DEBUG enabled for detailed error pages
- Local SQLite/PostgreSQL database
- Permissive CORS for frontend development
- Development secret key (not secure, but fine for local)
"""

from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
# This is fine for development - never use in production
SECRET_KEY = 'django-insecure-76!$8zxyy-8anmo!g=2_r@7iuz$(j@=)zwif_s=q#x$@tsz56*'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Allow all hosts in development for easy testing
ALLOWED_HOSTS = ['*']

# Database - your current local setup
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'studi',
        'USER': 'ethanortecho',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# CORS settings - permissive for development
CORS_ALLOW_ALL_ORIGINS = True  # Allow any origin in development
CORS_ALLOW_CREDENTIALS = True

# JWT settings - add the secret key
SIMPLE_JWT.update({
    'SIGNING_KEY': SECRET_KEY,  # Use development secret key
})

# Development-specific settings
print("🚀 Running in DEVELOPMENT mode")