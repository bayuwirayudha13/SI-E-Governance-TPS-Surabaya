from core.database import engine, Base
import models.users
import models.warga
import models.tps
import models.wilayah
import models.laporan
import models.setoran
import models.jadwal

Base.metadata.create_all(bind=engine)
print("Tables created")
