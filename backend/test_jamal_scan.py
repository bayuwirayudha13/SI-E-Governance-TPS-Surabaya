import requests

login_resp = requests.post(
    'http://localhost:8000/api/auth/login',
    json={'email': 'jamal.petugas@sipetasan.com', 'password': 'password123'}
)
print(f"Login status: {login_resp.status_code}")

if login_resp.status_code == 200:
    token = login_resp.json()['access_token']
    
    # Test scan with QR-040BAB09BA6A1762 (ID 8)
    scan_resp = requests.post(
        'http://localhost:8000/api/petugas/scan-qr-validate',
        headers={'Authorization': f'Bearer {token}'},
        data={'qr_code': 'QR-040BAB09BA6A1762'}
    )
    print(f"Scan status: {scan_resp.status_code}")
    print(f"Scan response: {scan_resp.json()}")
else:
    print(f"Login failed: {login_resp.json()}")
