import os
import zipfile

files = [
    'models/jadwal.py',
    'schemas/jadwal_schema.py',
    'routes/jadwal_routes.py',
    'services/jadwal_service.py',
    'models/users.py',
    'models/warga.py',
    'models/petugas_tps_assignment.py',
    'services/petugas_tps_assignment_service.py',
    'auth/dependencies.py'
]

combined = ''
for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    combined += f'=== {f} ===\n' + content + '\n\n'

with open('combined_jadwal_files.txt', 'w', encoding='utf-8') as f:
    f.write(combined)

print('Created combined_jadwal_files.txt')

with zipfile.ZipFile('combined_jadwal_files.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.write('combined_jadwal_files.txt')
    
print('Created combined_jadwal_files.zip')

os.remove('combined_jadwal_files.txt')
print('Cleaned up temp file')
