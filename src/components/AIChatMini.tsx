import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, Store, Package, ChevronRight } from 'lucide-react';
import { generateAIResponse, type SmartAction } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Message {
  role: 'user' | 'ai';
  text: string;
  actions?: SmartAction[];
}

interface AIChatMiniProps {
  onClose: () => void;
}

const AIChatMini: React.FC<AIChatMiniProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [adminStoreId, setAdminStoreId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: `Halo ${user?.name}! Saya asisten InboxAI. Ada yang bisa saya bantu terkait toko Anda hari ini? ✨` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch admin's first store to provide context for the AI
    const fetchStore = async () => {
      if (user?.id) {
        try {
          const q = query(
            collection(db, 'stores'),
            where('owner_id', '==', user.id),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setAdminStoreId(querySnapshot.docs[0].id);
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchStore();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const renderMessageText = (text: string) => {
    // Split text by both PROD and STORE tags
    const parts = text.split(/(\[PROD:[^\]]+\]|\[STORE:[^\]]+\])/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('[PROD:')) {
        const [_, id, name] = part.replace(/[\[\]]/g, '').split(':');
        return (
          <button 
            key={index}
            onClick={() => navigate(`/toko?storeId=${id}`)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md hover:bg-indigo-500 hover:text-white transition-all font-bold mx-1 align-middle"
          >
            <Package className="w-2.5 h-2.5" />
            {name || 'Produk'}
          </button>
        );
      } else if (part.startsWith('[STORE:')) {
        const [_, id, name] = part.replace(/[\[\]]/g, '').split(':');
        return (
          <button 
            key={index}
            onClick={() => navigate(`/toko/${id}`)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md hover:bg-emerald-500 hover:text-white transition-all font-bold mx-1 align-middle"
          >
            <Store className="w-2.5 h-2.5" />
            {name || 'Toko'}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev: Message[]) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Use the fetched adminStoreId for dynamic context
      const response = await generateAIResponse(userMsg, adminStoreId);
      setMessages((prev: Message[]) => [...prev, { 
        role: 'ai', 
        text: response.text,
        actions: response.actions || []
      }]);
    } catch (error) {
      setMessages((prev: Message[]) => [...prev, { role: 'ai', text: 'Maaf kak, sistem sedang sibuk sebentar. Coba lagi ya! 🙏' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-8 w-80 h-[420px] glass rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden z-[100] slide-in-up">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center glow-indigo">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100">AI Assistant</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-area">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed shadow-lg ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'glass border border-white/5 text-zinc-300 rounded-tl-none'
            }`}>
              {renderMessageText(msg.text)}
            </div>
            
            {/* Action Chips for AI Messages in Mini Chat */}
            {msg.role === 'ai' && msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 px-1">
                {msg.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-bold transition-all active:scale-95 group"
                  >
                    {action.label}
                    <ChevronRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
              <span className="text-[10px] text-zinc-500">AI sedang mengetik...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya sesuatu ke AI..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500/50 transition-colors pr-10"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-2 p-1 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChatMini;
