from core.database import SessionLocal
from models.tps import TPS
from models.tps_kelurahan import TPSKelurahan
from models.wilayah import Kelurahan

db = SessionLocal()
tps_list = db.query(TPS).all()
for t in tps_list:
    print(f'{t.id}: {t.nama} | lat={t.latitude} lng={t.longitude} | status={t.status}')
db.close()