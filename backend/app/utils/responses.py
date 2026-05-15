from flask import jsonify

def success_response(data=None, message=None):
    payload = {}
    if data is not None:
        payload['data'] = data
    if message is not None:
        payload['message'] = message
    return jsonify(payload)

def error_response(error, details=None, status_code=400):
    payload = {'error': error}
    if details:
        payload['details'] = details
    return jsonify(payload), status_code
