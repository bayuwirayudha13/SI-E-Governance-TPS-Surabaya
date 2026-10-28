import requests

url = 'http://localhost:8000/api/petugas/scan-qr-validate'
# Login first as petugas or get token
# Or use demo token / authentication
# Let's check how test_scan_qr2.py does it

import requests

headers = {
    "Authorization": "Bearer demo-token-petugas"
}

data = {
    "qr_code": "QR-755FA94D60FF8183"
}

r = requests.post(url, data=data, headers=headers)
print("Scan Status:", r.status_code)
print("Scan Resp:", r.json())

if r.status_code == 200:
    setoran_id = r.json().get("setoran_id")
    
    val_url = 'http://localhost:8000/api/petugas/complete-verification'
    val_data = {
        "setoran_id": setoran_id,
        "berat_aktual_kg": 2.5,
        "kondisi_sampah": "Bersih",
        "jenis_sampah_terverifikasi": "PET",
        "hasil_pemeriksaan": "Sesuai",
        "catatan_petugas": "Sampah terpilah dengan sangat baik."
    }
    
    r2 = requests.post(val_url, data=val_data, headers=headers)
    print("Verification Status:", r2.status_code)
    print("Verification Resp:", r2.json())
