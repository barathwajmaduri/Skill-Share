import React, { useState, useEffect, useRef } from 'react';
import { User } from '../db';
import { X, Send, MessageCircle, Plus, Paperclip, FileText, Video, Download, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
}

interface ChatModalProps {
  teachingId: string;
  currentUser: User;
  otherUser: User;
  teachingTitle: string;
  onClose: () => void;
}

export default function ChatModal({ teachingId, currentUser, otherUser, teachingTitle, onClose }: ChatModalProps) {
  // Normalize IDs — API returns _id, local state uses id
  const myId = currentUser.id || (currentUser as any)._id || '';
  const otherId = otherUser.id || (otherUser as any)._id || '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!myId || !otherId) return;
    fetchMessages();
    // Poll for new messages every 4 seconds
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [teachingId, myId, otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${teachingId}/${myId}/${otherId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !myId || !otherId) return;
    setSending(true);

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: myId,
      receiverId: otherId,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teachingId,
          senderId: myId,
          receiverId: otherId,
          content,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.message : m));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading || !myId || !otherId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (uploadRes.ok) {
        const fileData = await uploadRes.json();
        
        // Now send the message with file metadata
        const msgRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teachingId,
            senderId: myId,
            receiverId: otherId,
            content: '',
            fileUrl: fileData.fileUrl,
            fileName: fileData.fileName,
            fileType: fileData.fileType,
          }),
        });

        if (msgRes.ok) {
          const data = await msgRes.json();
          setMessages(prev => [...prev, data.message]);
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 font-jakarta">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[600px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-gradient-to-r from-earthy-green to-emerald-600 text-white shrink-0">
          <img
            src={otherUser.imageUrl || `https://randomuser.me/api/portraits/lego/1.jpg`}
            alt={otherUser.fullName}
            className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{otherUser.fullName}</p>
            <p className="text-xs text-white/70 truncate">{teachingTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
              Online
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-7 h-7 border-2 border-earthy-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-16 h-16 bg-earthy-green/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-earthy-green" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Start the conversation!</p>
                <p className="text-sm text-slate-500 mt-1">Ask a question about <span className="font-semibold">{teachingTitle}</span></p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === myId;
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  <img
                    src={(isOwn ? currentUser.imageUrl : otherUser.imageUrl) || `https://randomuser.me/api/portraits/lego/1.jpg`}
                    alt=""
                    className="w-7 h-7 rounded-full shrink-0 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-earthy-green text-white rounded-br-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'}`}>
                    {msg.fileUrl ? (
                      <div className="flex flex-col gap-2">
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${isOwn ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isOwn ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                            {msg.fileType?.includes('video') ? (
                              <Video className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-earthy-green'}`} />
                            ) : msg.fileType?.includes('pdf') ? (
                              <FileText className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-red-500'}`} />
                            ) : (
                              <FileText className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-blue-500'}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${isOwn ? 'text-white' : 'text-slate-900'}`}>{msg.fileName || 'Shared File'}</p>
                            <p className={`text-[10px] uppercase font-bold tracking-wider ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
                              {msg.fileType?.split('/')[1] || 'FILE'}
                            </p>
                          </div>
                          <a 
                            href={`/api/download/${encodeURIComponent(msg.fileUrl?.split('/').pop() || '')}`} 
                            download={msg.fileName}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className={`p-2 rounded-full transition-colors ${isOwn ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-500'}`}
                            title={`Download ${msg.fileName}`}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                        {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.mp4,.webm"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 text-slate-400 hover:text-earthy-green hover:bg-slate-50 rounded-xl transition-all shrink-0"
            title="Attach a file"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={uploading ? "Uploading file..." : `Message ${otherUser.fullName.split(' ')[0]}...`}
            disabled={uploading}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earthy-green/50 focus:border-earthy-green text-sm transition-all"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-earthy-green text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
