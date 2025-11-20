"""
Production settings for AsaliTrace.

This file contains production-specific settings. 
To use, set DJANGO_SETTINGS_MODULE=asalitrace.settings_production
or copy relevant settings to your main settings.py
"""
import os
from pathlib import Path
from datetime import timedelta
from .settings import *  # Import base settings

# Override base settings for production
DEBUG = False
DJANGO_SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')

# Security settings
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Allowed hosts - set via environment variable
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')
if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Database configuration - use PostgreSQL in production
DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.environ.get('DB_NAME', 'asalitrace_db'),
        'USER': os.environ.get('DB_USER', 'asalitrace_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,  # Connection pooling
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

# Static files configuration
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_URL = '/static/'

# Media files configuration
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_URL = '/media/'

# CORS configuration - only allow production frontend
frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
CORS_ALLOWED_ORIGINS = [frontend_url]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': str(BASE_DIR / 'logs' / 'django.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'asalitrace': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
# Ensure logs directory exists and is writable
logs_dir = BASE_DIR / 'logs'
if not logs_dir.exists():
    try:
        os.makedirs(logs_dir, exist_ok=True)
    except Exception as e:
        print(f"Warning: Could not create logs directory: {e}")
# Blockchain configuration
# Ensure these are set in your .env file and never committed to git
# BLOCKCHAIN_RPC_URL=https://your-ethereum-node.com
# CONTRACT_ADDRESS=0x...
# PRIVATE_KEY=0x... (use secret manager in production)
# PUBLIC_ADDRESS=0x...
# Monitoring & Backup (manual steps)
# - Integrate Sentry for error monitoring: https://sentry.io/welcome/
# - Set up Uptime Robot or similar for uptime monitoring
# - Automate PostgreSQL backups (see DEPLOYMENT_GUIDE.md)
# Example backup command:
# pg_dump -U asalitrace_user -h localhost asalitrace_db > backup_$(date +%Y%m%d).sql
# SSL/HTTPS
# - Use Nginx as a reverse proxy and enable SSL (see DEPLOYMENT_GUIDE.md)
# - Use Let's Encrypt for free certificates
# - Update Nginx config to redirect HTTP to HTTPS

# Email configuration (for 2FA and notifications)
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER)

# Cache configuration (optional - for performance)
# CACHES = {
#     'default': {
#         'BACKEND': 'django.core.cache.backends.redis.RedisCache',
#         'LOCATION': os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1'),
#     }
# }

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_SAVE_EVERY_REQUEST = True


