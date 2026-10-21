import sys
sys.path.insert(0, '.')

from core.database import SessionLocal
from models.chat import ChatConversation
from models.users import User
from sqlalchemy import desc

db = SessionLocal()

# Check conversations
convs = db.query(ChatConversation).order_by(desc(ChatConversation.updated_at)).limit(5).all()
print(f'Total conversations: {len(convs)}')
for c in convs:
    print(f'  ID {c.id}: warga={c.warga_id}, assigned_petugas={c.assigned_petugas_id}, status={c.status}')

# Check petugas/admin users
users = db.query(User).filter(User.role.in_(['admin', 'superadmin', 'petugas'])).all()
print(f'\nAdmin/Petugas users: {len(users)}')
for u in users:
    print(f'  ID {u.id}: {u.nama_lengkap} ({u.role})')

db.close()
