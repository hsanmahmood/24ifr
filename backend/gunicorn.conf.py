import os

bind = "0.0.0.0:5000"
workers = int(os.environ.get('GUNICORN_WORKERS', 1))
loglevel = os.environ.get('GUNICORN_LOGLEVEL', 'info')
accesslog = "-"
errorlog = "-"
