from core.database import engine
from sqlalchemy import text

with engine.connect() as c:
    # Check petugas_tps_assignments table
    result = c.execute(text('SHOW CREATE TABLE petugas_tps_assignments'))
    print('petugas_tps_assignments CREATE:')
    print(result.fetchone()[1])
    print()

    # Check petugas role exists
    result = c.execute(text("SELECT id, username, role FROM users WHERE role = 'petugas_tps'"))
    petugas_tps_users = result.fetchall()
    print('Users with role petugas_tps:', petugas_tps_users)
    print()

    # Check tps_monitoring_reports table
    result = c.execute(text('SHOW CREATE TABLE tps_monitoring_reports'))
    print('tps_monitoring_reports CREATE:')
    print(result.fetchone()[1])
    print()

    # Check laporan_warga table
    result = c.execute(text('SHOW CREATE TABLE laporan_warga'))
    print('laporan_warga CREATE:')
    print(result.fetchone()[1])
    print()

    # Check admin table
    result = c.execute(text('SHOW CREATE TABLE admin'))
    print('admin CREATE:')
    print(result.fetchone()[1])
    print()

    # Check all roles
    result = c.execute(text("SELECT DISTINCT role FROM users"))
    print('All roles in users:', result.fetchall())
    print()

    # Check tps table
    result = c.execute(text('SHOW CREATE TABLE tps'))
    print('tps CREATE:')
    print(result.fetchone()[1])
    print()

    # Check tps_kelurahan table
    result = c.execute(text('SHOW CREATE TABLE tps_kelurahan'))
    print('tps_kelurahan CREATE:')
    print(result.fetchone()[1])
    print()

    # Check kecamatan table
    result = c.execute(text('SHOW CREATE TABLE kecamatan'))
    print('kecamatan CREATE:')
    print(result.fetchone()[1])
    print()

    # Check kelurahan table
    result = c.execute(text('SHOW CREATE TABLE kelurahan'))
    print('kelurahan CREATE:')
    print(result.fetchone()[1])
    print()

    # Check warga table
    result = c.execute(text('SHOW CREATE TABLE warga'))
    print('warga CREATE:')
    print(result.fetchone()[1])
    print()

    # Check setoran_sampah table
    result = c.execute(text('SHOW CREATE TABLE setoran_sampah'))
    print('setoran_sampah CREATE:')
    print(result.fetchone()[1])
    print()

    # Check scan_history table
    result = c.execute(text('SHOW CREATE TABLE scan_history'))
    print('scan_history CREATE:')
    print(result.fetchone()[1])
    print()

    # Check tukar_reward_history table
    result = c.execute(text('SHOW CREATE TABLE tukar_reward_history'))
    print('tukar_reward_history CREATE:')
    print(result.fetchone()[1])
    print()

    # Check jadwal tables
    result = c.execute(text('SHOW CREATE TABLE jadwal_pengambilan'))
    print('jadwal_pengambilan CREATE:')
    print(result.fetchone()[1])
    print()

    result = c.execute(text('SHOW CREATE TABLE jadwal_pengangkutan'))
    print('jadwal_pengangkutan CREATE:')
    print(result.fetchone()[1])
    print()

    # Check system_settings table
    result = c.execute(text('SHOW CREATE TABLE system_settings'))
    print('system_settings CREATE:')
    print(result.fetchone()[1])
    print()

    # Check token tables
    result = c.execute(text('SHOW CREATE TABLE refresh_tokens'))
    print('refresh_tokens CREATE:')
    print(result.fetchone()[1])
    print()

    result = c.execute(text('SHOW CREATE TABLE token_revocations'))
    print('token_revocations CREATE:')
    print(result.fetchone()[1])
    print()

    # Check chat tables
    result = c.execute(text('SHOW CREATE TABLE chat_conversations'))
    print('chat_conversations CREATE:')
    print(result.fetchone()[1])
    print()

    result = c.execute(text('SHOW CREATE TABLE chat_messages'))
    print('chat_messages CREATE:')
    print(result.fetchone()[1])
    print()

    # Check petugas_tps_assignments table
    result = c.execute(text('SHOW CREATE TABLE petugas_tps_assignments'))
    print('petugas_tps_assignments CREATE:')
    print(result.fetchone()[1])
    print()