import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

BUCKET_NAME = "foto-profil-warga"

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError(
        "SUPABASE_URL dan SUPABASE_SECRET_KEY belum dikonfigurasi"
    )

supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)