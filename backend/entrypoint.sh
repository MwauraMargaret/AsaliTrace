#!/bin/sh

set -eu

echo "Waiting for database..."
until python manage.py migrate --noinput
do
    echo "Database unavailable, retrying in 3 seconds..."
    sleep 3
done

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn asalitrace.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers "${GUNICORN_WORKERS:-3}" \
    --timeout "${GUNICORN_TIMEOUT:-120}"

