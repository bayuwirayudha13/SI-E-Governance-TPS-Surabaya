"""
Geocoding data TPS SI-PETASAN - hanya TPS berstatus Aktif.

Input:
    data_tps_surabaya_terstruktur.xlsx

Output:
    data_tps_surabaya_hasil_geocoding_aktif.xlsx
    geocoding_cache.sqlite

Catatan:
- Hanya baris dengan kolom Status = Aktif yang dicari.
- TPS Tidak Aktif diberi status DILEWATI_TIDAK_AKTIF.
- Script hanya menghasilkan kandidat koordinat, bukan memasukkan data ke MySQL.
- Semua koordinat hasil pencarian tetap berstatus PERLU_VERIFIKASI.
- Permintaan ke Nominatim dilakukan satu per satu dengan jeda minimal 1,2 detik.
"""

from pathlib import Path
import json
import sqlite3
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import requests
from openpyxl import load_workbook


# =========================
# KONFIGURASI
# =========================

INPUT_FILE = Path("data_tps_surabaya_terstruktur.xlsx")
OUTPUT_FILE = Path("data_tps_surabaya_hasil_geocoding_aktif.xlsx")
CACHE_DB = Path("geocoding_cache.sqlite")

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Gunakan alamat kontak yang benar dan dapat dihubungi.
CONTACT_EMAIL = "sipetasansby@gmail.com"
USER_AGENT = f"SI-PETASAN-Suroboyo-Geocoder/1.1 ({CONTACT_EMAIL})"

REQUEST_INTERVAL_SECONDS = 1.2
MAX_RETRIES = 3


# =========================
# CACHE
# =========================

def init_cache():
    conn = sqlite3.connect(CACHE_DB)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS geocoding_cache (
            query TEXT PRIMARY KEY,
            response_json TEXT,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn


def get_cached(conn, query):
    row = conn.execute(
        "SELECT response_json, status FROM geocoding_cache WHERE query = ?",
        (query,)
    ).fetchone()

    if not row:
        return None

    response_json, status = row
    data = json.loads(response_json) if response_json else None
    return {"data": data, "status": status}


def save_cache(conn, query, data, status):
    conn.execute("""
        INSERT OR REPLACE INTO geocoding_cache
        (query, response_json, status, created_at)
        VALUES (?, ?, ?, ?)
    """, (
        query,
        json.dumps(data, ensure_ascii=False) if data is not None else None,
        status,
        datetime.now(timezone.utc).isoformat()
    ))
    conn.commit()


# =========================
# RATE LIMIT & NOMINATIM
# =========================

last_request_time = 0.0


def wait_for_rate_limit():
    global last_request_time

    elapsed = time.monotonic() - last_request_time
    wait_seconds = REQUEST_INTERVAL_SECONDS - elapsed

    if wait_seconds > 0:
        time.sleep(wait_seconds)


def retry_after_seconds(response):
    value = response.headers.get("Retry-After")
    if not value:
        return 30

    try:
        return max(1, int(value))
    except ValueError:
        try:
            retry_time = parsedate_to_datetime(value)
            now = datetime.now(timezone.utc)
            return max(1, int((retry_time - now).total_seconds()))
        except Exception:
            return 30


def geocode_one_query(query, session):
    """Cari satu query. Hasil disimpan di cache oleh pemanggil."""
    global last_request_time

    params = {
        "q": query,
        "format": "jsonv2",
        "limit": 1,
        "countrycodes": "id",
        "addressdetails": 1
    }

    for attempt in range(1, MAX_RETRIES + 1):
        wait_for_rate_limit()
        last_request_time = time.monotonic()

        try:
            response = session.get(
                NOMINATIM_URL,
                params=params,
                timeout=30
            )

            if response.status_code in (429, 503):
                delay = retry_after_seconds(response)
                print(f"    Server membatasi permintaan. Menunggu {delay} detik...")
                time.sleep(delay)
                continue

            response.raise_for_status()
            results = response.json()

            if not results:
                return None, "TIDAK_DITEMUKAN"

            return results[0], "PERLU_VERIFIKASI"

        except requests.RequestException as exc:
            print(f"    Percobaan {attempt}/{MAX_RETRIES} gagal: {exc}")
            if attempt < MAX_RETRIES:
                time.sleep(5 * attempt)

    return None, "GAGAL_API"


# =========================
# MEMBUAT VARIASI QUERY
# =========================

def clean_value(value):
    if value is None:
        return ""
    return str(value).strip()


def make_queries(row):
    """
    Query 1: alamat + kecamatan + Kota Surabaya.
    Query 2: nama TPS + kecamatan + Kota Surabaya.

    Wilayah_Kota (misalnya Surabaya Pusat/Timur) sengaja tidak
    dimasukkan karena bukan nama kecamatan dan dapat mengganggu
    pencocokan alamat.
    """
    lokasi = clean_value(row.get("Lokasi"))
    nama_tps = clean_value(row.get("Nama_TPS"))
    kecamatan = clean_value(row.get("Kecamatan"))

    suffix = []
    if kecamatan:
        suffix.append(f"Kecamatan {kecamatan}")
    suffix.extend(["Kota Surabaya", "Jawa Timur", "Indonesia"])
    suffix_text = ", ".join(suffix)

    queries = []

    if lokasi:
        queries.append(f"{lokasi}, {suffix_text}")

    if nama_tps:
        name_query = f"{nama_tps}, {suffix_text}"
        if name_query not in queries:
            queries.append(name_query)

    return queries


# =========================
# PROSES GEOCODING SATU TPS
# =========================

def geocode_tps(queries, conn, session):
    attempted_queries = []
    api_error = False
    cache_hits = 0

    for query in queries:
        attempted_queries.append(query)

        cached = get_cached(conn, query)
        if cached is not None:
            result = cached["data"]
            status = cached["status"]
            cache_hits += 1
            print("    Menggunakan hasil cache.")
        else:
            result, status = geocode_one_query(query, session)
            save_cache(conn, query, result, status)

        if status == "PERLU_VERIFIKASI" and result:
            return result, status, query, attempted_queries, cache_hits

        if status == "GAGAL_API":
            api_error = True

    final_status = "GAGAL_API" if api_error else "TIDAK_DITEMUKAN"
    return None, final_status, "", attempted_queries, cache_hits


# =========================
# PROSES FILE EXCEL
# =========================

def main():
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"File tidak ditemukan: {INPUT_FILE.resolve()}\n"
            "Letakkan script dan file Excel sumber di folder yang sama."
        )

    workbook = load_workbook(INPUT_FILE)

    if "TPS" not in workbook.sheetnames:
        raise ValueError("Sheet 'TPS' tidak ditemukan.")

    sheet = workbook["TPS"]

    headers = {
        clean_value(sheet.cell(row=1, column=col).value): col
        for col in range(1, sheet.max_column + 1)
        if sheet.cell(row=1, column=col).value is not None
    }

    required = [
        "ID_TPS", "Nama_TPS", "Lokasi",
        "Kecamatan", "Status"
    ]
    missing = [name for name in required if name not in headers]

    if missing:
        raise ValueError(f"Kolom wajib tidak ditemukan: {missing}")

    output_columns = [
        "Geocode_Query",
        "Latitude_Hasil",
        "Longitude_Hasil",
        "Geocoding_Status",
        "Geocoding_Display_Name",
        "Geocoding_OSM_Type",
        "Geocoding_OSM_ID"
    ]

    for name in output_columns:
        if name not in headers:
            new_col = sheet.max_column + 1
            sheet.cell(row=1, column=new_col).value = name
            headers[name] = new_col

    # Hitung TPS aktif terlebih dahulu untuk nomor progres yang benar.
    active_rows = []
    inactive_count = 0
    other_status_count = 0

    for row_num in range(2, sheet.max_row + 1):
        status_value = clean_value(
            sheet.cell(row=row_num, column=headers["Status"]).value
        ).casefold()

        if status_value == "aktif":
            active_rows.append(row_num)
        elif status_value == "tidak aktif":
            inactive_count += 1
        else:
            other_status_count += 1

    print("=== RINGKASAN DATA ===")
    print(f"TPS Aktif       : {len(active_rows)}")
    print(f"TPS Tidak Aktif : {inactive_count} (dilewati)")
    print(f"Status lainnya  : {other_status_count} (dilewati)")
    print("======================\n")

    counts = {
        "PERLU_VERIFIKASI": 0,
        "TIDAK_DITEMUKAN": 0,
        "ALAMAT_KOSONG": 0,
        "GAGAL_API": 0,
        "DILEWATI_TIDAK_AKTIF": 0,
        "DILEWATI_STATUS_LAIN": 0,
        "CACHE_HIT": 0
    }

    conn = init_cache()
    session = requests.Session()
    session.headers.update({
        "User-Agent": USER_AGENT,
        "Accept-Language": "id"
    })

    try:
        # Tandai semua baris tidak aktif/status lain dan kosongkan koordinatnya.
        for row_num in range(2, sheet.max_row + 1):
            status_value = clean_value(
                sheet.cell(row=row_num, column=headers["Status"]).value
            ).casefold()

            if status_value == "tidak aktif":
                result_status = "DILEWATI_TIDAK_AKTIF"
            elif status_value != "aktif":
                result_status = "DILEWATI_STATUS_LAIN"
            else:
                continue

            values = {
                "Geocode_Query": "",
                "Latitude_Hasil": None,
                "Longitude_Hasil": None,
                "Geocoding_Status": result_status,
                "Geocoding_Display_Name": None,
                "Geocoding_OSM_Type": None,
                "Geocoding_OSM_ID": None
            }

            for name, value in values.items():
                sheet.cell(row=row_num, column=headers[name]).value = value

            counts[result_status] += 1

        # Proses hanya TPS Aktif.
        for index, row_num in enumerate(active_rows, start=1):
            row_data = {
                name: sheet.cell(row=row_num, column=col).value
                for name, col in headers.items()
            }

            tps_id = row_data.get("ID_TPS")
            nama_tps = row_data.get("Nama_TPS")
            queries = make_queries(row_data)

            print(f"[{index}/{len(active_rows)}] {tps_id} - {nama_tps}")

            if not queries:
                result = None
                status = "ALAMAT_KOSONG"
                selected_query = ""
                attempted_queries = []
                cache_hits = 0
            else:
                result, status, selected_query, attempted_queries, cache_hits = (
                    geocode_tps(queries, conn, session)
                )

            if cache_hits:
                counts["CACHE_HIT"] += cache_hits

            values = {
                "Geocode_Query": " || ".join(attempted_queries),
                "Latitude_Hasil": (
                    float(result["lat"])
                    if result and result.get("lat") else None
                ),
                "Longitude_Hasil": (
                    float(result["lon"])
                    if result and result.get("lon") else None
                ),
                "Geocoding_Status": status,
                "Geocoding_Display_Name": (
                    result.get("display_name") if result else None
                ),
                "Geocoding_OSM_Type": result.get("type") if result else None,
                "Geocoding_OSM_ID": result.get("osm_id") if result else None
            }

            for name, value in values.items():
                sheet.cell(row=row_num, column=headers[name]).value = value

            counts[status] += 1

            if status == "PERLU_VERIFIKASI":
                print(
                    f"    Kandidat ditemukan: "
                    f"{values['Latitude_Hasil']}, {values['Longitude_Hasil']}"
                )
            else:
                print(f"    Status: {status}")

            # Simpan berkala berdasarkan jumlah TPS aktif yang sudah diproses.
            if index % 10 == 0:
                workbook.save(OUTPUT_FILE)
                print("    Progres disimpan.")

    finally:
        workbook.save(OUTPUT_FILE)
        conn.close()
        session.close()

    print("\n=== SELESAI ===")
    print(f"File hasil: {OUTPUT_FILE.resolve()}")
    print(f"Cache:      {CACHE_DB.resolve()}")
    for status, count in counts.items():
        print(f"{status}: {count}")

    print(
        "\nPENTING: koordinat PERLU_VERIFIKASI adalah kandidat hasil pencarian. "
        "Periksa titiknya di peta sebelum menetapkannya sebagai koordinat TPS."
    )


if __name__ == "__main__":
    main()
