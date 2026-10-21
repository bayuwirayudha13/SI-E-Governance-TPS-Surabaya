from sqlalchemy.orm import Session
from models.jadwal import JadwalPengambilan
from models.warga import Warga
from models.users import User
from models.chat import ChatConversation
import logging

logger = logging.getLogger(__name__)

def handle_bot_or_routing(db: Session, warga_id: int, message_text: str) -> str:
    """
    Menangani bot otomatis jadwal berdasarkan database & pengalihan keluhan wilayah.
    Dilindungi dengan try-except agar tidak memutus koneksi WebSocket/DB.
    """
    try:
        text_lower = message_text.lower().strip()
        
        # Ambil data warga
        warga = db.query(Warga).filter(Warga.id == warga_id).first()
        warga_kelurahan = warga.kelurahan if warga and warga.kelurahan else ""
        warga_kecamatan = warga.kecamatan if warga and warga.kecamatan else ""
        
        # 1. Cek pertanyaan Jadwal (explicit jadwal request)
        if any(keyword in text_lower for keyword in ["jadwal", "jam berapa", "hari apa"]) and \
           any(keyword in text_lower for keyword in ["pengambilan", "petugas", "sampah"]):
            matched_jadwal = []
            if warga_kelurahan:
                matched_jadwal = db.query(JadwalPengambilan).filter(JadwalPengambilan.area.like(f"%{warga_kelurahan}%")).all()
                
            if not matched_jadwal:
                matched_jadwal = db.query(JadwalPengambilan).limit(5).all()
                
            if matched_jadwal:
                response_lines = ["🤖 **Bot Jadwal Pengambilan Sampah**:\n"]
                if warga_kelurahan:
                    response_lines.append(f"📍 Jadwal untuk wilayah Anda ({warga_kelurahan}):\n")
                else:
                    response_lines.append("📍 Jadwal pengambilan aktif:\n")
                    
                for j in matched_jadwal:
                    waktu_mulai_str = str(j.waktu_mulai)[:5] if j.waktu_mulai else ""
                    waktu_selesai_str = str(j.waktu_selesai)[:5] if j.waktu_selesai else ""
                    response_lines.append(f"- **{j.hari}** ({waktu_mulai_str} - {waktu_selesai_str})\n  Area: {j.area}\n  Petugas: {j.petugas}")
                
                response_lines.append("\n_Jika ada kendala khusus di luar jadwal ini, silakan ketik pesan Anda dan akan diteruskan ke Admin/Petugas kelurahan._")
                return "\n".join(response_lines)
            else:
                return "🤖 Maaf, belum ada data jadwal pengambilan sampah yang terdaftar untuk saat ini. Silakan hubungi Admin."

        # 2. Cek pertanyaan Wilayah / Petugas Lokasi
        if any(keyword in text_lower for keyword in ["wilayah", "kapan petugas"]) and \
           not any(keyword in text_lower for keyword in ["belum", "menumpuk", "rusak", "keluhan"]):
            matched_jadwal = []
            if warga_kelurahan:
                matched_jadwal = db.query(JadwalPengambilan).filter(JadwalPengambilan.area.like(f"%{warga_kelurahan}%")).all()
                
            if not matched_jadwal:
                matched_jadwal = db.query(JadwalPengambilan).limit(5).all()
                
            if matched_jadwal:
                response_lines = ["🤖 **Jadwal Petugas di Wilayah Anda**:\n"]
                response_lines.append(f"📍 Wilayah: {warga_kelurahan if warga_kelurahan else warga_kecamatan}\n")
                    
                for j in matched_jadwal:
                    waktu_mulai_str = str(j.waktu_mulai)[:5] if j.waktu_mulai else ""
                    waktu_selesai_str = str(j.waktu_selesai)[:5] if j.waktu_selesai else ""
                    response_lines.append(f"- **{j.hari}** ({waktu_mulai_str} - {waktu_selesai_str})")
                    if j.petugas:
                        response_lines.append(f"  Petugas: {j.petugas}")
                
                response_lines.append("\n_Hubungi Petugas atau Admin jika ada kebutuhan khusus._")
                return "\n".join(response_lines)
            else:
                return "🤖 Belum ada data petugas untuk wilayah Anda. Silakan hubungi Admin."

        # 3. Cek keluhan (belum diangkut, menumpuk, rusak, bocor, bau)
        if any(keyword in text_lower for keyword in ["belum diangkut", "menumpuk", "rusak", "bocor", "bau", "penuh"]):
            assigned = assign_petugas_by_wilayah(db, warga_id, warga_kelurahan, warga_kecamatan, conversation_type="keluhan")
            
            if assigned:
                return f"🤖 Laporan keluhan Anda telah dicatat dan **diteruskan ke {assigned['role_label']} {assigned['name']} ({assigned['wilayah']})**. Petugas terkait akan segera merespons. Terima kasih."
            else:
                return f"🤖 Laporan keluhan Anda telah dicatat dan **diteruskan ke Admin**. Admin akan segera merespons laporan Anda. Terima kasih."

        # 4. Cek permintaan chat langsung / petugas
        if any(keyword in text_lower for keyword in ["bicara", "langsung", "berbicara", "admin", "petugas", "tolong", "darurat"]):
            assigned = assign_petugas_by_wilayah(db, warga_id, warga_kelurahan, warga_kecamatan, conversation_type="bicara_langsung")
            
            if assigned:
                return f"🤖 Permintaan Anda telah dicatat dan **diteruskan ke {assigned['role_label']} {assigned['name']} ({assigned['wilayah']})**. Petugas akan segera merespons percakapan Anda. Terima kasih."
            else:
                return f"🤖 Permintaan Anda telah dicatat dan **diteruskan ke Admin**. Admin akan segera merespons. Terima kasih."

        return None
    except Exception as e:
        logger.error(f"Error in chatbot service: {e}")
        return "🤖 Halo! Ada yang bisa saya bantu terkait jadwal pengambilan sampah atau pelaporan wilayah?"


def assign_petugas_by_wilayah(db: Session, warga_id: int, warga_kelurahan: str, warga_kecamatan: str, conversation_type: str = "general") -> dict:
    """
    Assign petugas berdasarkan wilayah warga.
    Return dict dengan info petugas atau None jika tidak ada yang cocok.
    """
    try:
        # Cari percakapan warga
        conv = db.query(ChatConversation).filter(
            ChatConversation.warga_id == warga_id,
            ChatConversation.status == "open"
        ).first()
        
        if not conv:
            return None
        
        # Update conversation_type jika baru
        if conv.conversation_type == "general" and conversation_type != "general":
            conv.conversation_type = conversation_type
        
        # Skip jika sudah assigned
        if conv.assigned_petugas_id:
            petugas = db.query(User).filter(User.id == conv.assigned_petugas_id).first()
            if petugas:
                role_label = "Petugas" if petugas.role == "petugas" else "Admin"
                wilayah = f"Kel. {petugas.wilayah_kelurahan}" if petugas.wilayah_kelurahan else f"Kec. {petugas.wilayah_kecamatan}" if petugas.wilayah_kecamatan else "Surabaya"
                return {
                    "id": petugas.id,
                    "name": petugas.nama_lengkap,
                    "role_label": role_label,
                    "wilayah": wilayah
                }
        
        # Cari petugas yang cocok dengan wilayah warga
        matched_petugas = None
        
        # Priority 1: Exact match kelurahan dan kecamatan
        if warga_kelurahan and warga_kecamatan:
            matched_petugas = db.query(User).filter(
                User.role == "petugas",
                User.is_active == True,
                User.wilayah_kelurahan == warga_kelurahan,
                User.wilayah_kecamatan == warga_kecamatan
            ).first()
        
        # Priority 2: Match kecamatan saja
        if not matched_petugas and warga_kecamatan:
            matched_petugas = db.query(User).filter(
                User.role == "petugas",
                User.is_active == True,
                User.wilayah_kecamatan == warga_kecamatan
            ).first()
        
        # Priority 3: Petugas aktif mana saja
        if not matched_petugas:
            matched_petugas = db.query(User).filter(
                User.role == "petugas",
                User.is_active == True
            ).first()
        
        # Assign ke conversation
        if matched_petugas:
            conv.assigned_petugas_id = matched_petugas.id
            db.commit()
            
            role_label = "Petugas"
            wilayah = f"Kel. {matched_petugas.wilayah_kelurahan}" if matched_petugas.wilayah_kelurahan else f"Kec. {matched_petugas.wilayah_kecamatan}" if matched_petugas.wilayah_kecamatan else "Surabaya"
            
            return {
                "id": matched_petugas.id,
                "name": matched_petugas.nama_lengkap,
                "role_label": role_label,
                "wilayah": wilayah
            }
        
        return None
        
    except Exception as e:
        logger.error(f"Error assigning petugas: {e}")
        return None
