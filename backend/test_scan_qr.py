import requests
import time

time.sleep(3)

resp = requests.post(
    'http://localhost:8000/api/petugas/scan-qr-validate',
    headers={'Authorization': 'Bearer demo-token-petugas'},
    data={'qr_code': 'QR-1B025D0BAF0B651D'}
)

print(f"Status: {resp.status_code}")
print(f"Response: {resp.json()}")
