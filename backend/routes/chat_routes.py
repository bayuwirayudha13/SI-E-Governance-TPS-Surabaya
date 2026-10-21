from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from core.database import get_db
from models.chat import ChatConversation, ChatMessage
from models.warga import Warga
from models.users import User
from schemas.chat import MessageCreate, MessageResponse, ConversationResponse
from services.chat_auth import get_chat_user, require_warga, require_admin_chat
from core.timezone import get_wib_now
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])

# ==================== WARGA ENDPOINTS ====================

@router.post("/conversations", tags=["Chat Warga"])
def create_or_get_conversation(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_warga)
):
    """Get or create active conversation for authenticated warga"""
    warga_id = current_user["id"]
    
    # Check if warga already has an open conversation
    existing = db.query(ChatConversation).filter(
        ChatConversation.warga_id == warga_id,
        ChatConversation.status == "open"
    ).first()
    
    if existing:
        return {
            "id": existing.id,
            "warga_id": existing.warga_id,
            "status": existing.status,
            "created_at": existing.created_at,
            "updated_at": existing.updated_at
        }
    
    # Create new conversation
    new_conv = ChatConversation(warga_id=warga_id, status="open")
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)
    
    return {
        "id": new_conv.id,
        "warga_id": new_conv.warga_id,
        "status": new_conv.status,
        "created_at": new_conv.created_at,
        "updated_at": new_conv.updated_at
    }

@router.get("/conversations/me", tags=["Chat Warga"])
def get_my_conversation(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_warga)
):
    """Get warga's conversation"""
    warga_id = current_user["id"]
    
    conv = db.query(ChatConversation).filter(
        ChatConversation.warga_id == warga_id
    ).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Percakapan tidak ditemukan")
    
    return {
        "id": conv.id,
        "warga_id": conv.warga_id,
        "status": conv.status,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at
    }

@router.get("/conversations/{conversation_id}/messages", tags=["Chat Warga"])
def get_conversation_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_warga)
):
    """Get message history for a conversation (warga can only access own)"""
    warga_id = current_user["id"]
    
    # Verify conversation belongs to warga
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.warga_id == warga_id
    ).first()
    
    if not conv:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(
        ChatMessage.timestamp
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "sender_role": m.sender_role,
            "sender_name": m.sender_name,
            "message": m.message,
            "timestamp": m.timestamp
        }
        for m in messages
    ]

# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/conversations", tags=["Chat Admin"])
def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_chat)
):
    """List all conversations with last message preview"""
    # Get current user
    admin = db.query(User).filter(User.email == current_user["email"]).first()
    
    query = db.query(ChatConversation)
    
    # Petugas only see conversations assigned to them. Admin/Superadmin see all.
    if admin and admin.role == "petugas":
        query = query.filter(ChatConversation.assigned_petugas_id == admin.id)
    
    convs = query.order_by(
        desc(ChatConversation.updated_at)
    ).offset(skip).limit(limit).all()
    
    result = []
    for conv in convs:
        warga = db.query(Warga).filter(Warga.id == conv.warga_id).first()
        last_msg = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conv.id
        ).order_by(desc(ChatMessage.timestamp)).first()
        
        result.append({
            "id": conv.id,
            "warga_id": conv.warga_id,
            "warga_name": warga.nama if warga else "Unknown",
            "warga_email": warga.email if warga else "Unknown",
            "status": conv.status,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "last_message": last_msg.message if last_msg else None,
            "last_message_time": last_msg.timestamp if last_msg else None
        })
    
    return result

@router.get("/admin/conversations/{conversation_id}/messages", tags=["Chat Admin"])
def get_admin_conversation_messages(
    conversation_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_chat)
):
    """Get message history for a conversation (admin only)"""
    # Verify conversation exists
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Percakapan tidak ditemukan")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).order_by(
        ChatMessage.timestamp
    ).offset(skip).limit(limit).all()
    
    return [
        {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "sender_role": m.sender_role,
            "sender_name": m.sender_name,
            "message": m.message,
            "timestamp": m.timestamp
        }
        for m in messages
    ]

@router.post("/admin/conversations/{conversation_id}/close", tags=["Chat Admin"])
def close_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_chat)
):
    """Close a conversation"""
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Percakapan tidak ditemukan")
    
    conv.status = "closed"
    conv.updated_at = get_wib_now()
    db.commit()
    
    return {"message": "Percakapan ditutup"}


@router.get("/admin/conversations/{conversation_id}/greeting-template", tags=["Chat Admin"])
def get_greeting_template(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_chat)
):
    """Generate greeting template for admin/petugas"""
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Percakapan tidak ditemukan")
    
    # Get current user
    admin = db.query(User).filter(User.email == current_user["email"]).first()
    if not admin:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    # Validate petugas can only see template for their own assigned conversation
    if admin.role == "petugas" and conv.assigned_petugas_id != admin.id:
        raise HTTPException(status_code=403, detail="Tidak diizinkan mengakses percakapan ini")
    
    # Get warga info
    warga = db.query(Warga).filter(Warga.id == conv.warga_id).first()
    warga_name = warga.nama if warga else "Bapak/Ibu"
    
    # Get admin/petugas info
    admin_name = admin.nama_lengkap if admin else "Admin"
    admin_role_label = "Petugas" if admin.role == "petugas" else "Admin"
    
    # Determine greeting based on WIB time
    now = get_wib_now()
    hour = now.hour
    
    if 4 <= hour < 11:
        greeting = "pagi"
    elif 11 <= hour < 15:
        greeting = "siang"
    elif 15 <= hour < 18:
        greeting = "sore"
    else:
        greeting = "malam"
    
    # Generate template based on conversation_type
    conversation_type = getattr(conv, 'conversation_type', 'general')
    
    if conversation_type == "bicara_langsung":
        # Direct chat template for petugas
        template = f"Halo Bapak/Ibu {warga_name}, selamat {greeting}! Saya {admin_role_label} {admin_name} dari wilayah Anda. Ada yang bisa saya bantu terkait sampah atau kebutuhan Anda?"
    elif conversation_type == "keluhan":
        # Complaint template
        template = f"Halo Bapak/Ibu {warga_name}, selamat {greeting}! Saya {admin_role_label} {admin_name}. Terima kasih telah melaporkan keluhan Anda. Saya akan segera membantu mengatasi masalahnya."
    else:
        # Default template
        template = f"Halo Bapak/Ibu {warga_name}, selamat {greeting}! Dengan {admin_role_label} {admin_name}, ada yang bisa dibantu?"
    
    return {
        "template": template,
        "should_send": not conv.first_admin_response_sent,
        "warga_name": warga_name,
        "admin_name": admin_name,
        "greeting": greeting,
        "conversation_type": conversation_type
    }


@router.post("/admin/conversations/{conversation_id}/messages", tags=["Chat Admin"])
def send_admin_message(
    conversation_id: int,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_chat)
):
    """Send message from admin to warga"""
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id
    ).first()
    
    if not conv:
        raise HTTPException(status_code=404, detail="Percakapan tidak ditemukan")
    
    # Get admin details
    admin = db.query(User).filter(User.email == current_user["email"]).first()
    if not admin:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    # Save message
    new_message = ChatMessage(
        conversation_id=conversation_id,
        sender_id=admin.id,
        sender_role=current_user["role"],
        sender_name=admin.nama_lengkap,
        message=message.message.strip(),
        timestamp=get_wib_now()
    )
    db.add(new_message)
    conv.updated_at = get_wib_now()
    
    # Mark first response as sent
    if not conv.first_admin_response_sent:
        conv.first_admin_response_sent = True
    
    db.commit()
    db.refresh(new_message)
    
    return {
        "id": new_message.id,
        "conversation_id": new_message.conversation_id,
        "sender_id": new_message.sender_id,
        "sender_role": new_message.sender_role,
        "sender_name": new_message.sender_name,
        "message": new_message.message,
        "timestamp": new_message.timestamp
    }
