import pymysql
c=pymysql.connect(host='localhost',user='root',password='',database='sipk_tps_baru')
cur=c.cursor()
try:
    cur.execute("ALTER TABLE users ADD COLUMN foto_url VARCHAR(255) NULL")
    print("added foto_url")
except Exception as e:
    print(f"foto_url: {e}")
c.commit()
cur.execute("DESCRIBE users")
for r in cur.fetchall():
    print(r)
c.close()
