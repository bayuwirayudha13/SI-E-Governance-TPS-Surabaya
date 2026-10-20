from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from core.database import get_db
from models.chat import ChatConversation, ChatMessage
from models.warga import Warga
from schemas.chat import MessageCreate, MessageResponse, ConversationResponse
from services.chat_auth import get_chat_user, require_warga, require_admin_chat
from core.timezone import get_wib_now

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
    convs = db.query(ChatConversation).order_by(
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
