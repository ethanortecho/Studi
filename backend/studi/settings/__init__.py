"""
Django settings auto-loader based on environment.

This automatically imports the correct settings module:
- development.py for local development
- staging.py for Render staging deployment
- production.py for Render production deployment
"""

import os

# Get the environment from DJANGO_SETTINGS_MODULE or default to development
environment = os.environ.get('DJANGO_SETTINGS_MODULE', 'studi.settings.development')

# Extract just the settings module name (development/staging/production)
if environment:
    settings_module = environment.split('.')[-1]
else:
    settings_module = 'development'

# Import the appropriate settings (only one!)
if settings_module == 'production':
    from .production import *
elif settings_module == 'staging':
    from .staging import *
else:
    from .development import *