import pymysql
c=pymysql.connect(host='localhost',user='root',password='',database='sipk_tps_baru')
cur=c.cursor()
cols = [
    ("wilayah_kecamatan","VARCHAR(100) NULL"),
    ("wilayah_kelurahan","VARCHAR(100) NULL"),
    ("wilayah_kota","VARCHAR(50) NULL DEFAULT 'Surabaya'"),
]
for col, typ in cols:
    try:
        cur.execute(f"ALTER TABLE users ADD COLUMN {col} {typ}")
        print(f"added {col}")
    except Exception as e:
        print(f"{col}: {e}")
c.commit()
cur.execute("DESCRIBE users")
for r in cur.fetchall():
    print(r)
c.close()
