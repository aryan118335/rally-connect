import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Pages.css';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null); // { id, username }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);

  // User search to start new conversation
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef(null);

  // Load all active conversations
  async function loadConversations() {
    try {
      const data = await api.get('/messages/conversations');
      setConversations(data.conversations || []);

      // If no partner selected yet and conversations exist, select first
      if (!selectedPartner && data.conversations && data.conversations.length > 0) {
        const first = data.conversations[0];
        setSelectedPartner({ id: first.partner_id, username: first.partner_username });
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }

  // Load chat history with selected partner
  async function loadMessages(partnerId) {
    if (!partnerId) return;
    try {
      setLoadingHistory(true);
      const data = await api.get(`/messages/${partnerId}`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadConversations();
  }, []);

  // When selected partner changes, load messages & poll every 3s
  useEffect(() => {
    if (!selectedPartner) return;

    loadMessages(selectedPartner.id);

    // Poll every 3 seconds for new incoming messages
    const interval = setInterval(() => {
      api.get(`/messages/${selectedPartner.id}`)
        .then((data) => {
          if (data.messages) {
            setMessages(data.messages);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedPartner]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const data = await api.get(`/users?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(data.users || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Send message
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const data = await api.post(`/messages/${selectedPartner.id}`, { content });
      setMessages((prev) => [...prev, data.chatMessage]);
      loadConversations(); // refresh sidebar snippet
    } catch (err) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  function handleSelectUser(u) {
    setSelectedPartner({ id: u.id, username: u.username });
    setSearchQuery('');
    setSearchResults([]);
  }

  function formatTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="page" style={{ maxWidth: 850 }}>
      <div className="page-header">
        <h1 className="page-title">Direct Messages</h1>
        <p className="page-subtitle">One-to-one private conversations</p>
      </div>

      <div className="dm-layout">
        {/* Left conversations list & user search */}
        <div className="dm-sidebar">
          <div className="dm-search-box">
            <input
              className="dm-search-input"
              type="text"
              placeholder="🔍 Search users to chat…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Search results overlay or regular conversation list */}
          {searchQuery.trim() ? (
            <div className="dm-conversations-list">
              {searching ? (
                <p style={{ padding: 14, color: '#8b949e', fontSize: 13, margin: 0 }}>Searching…</p>
              ) : searchResults.length === 0 ? (
                <p style={{ padding: 14, color: '#8b949e', fontSize: 13, margin: 0 }}>No users found.</p>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u.id}
                    className="dm-convo-item"
                    onClick={() => handleSelectUser(u)}
                  >
                    <div className="dm-avatar">
                      {u.username[0].toUpperCase()}
                    </div>
                    <div className="dm-convo-details">
                      <div className="dm-convo-name">{u.username}</div>
                      <div className="dm-convo-preview">Click to chat</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="dm-conversations-list">
              {conversations.length === 0 ? (
                <p style={{ padding: 16, color: '#8b949e', fontSize: 13, textAlign: 'center' }}>
                  No active chats. Search for a user above to begin.
                </p>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c.partner_id}
                    className={`dm-convo-item ${selectedPartner?.id === c.partner_id ? 'active' : ''}`}
                    onClick={() =>
                      setSelectedPartner({ id: c.partner_id, username: c.partner_username })
                    }
                  >
                    <div className="dm-avatar">
                      {c.partner_username[0].toUpperCase()}
                    </div>
                    <div className="dm-convo-details">
                      <div className="dm-convo-name">{c.partner_username}</div>
                      <div className="dm-convo-preview">{c.last_message || 'Start chatting…'}</div>
                    </div>
                    {c.unread_count > 0 && (
                      <span
                        style={{
                          background: '#ff6b35',
                          color: '#fff',
                          borderRadius: 10,
                          padding: '2px 6px',
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right chat window */}
        <div className="dm-main-area">
          {selectedPartner ? (
            <>
              {/* Chat Header */}
              <div className="dm-header">
                <div className="dm-avatar" style={{ width: 34, height: 34, fontSize: 14 }}>
                  {selectedPartner.username[0].toUpperCase()}
                </div>
                <div>
                  <h3>{selectedPartner.username}</h3>
                  <span style={{ fontSize: 11, color: '#2ea043' }}>● Active</span>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="dm-messages-stream">
                {loadingHistory ? (
                  <p style={{ color: '#8b949e', fontSize: 13, textAlign: 'center' }}>
                    Loading messages…
                  </p>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8b949e', marginTop: 80 }}>
                    <p style={{ fontSize: 32, margin: 0 }}>💬</p>
                    <p style={{ fontSize: 14, marginTop: 8 }}>
                      Say hello to <strong>{selectedPartner.username}</strong>!
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`dm-bubble-row ${isMe ? 'sent' : 'received'}`}
                      >
                        <div className="dm-bubble">{m.content}</div>
                        <span className="dm-time">{formatTime(m.created_at)}</span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form className="dm-input-bar" onSubmit={handleSendMessage}>
                <input
                  className="dm-input"
                  type="text"
                  placeholder={`Message ${selectedPartner.username}…`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="dm-send-btn"
                  disabled={sending || !newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b949e' }}>
              <p style={{ fontSize: 40, margin: 0 }}>✉️</p>
              <h3 style={{ color: '#e6edf3', marginTop: 12 }}>Your Messages</h3>
              <p style={{ fontSize: 13 }}>Select a conversation or search for a user to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
