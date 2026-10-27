import React, { useState, useEffect, useRef } from 'react';
import { api, authService } from '../api/client';
import './WargaChat.css';

export default function WargaChat() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [sending, setSending] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const currentUser = authService.getCurrentUser();

  // Load conversation and history
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create or get conversation
        const convRes = await api.post('/api/chat/conversations', {});
        setConversation(convRes.data);
        
        // Load message history
        const msgsRes = await api.get(`/api/chat/conversations/${convRes.data.id}/messages?skip=0&limit=50`);
        setMessages(msgsRes.data || []);
      } catch (err) {
        console.error('Load conversation error:', err);
        if (err.response?.status === 401) {
          setError('Sesi login telah berakhir. Silakan login ulang.');
        } else {
          setError(err.response?.data?.detail || 'Gagal memuat percakapan');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadConversation();
  }, []);

  // Connect WebSocket
  useEffect(() => {
    if (!conversation) return;
    let isMounted = true;
    let reconnectTimer = null;
    
    const connectWs = () => {
      if (!isMounted) return;
      const token = authService.getToken();
      if (!token) {
        setError('Sesi login telah berakhir. Silakan login ulang.');
        return;
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//localhost:8000/ws/chat/${conversation.id}?token=${token}`;
      
      try {
        ws.current = new WebSocket(wsUrl);
        
        ws.current.onopen = () => {
          if (!isMounted) return;
          console.log('WebSocket connected');
          setWsStatus('connected');
          setError(null);
        };
        
        ws.current.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'message') {
              setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === data.data.id)) return prev;
                return [...prev, data.data];
              });
            } else if (data.type === 'error') {
              console.error('WebSocket error:', data.message);
              setError(data.message);
            }
          } catch (err) {
            console.error('Parse WS message error:', err);
          }
        };
        
        ws.current.onerror = (err) => {
          if (!isMounted) return;
          console.error('WebSocket error:', err);
          setWsStatus('error');
        };
        
        ws.current.onclose = () => {
          if (!isMounted) return;
          console.log('WebSocket closed');
          setWsStatus('disconnected');
          // Auto-reconnect after 3 seconds if still mounted
          reconnectTimer = setTimeout(() => {
            if (isMounted) connectWs();
          }, 3000);
        };
      } catch (err) {
        if (!isMounted) return;
        console.error('WebSocket create error:', err);
        setError('Gagal membuat koneksi');
      }
    };
    
    connectWs();
    
    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [conversation]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageText = (text) => {
    if (!text || wsStatus !== 'connected' || sending) return;
    try {
      setSending(true);
      const msg = {
        type: 'message',
        message: text.trim()
      };
      ws.current.send(JSON.stringify(msg));
      setMessageText('');
    } catch (err) {
      console.error('Send message error:', err);
      setError('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) {
      setError('Pesan tidak boleh kosong');
      return;
    }
    
    if (messageText.length > 2000) {
      setError('Pesan terlalu panjang (max 2000 karakter)');
      return;
    }
    
    sendMessageText(messageText);
  };

  if (loading) {
    return (
      <div className="warga-chat-container">
        <div className="warga-chat-loading">
          <div className="spinner"></div>
          <p>Memuat percakapan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="warga-chat-container">
      <div className="warga-chat-header">
        <div className="warga-chat-title">Live Chat Customer Service</div>
        <div className={`warga-chat-status ${wsStatus}`}>
          <span className={`status-dot ${wsStatus}`}></span>
          {wsStatus === 'connected' && 'Online'}
          {wsStatus === 'connecting' && 'Menghubungkan...'}
          {wsStatus === 'disconnected' && 'Terputus'}
          {wsStatus === 'error' && 'Error'}
        </div>
      </div>

      {error && (
        <div className="warga-chat-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span>{error}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {error.toLowerCase().includes('login') && (
              <a
                href="#auth"
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                Login Ulang
              </a>
            )}
            <button type="button" onClick={() => setError(null)}>×</button>
          </div>
        </div>
      )}

      <div className="warga-chat-messages">
        {messages.length === 0 ? (
          <div className="warga-chat-empty">
            <div className="empty-icon">💬</div>
            <p>Belum ada pesan. Mulai percakapan dengan admin!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_role === 'warga';
            const senderName = isOwnMessage ? 'Anda' : msg.sender_name;
            const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            });
            
            return (
              <div key={msg.id} className={`warga-message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
                <div className="message-sender">{senderName}</div>
                <div className="message-text">{msg.message}</div>
                <div className="message-time">{time}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef}></div>
      </div>

      <form onSubmit={sendMessage} className="warga-chat-input-form">
        <div className="warga-chat-templates">
          <button type="button" onClick={() => sendMessageText("Jadwal pengambilan sampah hari ini?")} className="template-btn">📅 Jadwal Hari Ini</button>
          <button type="button" onClick={() => sendMessageText("Kapan petugas lewat di wilayah saya?")} className="template-btn">🗺️ Wilayah Saya</button>
          <button type="button" onClick={() => sendMessageText("Sampah belum diangkut 2 hari")} className="template-btn">⚠️ Belum Diangkut</button>
          <button type="button" onClick={() => sendMessageText("Ada sampah menumpuk di titik pengumpulan")} className="template-btn">🗑️ Menumpuk</button>
          <button type="button" onClick={() => sendMessageText("Ingin bicara langsung dengan petugas")} className="template-btn">👤 Bicara Petugas</button>
        </div>
        <div className="warga-chat-input-wrapper">
          <input
            type="text"
            className="warga-chat-input"
            placeholder="Ketik pesan..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={wsStatus !== 'connected' || sending}
          />
          <button
            type="submit"
            className="warga-chat-send-btn"
            disabled={!messageText.trim() || wsStatus !== 'connected' || sending}
          >
            {sending ? '⏳' : '➤'}
          </button>
        </div>
      </form>
    </div>
  );
}
