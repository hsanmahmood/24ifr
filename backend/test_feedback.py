import requests

session = requests.Session()

auth_response = session.get('http://localhost:5000/api/auth/user')
auth_data = auth_response.json()
print(f'Authenticated: {auth_data.get("authenticated")}')
print(f'CSRF Token: {auth_data.get("csrf_token")}')

csrf_token = auth_data.get('csrf_token')
feedback_data = {
    'message': 'Test feedback from Docker container verification',
    'rating': 5
}
headers = {
    'X-CSRF-Token': csrf_token,
    'Content-Type': 'application/json'
}

feedback_response = session.post('http://localhost:5000/api/feedback', json=feedback_data, headers=headers)
print(f'Feedback Response: {feedback_response.status_code}')
print(f'Feedback Content: {feedback_response.text}')
