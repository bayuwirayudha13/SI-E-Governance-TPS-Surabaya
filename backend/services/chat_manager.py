from typing import Dict, List
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages WebSocket connections for chat.
    Note: In-memory storage, does NOT work across multiple workers/processes.
    For production multi-worker setup, use Redis pub/sub or similar.
    """
    def __init__(self):
        # conversation_id -> list of (websocket, user_dict)
        self.active_connections: Dict[int, List[tuple]] = {}
    
    async def connect(self, websocket: WebSocket, conversation_id: int, user: dict):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append((websocket, user))
        logger.info(f"User {user['email']} ({user['role']}) connected to conversation {conversation_id}")
    
    def disconnect(self, websocket: WebSocket, conversation_id: int):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id] = [
                (ws, user) for ws, user in self.active_connections[conversation_id]
                if ws != websocket
            ]
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]
            logger.info(f"User disconnected from conversation {conversation_id}")
    
    async def send_to_conversation(self, conversation_id: int, message: dict):
        """Send message to all connected clients in a conversation"""
        if conversation_id not in self.active_connections:
            return
        
        disconnected = []
        for websocket, user in self.active_connections[conversation_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to {user['email']}: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected websockets
        for ws in disconnected:
            self.disconnect(ws, conversation_id)
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to a specific websocket"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send personal message: {e}")

manager = ConnectionManager()
