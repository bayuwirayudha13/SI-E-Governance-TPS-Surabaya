import requests

try:
    response = requests.get('http://localhost:8000/api/tps/', headers={'Authorization': 'Bearer demo-token-superadmin'})
    print('Status code:', response.status_code)
    print('Response:', response.text[:200])
except Exception as e:
    print('Error:', e)
