
import sys
from pathlib import Path

# Memastikan folder backend masuk ke Python path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

# Menggunakan aplikasi FastAPI yang sudah ada
from main import app
