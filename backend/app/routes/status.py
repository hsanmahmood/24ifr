from flask import Blueprint, Response

status_bp = Blueprint('status_bp', __name__)

@status_bp.route('/')
def status_page():
    return Response("OK", mimetype='text/plain')
