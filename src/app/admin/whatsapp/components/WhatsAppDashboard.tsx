'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Smartphone, Send, MessageSquare, User, Bot, ShieldAlert } from 'lucide-react';

const WHATSAPP_API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'http://localhost:8000';

interface ChatMessage {
  sender: 'customer' | 'ai' | 'admin';
  text: string;
  timestamp: string;
}

interface ChatContact {
  phone: string;
  messages: ChatMessage[];
  last_activity: string;
}

export function WhatsAppDashboard() {
  const [status, setStatus] = useState<string>('checking');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Live Chat state
  const [chats, setChats] = useState<ChatContact[]>([]);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/status`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const data = await res.json();
      setStatus(data.status);
      setError(null);
      setLastUpdated(new Date());

      if (data.status === 'awaiting_scan') {
        fetchQr();
      } else if (data.status === 'connected') {
        fetchChats();
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to WhatsApp service');
      setStatus('disconnected');
    }
  };

  const fetchQr = async () => {
    try {
      const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/qr`);
      if (!res.ok) throw new Error('Failed to fetch QR');
      const data = await res.json();
      if (data.qr) {
        setQrCode(data.qr);
      }
    } catch (err: any) {
      console.error('Error fetching QR:', err);
    }
  };

  const fetchChats = async () => {
    try {
      const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/chats`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
        if (!activePhone && data.chats.length > 0) {
          setActivePhone(data.chats[0].phone);
        }
      }
    } catch (err: any) {
      console.error('Error fetching chats:', err);
    }
  };

  const sendAdminMessage = async () => {
    if (!activePhone || !replyMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch(`${WHATSAPP_API_URL}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: activePhone,
          message: replyMessage.trim()
        })
      });
      if (res.ok) {
        setReplyMessage('');
        fetchChats();
      } else {
        alert('Failed to send message.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [activePhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activePhone]);

  const activeChat = chats.find(c => c.phone === activePhone);

  return (
    <div className="space-y-6">
      {/* Top Status Header */}
      <div className="bg-[#111] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : status === 'awaiting_scan' ? 'bg-yellow-500 animate-ping' : 'bg-red-500'}`} />
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-luxe-accent" />
              WhatsApp Bot Connection Status: <span className="capitalize font-bold">{status.replace('_', ' ')}</span>
            </h2>
            <p className="text-xs text-white/50">Last checked: {lastUpdated.toLocaleTimeString()}</p>
          </div>
        </div>
        <button 
          onClick={fetchStatus}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-xs"
          title="Refresh Status"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Disconnected / Scanning View */}
      {status !== 'connected' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Code / Disconnected Card */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[350px]">
            {status === 'checking' && (
              <div className="flex flex-col items-center gap-4 text-white/60">
                <Loader2 className="w-8 h-8 animate-spin text-luxe-accent" />
                <p>Checking connection to bot server...</p>
              </div>
            )}

            {status === 'disconnected' && (
              <div className="flex flex-col items-center gap-4 text-white/60 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">Disconnected</p>
                  <p className="text-sm mt-1 text-red-400">{error || 'Bot service is offline.'}</p>
                  <p className="text-xs mt-3 text-white/40">Make sure the Python Render backend is running.</p>
                </div>
              </div>
            )}

            {status === 'awaiting_scan' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-white">Scan to Connect</p>
                  <p className="text-sm mt-1 text-white/60">Open WhatsApp on your phone → Linked Devices → Scan QR</p>
                </div>
                
                {qrCode ? (
                  <div className="p-4 bg-white rounded-xl shadow-lg border border-white/20">
                    <QRCodeSVG value={qrCode} size={220} />
                  </div>
                ) : (
                  <div className="w-[220px] h-[220px] bg-white/5 rounded-xl flex flex-col items-center justify-center text-white/40 border border-white/10">
                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-luxe-accent" />
                    <span className="text-xs">Generating QR Code...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions Card */}
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">How it works</h2>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-luxe-accent/20 text-luxe-accent flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                <p>Ensure the Python bot server (Neonize) is deployed and running on Render.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-luxe-accent/20 text-luxe-accent flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                <p>If disconnected, scan the QR code above using <strong>WhatsApp Mobile &gt; Linked Devices</strong>.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-luxe-accent/20 text-luxe-accent flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                <p>Once connected, customer messages and automated order updates/invoices flow seamlessly.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-luxe-accent/20 text-luxe-accent flex items-center justify-center shrink-0 text-xs font-bold">4</div>
                <p>Incoming customer questions will automatically receive Gemini AI smart answers.</p>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-xs text-white/50 mb-1 uppercase font-semibold tracking-wider">Backend API Endpoint</p>
              <code className="text-luxe-accent bg-luxe-accent/10 px-2.5 py-1 rounded text-xs break-all block">{WHATSAPP_API_URL}</code>
            </div>
          </div>
        </div>
      )}

      {/* Connected Live Chat Manager */}
      {status === 'connected' && (
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[550px] max-h-[650px]">
          {/* Contacts Sidebar */}
          <div className="border-r border-white/10 flex flex-col bg-[#0d0d0d]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                Active Conversations ({chats.length})
              </h3>
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">Live</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {chats.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No customer messages received yet.
                  <br />Text your bot on WhatsApp to test!
                </div>
              ) : (
                chats.map((chat) => {
                  const lastMsg = chat.messages[chat.messages.length - 1];
                  const isActive = chat.phone === activePhone;
                  return (
                    <button
                      key={chat.phone}
                      onClick={() => setActivePhone(chat.phone)}
                      className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 ${isActive ? 'bg-white/10 border-l-2 border-luxe-accent' : 'hover:bg-white/5'}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white/80 font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="text-xs font-semibold text-white truncate">+{chat.phone}</p>
                          {chat.last_activity && (
                            <span className="text-[10px] text-white/40">
                              {new Date(chat.last_activity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 truncate mt-1">
                          {lastMsg ? lastMsg.text : 'No messages'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Thread */}
          <div className="md:col-span-2 flex flex-col bg-[#141414]">
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">+{activeChat.phone}</h4>
                      <p className="text-[11px] text-green-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Connected &amp; Auto-Responding
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message List */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {activeChat.messages.map((msg, i) => {
                    const isCustomer = msg.sender === 'customer';
                    const isAI = msg.sender === 'ai';
                    return (
                      <div
                        key={i}
                        className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-white/40">
                          {isCustomer && <span className="flex items-center gap-1 text-blue-400 font-medium"><User className="w-3 h-3" /> Customer</span>}
                          {isAI && <span className="flex items-center gap-1 text-purple-400 font-medium"><Bot className="w-3 h-3" /> Store Assistant</span>}
                          {msg.sender === 'admin' && <span className="flex items-center gap-1 text-green-400 font-medium"><ShieldAlert className="w-3 h-3" /> Admin</span>}
                          <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isCustomer
                              ? 'bg-white/10 text-white rounded-tl-none border border-white/10'
                              : isAI
                              ? 'bg-purple-900/40 text-purple-100 rounded-tr-none border border-purple-500/30'
                              : 'bg-green-700/50 text-white rounded-tr-none border border-green-500/30'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-white/10 bg-[#111]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendAdminMessage();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder={`Send a manual reply to +${activeChat.phone}...`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-luxe-accent transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!replyMessage.trim() || isSending}
                      className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shrink-0"
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40 text-xs p-8">
                <MessageSquare className="w-10 h-10 mb-2 opacity-20" />
                Select a conversation from the left to view live messages.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
