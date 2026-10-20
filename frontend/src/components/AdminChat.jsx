import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import './AdminChat.css';

export default function AdminChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsStatus, setWsStatus] = useState('idle');
  const [sending, setSending] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // Load conversations list
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const res = await api.get('/chat/admin/conversations?skip=0&limit=20');
        setConversations(res.data || []);
      } catch (err) {
        console.error('Load conversations error:', err);
        setError(err.response?.data?.detail || 'Gagal memuat percakapan');
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
    // Refresh every 10 seconds
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConv) {
      setMessages([]);
      return;
    }
    
    const loadMessages = async () => {
      try {
        const res = await api.get(`/chat/admin/conversations/${selectedConv.id}/messages?skip=0&limit=50`);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Load messages error:', err);
        setError(err.response?.data?.detail || 'Gagal memuat pesan');
      }
    };
    
    loadMessages();
  }, [selectedConv]);

  // Connect WebSocket when conversation selected
  useEffect(() => {
    if (!selectedConv) {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      return;
    }
    
    const connectWs = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Token tidak ditemukan');
        return;
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat/${selectedConv.id}?token=${token}`;
      
      try {
        ws.current = new WebSocket(wsUrl);
        
        ws.current.onopen = () => {
          console.log('Admin WebSocket connected');
          setWsStatus('connected');
          setError(null);
        };
        
        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'message') {
              setMessages(prev => {
                if (prev.find(m => m.id === data.data.id)) return prev;
                return [...prev, data.data];
              });
              // Update last message in conversation list
              setConversations(prev => prev.map(c =>
                c.id === selectedConv.id
                  ? { ...c, last_message: data.data.message, last_message_time: data.data.timestamp }
                  : c
              ));
            } else if (data.type === 'error') {
              console.error('WebSocket error:', data.message);
              setError(data.message);
            }
          } catch (err) {
            console.error('Parse WS message error:', err);
          }
        };
        
        ws.current.onerror = (err) => {
          console.error('WebSocket error:', err);
          setWsStatus('error');
          setError('Koneksi gagal');
        };
        
        ws.current.onclose = () => {
          console.log('WebSocket closed');
          setWsStatus('disconnected');
        };
      } catch (err) {
        console.error('WebSocket create error:', err);
        setError('Gagal membuat koneksi');
      }
    };
    
    connectWs();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [selectedConv]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !selectedConv) {
      setError('Pesan tidak boleh kosong');
      return;
    }
    
    if (wsStatus !== 'connected') {
      setError('Koneksi belum siap');
      return;
    }
    
    try {
      setSending(true);
      ws.current.send(JSON.stringify({
        type: 'message',
        message: messageText.trim()
      }));
      setMessageText('');
    } catch (err) {
      console.error('Send error:', err);
      setError('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async () => {
    if (!selectedConv) return;
    try {
      await api.post(`/chat/admin/conversations/${selectedConv.id}/close`, {});
      setConversations(prev => prev.map(c =>
        c.id === selectedConv.id ? { ...c, status: 'closed' } : c
      ));
      setSelectedConv(prev => ({ ...prev, status: 'closed' }));
    } catch (err) {
      console.error('Close error:', err);
      setError('Gagal menutup percakapan');
    }
  };

  if (loading) {
    return (
      <div className="admin-chat-container">
        <div className="admin-chat-loading">
          <div className="spinner"></div>
          <p>Memuat percakapan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-chat-container">
      <div className="admin-chat-sidebar">
        <div className="admin-chat-sidebar-header">
          <h3>Percakapan ({conversations.length})</h3>
        </div>
        
        <div className="admin-chat-list">
          {conversations.length === 0 ? (
            <div className="admin-chat-empty">Tidak ada percakapan</div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const time = conv.last_message_time
                ? new Date(conv.last_message_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : '';
              
              return (
                <button
                  key={conv.id}
                  className={`admin-chat-item ${isSelected ? 'selected' : ''} ${conv.status === 'closed' ? 'closed' : ''}`}
                  onClick={() => setSelectedConv(conv)}
                >
                  <div className="admin-chat-item-header">
                    <span className="admin-chat-name">{conv.warga_name}</span>
                    <span className="admin-chat-time">{time}</span>
                  </div>
                  <div className="admin-chat-preview">
                    {conv.last_message ? (
                      <>
                        <span className="admin-chat-preview-text">{conv.last_message.substring(0, 40)}</span>
                        {conv.last_message.length > 40 && <span>...</span>}
                      </>
                    ) : (
                      <span className="admin-chat-no-msg">Tidak ada pesan</span>
                    )}
                  </div>
                  {conv.status === 'closed' && (
                    <span className="admin-chat-status-badge">TUTUP</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="admin-chat-main">
        {!selectedConv ? (
          <div className="admin-chat-no-selection">
            <div className="no-selection-icon">💬</div>
            <p>Pilih percakapan untuk memulai</p>
          </div>
        ) : (
          <>
            <div className="admin-chat-header">
              <div>
                <div className="admin-chat-title">{selectedConv.warga_name}</div>
                <div className="admin-chat-email">{selectedConv.warga_email}</div>
              </div>
              <div className="admin-chat-header-actions">
                <div className={`admin-chat-status ${wsStatus}`}>
                  <span className={`status-dot ${wsStatus}`}></span>
                  {wsStatus === 'connected' ? 'Online' : 'Offline'}
                </div>
                {selectedConv.status === 'open' && (
                  <button
                    className="admin-chat-close-btn"
                    onClick={closeConversation}
                    title="Tutup percakapan"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="admin-chat-error">
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)}>×</button>
              </div>
            )}

            <div className="admin-chat-messages">
              {messages.length === 0 ? (
                <div className="admin-chat-empty-msgs">Tidak ada pesan</div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.sender_role !== 'warga';
                  const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  
                  return (
                    <div key={msg.id} className={`admin-message-bubble ${isAdmin ? 'admin' : 'warga'}`}>
                      <div className="message-sender">{msg.sender_name}</div>
                      <div className="message-text">{msg.message}</div>
                      <div className="message-time">{time}</div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef}></div>
            </div>

            <form onSubmit={sendMessage} className="admin-chat-input-form">
              <input
                type="text"
                className="admin-chat-input"
                placeholder="Ketik balasan..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={wsStatus !== 'connected' || sending}
              />
              <button
                type="submit"
                className="admin-chat-send-btn"
                disabled={!messageText.trim() || wsStatus !== 'connected' || sending}
              >
                {sending ? '⏳' : '➤'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
