import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  MessageSquare, 
  Send, 
  X, 
  User, 
  Clock, 
  CheckCheck,
  ShieldCheck
} from 'lucide-react';
import { RideRequest } from '../types';

interface CustomerChatCallModalProps {
  ride: RideRequest;
  initialMode: 'call' | 'chat';
  onClose: () => void;
}

export const CustomerChatCallModal: React.FC<CustomerChatCallModalProps> = ({
  ride,
  initialMode,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'call' | 'chat'>(initialMode);
  
  // Call simulation states
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);

  // Chat simulation states
  const [messages, setMessages] = useState<{ id: string; sender: 'driver' | 'customer'; text: string; time: string }[]>([
    { id: '1', sender: 'customer', text: 'Hi Captain, please pick me up right next to the bakery gate.', time: 'Just now' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const quickTemplates = [
    "I have arrived at your pickup location! 📍",
    "On my way, reaching in 2 minutes 🛵",
    "Please share exact landmark 🏬",
    "I am wearing a yellow helmet 🪖"
  ];

  // Call timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTab === 'call') {
      if (callState === 'ringing') {
        const ringTimer = setTimeout(() => {
          setCallState('connected');
        }, 3000);
        return () => clearTimeout(ringTimer);
      } else if (callState === 'connected') {
        timer = setInterval(() => {
          setCallDuration(d => d + 1);
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [activeTab, callState]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'driver' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');

    // Simulate customer auto-reply
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'customer',
          text: 'Got it Captain! Waiting here.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="customer-contact-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Header Tabs */}
        <div className="flex items-center justify-between p-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2">
            <button
              id="tab-btn-call"
              onClick={() => setActiveTab('call')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'call' ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Internet Call</span>
            </button>

            <button
              id="tab-btn-chat"
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'chat' ? 'bg-amber-400 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Driver Chat</span>
            </button>
          </div>

          <button
            id="btn-close-contact-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CALL VIEW */}
        {activeTab === 'call' && (
          <div className="p-6 text-center">
            {/* Number Masking Notice */}
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-[11px] font-semibold text-emerald-400 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Number Masked for Captain & Rider Privacy</span>
            </div>

            {/* Customer Avatar & Info */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-extrabold text-3xl">
                {ride.customerName.charAt(0)}
              </div>
              {callState === 'ringing' && (
                <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-60" />
              )}
            </div>

            <h3 className="text-xl font-black text-zinc-100">{ride.customerName}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">★ {ride.customerRating} Rider • Sawari Secure Call</p>

            <div className="my-6">
              {callState === 'ringing' && (
                <p className="text-sm font-semibold text-amber-400 animate-pulse">Ringing rider phone...</p>
              )}
              {callState === 'connected' && (
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{formatCallTime(callDuration)}</span>
                </div>
              )}
              {callState === 'ended' && (
                <p className="text-sm font-semibold text-zinc-400">Call Ended</p>
              )}
            </div>

            {/* End Call Button */}
            <div className="flex items-center justify-center gap-4">
              {callState !== 'ended' ? (
                <button
                  id="btn-end-call"
                  onClick={() => setCallState('ended')}
                  className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              ) : (
                <button
                  id="btn-re-call"
                  onClick={() => { setCallState('ringing'); setCallDuration(0); }}
                  className="px-5 py-2.5 bg-amber-400 text-zinc-950 font-bold rounded-xl active:scale-95"
                >
                  Call Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* CHAT VIEW */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[380px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'driver' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      m.sender === 'driver'
                        ? 'bg-amber-400 text-zinc-950 font-semibold rounded-br-none'
                        : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 px-1 flex items-center gap-1">
                    {m.time}
                    {m.sender === 'driver' && <CheckCheck className="w-3 h-3 text-amber-400" />}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick response chips */}
            <div className="px-3 py-2 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickTemplates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(tpl)}
                  className="whitespace-nowrap px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 font-medium active:scale-95 transition-colors"
                >
                  {tpl}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
              <input
                id="input-chat-message"
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type message to rider..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
              />
              <button
                id="btn-send-message"
                onClick={() => handleSendMessage()}
                className="p-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl font-bold transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
