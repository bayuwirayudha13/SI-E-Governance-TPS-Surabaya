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
  
  // Fitur Suara & Popup Notifikasi
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastPopup, setToastPopup] = useState(null);
  
  // Template Pembuka
  const [greetingTemplate, setGreetingTemplate] = useState(null);
  const [editableTemplate, setEditableTemplate] = useState('');
  
  // Shortcut Commands
  const [showShortcutPopup, setShowShortcutPopup] = useState(false);
  const [usedGreetingShortcut, setUsedGreetingShortcut] = useState(false);
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  
  const shortcuts = [
    {
      id: 'greeting',
      label: '💬 Salam Pembuka',
      text: null, // Will be generated dynamically
      oneTimeOnly: true
    },
    {
      id: 'confirm',
      label: '✓ Apakah jawaban dari kami sudah cukup?',
      text: 'Apakah jawaban dari kami sudah cukup?'
    },
    {
      id: 'ask_more',
      label: '❓ Apakah ada pertanyaan lagi?',
      text: 'Apakah ada pertanyaan lagi?'
    },
    {
      id: 'thanks',
      label: '🙏 Terima kasih sudah menggunakan layanan kami',
      text: 'Terima kasih sudah menggunakan layanan kami.'
    }
  ];

  // Fungsi Suara Notifikasi (Web Audio API - aman autoplay & tanpa file eksternal)
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('AudioContext prevented or not supported:', e);
    }
  };

  // Generate greeting message with dynamic content
  const generateGreetingMessage = () => {
    if (!selectedConv || !greetingTemplate) return '';
    
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'pagi';
    if (hour >= 11 && hour < 15) greeting = 'siang';
    else if (hour >= 15 && hour < 18) greeting = 'sore';
    else if (hour >= 18 || hour < 4) greeting = 'malam';
    
    return `Halo Bapak/Ibu ${greetingTemplate.warga_name}, selamat ${greeting}! Dengan ${greetingTemplate.admin_role_label} ${greetingTemplate.admin_name}, ada yang bisa dibantu?`;
  };

  // Handle input change - detect "/" for shortcut popup
  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessageText(text);
    
    // Show popup if text ends with "/"
    if (text.endsWith('/')) {
      setShowShortcutPopup(true);
    } else if (text.includes('/')) {
      // Keep popup open if "/" exists anywhere in text
      setShowShortcutPopup(true);
    } else {
      setShowShortcutPopup(false);
    }
  };

  // Insert shortcut text into message
  const insertShortcut = (shortcutId) => {
    // Check if greeting shortcut already used in this conversation
    if (shortcutId === 'greeting' && usedGreetingShortcut) {
      setError('Salam pembuka sudah digunakan dalam percakapan ini');
      return;
    }

    let shortcutText = '';
    
    if (shortcutId === 'greeting') {
      shortcutText = generateGreetingMessage();
      setUsedGreetingShortcut(true);
    } else {
      const shortcut = shortcuts.find(s => s.id === shortcutId);
      shortcutText = shortcut?.text || '';
    }

    // Replace "/" with shortcut text
    const newText = messageText.replace(/\/$/, shortcutText);
    setMessageText(newText);
    setShowShortcutPopup(false);
  };

  // Reset greeting shortcut when conversation changes
  useEffect(() => {
    setUsedGreetingShortcut(false);
  }, [selectedConv?.id]);

  // Load conversations list
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/chat/admin/conversations?skip=0&limit=20');
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
      setGreetingTemplate(null);
      setEditableTemplate('');
      return;
    }
    
    const loadMessages = async () => {
      try {
        const res = await api.get(`/api/chat/admin/conversations/${selectedConv.id}/messages?skip=0&limit=50`);
        setMessages(res.data || []);
        
        // Load greeting template if first time responding
        const greetingRes = await api.get(`/api/chat/admin/conversations/${selectedConv.id}/greeting-template`);
        setGreetingTemplate(greetingRes.data);
        if (greetingRes.data?.should_send && greetingRes.data?.template) {
          setEditableTemplate(greetingRes.data.template);
        }
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
      const token = sessionStorage.getItem('access_token');
      if (!token) {
        setError('Token tidak ditemukan');
        return;
      }
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//localhost:8000/ws/chat/${selectedConv.id}?token=${token}`;
      
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
              
              // Jika pesan dari warga, bunyikan suara dan tampilkan popup notifikasi
              if (data.data.sender_role === 'warga') {
                playNotificationSound();
                setToastPopup({
                  title: `Pesan baru dari ${data.data.sender_name || 'Warga'}`,
                  message: data.data.message
                });
                // Auto hide toast after 4 seconds
                setTimeout(() => setToastPopup(null), 4000);
              }

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
      setGreetingTemplate(null);
    } catch (err) {
      console.error('Send error:', err);
      setError('Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  const sendMessageFromTemplate = async () => {
    if (!editableTemplate.trim() || !selectedConv) return;
    
    if (wsStatus !== 'connected') {
      setError('Koneksi belum siap');
      return;
    }
    
    try {
      setSending(true);
      ws.current.send(JSON.stringify({
        type: 'message',
        message: editableTemplate.trim()
      }));
      setGreetingTemplate(null);
      setEditableTemplate('');
    } catch (err) {
      console.error('Send template error:', err);
      setError('Gagal mengirim template');
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async () => {
    if (!selectedConv) return;
    try {
      await api.post(`/api/chat/admin/conversations/${selectedConv.id}/close`, {});
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
      {/* Toast Popup Notifikasi Realtime */}
      {toastPopup && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#10b981',
          color: '#fff',
          padding: '14px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          minWidth: '280px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '0.95rem' }}>🔔 {toastPopup.title}</strong>
            <button
              onClick={() => setToastPopup(null)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}
            >&times;</button>
          </div>
          <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.95, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toastPopup.message}
          </p>
        </div>
      )}

      <div className="admin-chat-sidebar">
        <div className="admin-chat-sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Percakapan ({conversations.length})</h3>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Suara Notifikasi Aktif" : "Suara Notifikasi Nonaktif"}
            style={{
              background: soundEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: soundEnabled ? '#10b981' : '#ef4444',
              fontWeight: 600
            }}
          >
            {soundEnabled ? '🔊 Suara On' : '🔇 Suara Off'}
          </button>
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

            {greetingTemplate && greetingTemplate.should_send && (
              <div className="admin-chat-template-suggestion">
                <div className="template-header">💡 Saran Pembuka</div>
                <textarea 
                  className="template-edit-textarea"
                  value={editableTemplate}
                  onChange={(e) => setEditableTemplate(e.target.value)}
                  placeholder="Edit pesan pembuka..."
                  rows="3"
                />
                <div className="template-actions">
                  <button 
                    type="button"
                    className="template-use-btn"
                    onClick={sendMessageFromTemplate}
                    disabled={sending || wsStatus !== 'connected' || !editableTemplate.trim()}
                  >
                    ✓ Kirim
                  </button>
                  <button 
                    type="button"
                    className="template-skip-btn"
                    onClick={() => {
                      setGreetingTemplate(null);
                      setEditableTemplate('');
                    }}
                  >
                    ✕ Lewati
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={sendMessage} className="admin-chat-input-form">
              {showShortcutPopup && greetingTemplate && (
                <div className="shortcut-popup">
                  <div className="shortcut-header">💡 Shortcut Pesan</div>
                  {shortcuts.map(shortcut => {
                    // Skip greeting if already used
                    if (shortcut.id === 'greeting' && usedGreetingShortcut) return null;
                    
                    return (
                      <button
                        key={shortcut.id}
                        type="button"
                        className="shortcut-item"
                        onClick={() => insertShortcut(shortcut.id)}
                      >
                        {shortcut.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <input
                type="text"
                className="admin-chat-input"
                placeholder="Ketik balasan... (ketik / untuk shortcut)"
                value={messageText}
                onChange={handleMessageChange}
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
