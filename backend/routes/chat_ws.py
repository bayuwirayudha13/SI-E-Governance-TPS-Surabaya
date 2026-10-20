from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.chat import ChatConversation, ChatMessage
from models.warga import Warga
from services.chat_manager import manager
from services.chat_auth import decode_token
from core.timezone import get_wib_now
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/chat/{conversation_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    conversation_id: int,
    token: str = Query(...)
):
    """
    WebSocket endpoint for real-time chat.
    Both warga and admin can connect.
    Token passed as query parameter: /ws/chat/{conversation_id}?token=...
    """
    db = SessionLocal()
    
    try:
        # Validate token and get user
        try:
            payload = decode_token(token)
            email = payload.get("sub")
            role = payload.get("role")
            
            if not email or not role:
                await websocket.close(code=1008, reason="Invalid token")
                return
            
            # Get user details
            if role == "warga":
                from models.warga import Warga
                warga = db.query(Warga).filter(Warga.email == email).first()
                if not warga:
                    await websocket.close(code=1008, reason="User not found")
                    return
                user = {
                    "id": warga.id,
                    "email": warga.email,
                    "role": "warga",
                    "name": warga.nama
                }
            elif role in ["admin", "superadmin"]:
                from models.users import User
                admin = db.query(User).filter(User.email == email).first()
                if not admin:
                    await websocket.close(code=1008, reason="User not found")
                    return
                user = {
                    "id": admin.id,
                    "email": admin.email,
                    "role": admin.role,
                    "name": admin.nama_lengkap
                }
            else:
                await websocket.close(code=1008, reason="Invalid role")
                return
        
        except Exception as e:
            logger.error(f"Auth failed: {e}")
            await websocket.close(code=1008, reason="Authentication failed")
            return
        
        # Verify conversation access
        conv = db.query(ChatConversation).filter(
            ChatConversation.id == conversation_id
        ).first()
        
        if not conv:
            await websocket.close(code=1008, reason="Conversation not found")
            return
        
        # Warga can only access their own conversation
        if user["role"] == "warga" and conv.warga_id != user["id"]:
            await websocket.close(code=1008, reason="Access denied")
            return
        
        # Connect websocket
        await manager.connect(websocket, conversation_id, user)
        
        # Send connection confirmation
        await manager.send_personal(websocket, {
            "type": "connected",
            "data": {
                "conversation_id": conversation_id,
                "user": user
            }
        })
        
        # Handle incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Validate message
                if message_data.get("type") == "message":
                    msg_text = message_data.get("message", "").strip()
                    
                    if not msg_text:
                        await manager.send_personal(websocket, {
                            "type": "error",
                            "message": "Pesan tidak boleh kosong"
                        })
                        continue
                    
                    if len(msg_text) > 2000:
                        await manager.send_personal(websocket, {
                            "type": "error",
                            "message": "Pesan maksimal 2000 karakter"
                        })
                        continue
                    
                    # Save message to database
                    new_message = ChatMessage(
                        conversation_id=conversation_id,
                        sender_id=user["id"],
                        sender_role=user["role"],
                        sender_name=user["name"],
                        message=msg_text,
                        timestamp=get_wib_now()
                    )
                    db.add(new_message)
                    
                    # Update conversation timestamp
                    conv.updated_at = get_wib_now()
                    
                    db.commit()
                    db.refresh(new_message)
                    
                    # Broadcast to all connected clients in this conversation
                    await manager.send_to_conversation(conversation_id, {
                        "type": "message",
                        "data": {
                            "id": new_message.id,
                            "conversation_id": new_message.conversation_id,
                            "sender_id": new_message.sender_id,
                            "sender_role": new_message.sender_role,
                            "sender_name": new_message.sender_name,
                            "message": new_message.message,
                            "timestamp": new_message.timestamp.isoformat()
                        }
                    })
                    
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await manager.send_personal(websocket, {
                    "type": "error",
                    "message": "Format pesan tidak valid"
                })
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await manager.send_personal(websocket, {
                    "type": "error",
                    "message": "Gagal mengirim pesan"
                })
                db.rollback()
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    
    finally:
        manager.disconnect(websocket, conversation_id)
        db.close()
