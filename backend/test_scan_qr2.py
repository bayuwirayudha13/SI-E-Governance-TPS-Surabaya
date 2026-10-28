import requests

# Test with QR-755FA94D60FF8183 (ID 7, status Menunggu Penjemputan)
resp = requests.post(
    'http://localhost:8000/api/petugas/scan-qr-validate',
    headers={'Authorization': 'Bearer demo-token-petugas'},
    data={'qr_code': 'QR-755FA94D60FF8183'}
)

print(f"Status: {resp.status_code}")
print(f"Response: {resp.json()}")
