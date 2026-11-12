import pymysql
conn = pymysql.connect(host='localhost', user='root', password='', database='sipk_tps_baru')
c = conn.cursor()
c.execute("SELECT id, email, role, wilayah_kecamatan, wilayah_kelurahan FROM users WHERE role IN ('petugas_pengangkut', 'driver')")
for r in c.fetchall():
    print(r)
conn.close()
