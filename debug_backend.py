import sys
import os
sys.path.insert(0, os.path.abspath("backend"))

from core.database import SessionLocal
from models.tps import TPS
from routes.tps_routes import list_tps
from unittest.mock import Mock

db = SessionLocal()
try:
    mock_user = Mock()
    mock_user.role = "superadmin"
    
    result = list_tps(
        skip=0,
        limit=10,
        search=None,
        kecamatan=None,
        wilayah_kota=None,
        status=None,
        kelurahan=None,
        min_kapasitas=None,
        max_kapasitas=None,
        db=db,
        current_user=mock_user
    )
    print("SUCCESS! Returned items:", len(result))
    if len(result) > 0:
        print("First item:", result[0])
except Exception as e:
    import traceback
    print("ERROR:", e)
    traceback.print_exc()