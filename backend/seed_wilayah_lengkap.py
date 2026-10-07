import sys
from datetime import datetime
from core.database import engine
from sqlalchemy import text

data = {
    "Surabaya Barat": {
        "Tandes": ["Karangpoh", "Tubanan", "Gadel", "Tandes Lor", "Balongsari", "Manukan Wetan", "Manukan Kulon", "Banjarsugihan"],
        "Benowo": ["Kandangan", "Klakahrejo", "Sememi", "Romokalisari"],
        "Pakal": ["Babat Jerawat", "Benowo", "Pakal", "Tambakdono", "Sumber Rejo"],
        "Sambikerep": ["Sambikerep", "Lontar", "Made", "Bringin"],
        "Lakarsantri": ["Lakarsantri", "Lidah Kulon", "Lidah Wetan", "Bangkingan", "Sumur Welut", "Jeruk"],
        "Sukomanunggal": ["Sukomanunggal", "Simomulyo", "Simo Hilir", "Sono Kewijenan", "Petemon", "Sawahan", "Putat Gede", "Tanjung Sari"],
    },
    "Surabaya Utara": {
        "Krembangan": ["Dupak", "Jepara", "Gundih", "Morokrembangan", "Perak Barat", "Kemayoran", "Krembangan Selatan"],
        "Semampir": ["Pegirian", "Wonokusumo", "Sidotopo", "Ujung"],
        "Pabean Cantian": ["Krembangan Utara/Selatan", "Nyamplungan", "Ampel", "Perak Timur", "Bongkaran"],
        "Bulak": ["Bulak", "Kenjeran"],
        "Kenjeran": ["Komplek Kenjeran", "Sidotopo Wetan", "Bulak Banteng", "Wonokusumo", "Tanah Kali Kedinding", "Tambak Wedi"],
    },
    "Surabaya Timur": {
        "Tambaksari": ["Ploso", "Tambak Sari", "Pacar Keling", "Pacar Kembang", "Gading", "Rangkah"],
        "Gubeng": ["Mojo", "Airlangga", "Gubeng", "Pucang Sewu", "Barata Jaya", "Kertajaya", "Keputran", "Nginden Jangkungan"],
        "Sukolilo": ["Keputih", "Gebang Putih", "Klampis Ngasem", "Manyar Sabrangan", "Semolowaru", "Medokan Semampir", "Menur Pumpungan"],
        "Rungkut": ["Kalirungkut", "Rungkut Kidul", "Penjaringan Sari", "Kedung Baruk", "Medokan Ayu", "Wonorejo"],
        "Gunung Anyar": ["Gunung Anyar Tambak", "Rungkut Menanggal"],
        "Tenggilis Mejoyo": ["Tenggilis Mejoyo", "Panjang Jiwo", "Tenggilis Utara", "Kendangsari", "Rungkut Tengah", "Kutisari", "Siwalan Kerto", "Prapen"],
        "Mulyorejo": ["Mulyorejo", "Kalisari", "Dukuh Sutorejo", "Kalijudan"],
    },
    "Surabaya Selatan": {
        "Sawahan": ["Sawahan", "Petemon", "Kedungdoro", "Putat Jaya", "Pakis", "Banyu Urip", "Kupang Krajan"],
        "Wonokromo": ["Sawunggaling", "Wonokromo", "Ngagel Rejo", "Bratang Binangun", "Ngagel", "Jagir", "Sidosermo", "Darmo"],
        "Wonocolo": ["Sidosermo", "Bendul Merisi", "Margorejo", "Jemur Wonosari"],
        "Karang Pilang": ["Kedurus", "Kebraon"],
        "Gayungan": ["Ketintang", "Gayungan", "Menanggal", "Dukuh Menanggal"],
        "Jambangan": ["Karah", "Jambangan", "Kebonsari", "Pagesangan"],
        "Wiyung": ["Wiyung", "Babatan", "Jajar Tunggal", "Balas Klumprik"],
        "Dukuh Pakis": ["Gunung Sari", "Prada Kali Kendal", "Dukuh Kupang"],
    }
}

now = datetime.now()

with engine.connect() as conn:
    for wilayah_kota, kec_dict in data.items():
        for kec_nama, kel_list in kec_dict.items():
            conn.execute(
                text("INSERT IGNORE INTO kecamatan (nama, created_at) VALUES (:n, :t)"),
                {"n": kec_nama, "t": now}
            )
            for kel_nama in kel_list:
                conn.execute(
                    text("INSERT IGNORE INTO kelurahan (nama, kecamatan, wilayah_kota) VALUES (:n, :k, :w)"),
                    {"n": kel_nama, "k": kec_nama, "w": wilayah_kota}
                )
    conn.commit()

print("SELESAI_SEED_ALL_SURABAYA")
