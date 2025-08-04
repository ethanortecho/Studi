"""
Django settings auto-loader based on environment.

This automatically imports the correct settings module:
- development.py for local development
- production.py for Render deployment
"""

import os

# Get the environment from DJANGO_SETTINGS_MODULE or default to development
environment = os.environ.get('DJANGO_SETTINGS_MODULE', 'studi.settings.development')

# Extract just the settings module name (development/production)
if environment:
    settings_module = environment.split('.')[-1]
else:
    settings_module = 'development'

# Import the appropriate settings
if settings_module == 'production':
    from .production import *
else:
    from .development import *