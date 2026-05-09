import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { generateAIResponse, saveMessage } from '../services/api';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  doc,
  limit,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  MoreHorizontal, 
  Phone, 
  Video, 
  Send,
  Plus, 
  MessageCircle,
  Store,
  Search,
  User as UserIcon,
  Loader2,
  ShoppingBag,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

const Percakapan: React.FC = () => {
  const { autoReplyEnabled } = useAppContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get('id');

  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(conversationIdFromUrl);
  const typingTimeoutRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (conversationIdFromUrl) {
      setSelectedConvId(conversationIdFromUrl);
    }
  }, [conversationIdFromUrl]);

  useEffect(() => {
    // Conversations are handled by the real-time listener setup in setupRealtimeList
  }, [user]);

  useEffect(() => {
    if (selectedConvId) {
      // 1. Listen for messages
      const qMsgs = query(
        collection(db, 'messages'),
        where('conversation_id', '==', selectedConvId),
        orderBy('created_at', 'asc')
      );

      const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: (doc.data().created_at as any)?.toDate()?.toISOString() || new Date().toISOString()
        }));
        setMessages(msgs);
      });

      // 2. Listen for conversation updates (typing status)
      const unsubConv = onSnapshot(doc(db, 'conversations', selectedConvId), (snap) => {
        if (snap.exists()) {
          setTypingId(snap.data().typing_id || null);
        }
      });

      return () => {
        unsubMsgs();
        unsubConv();
      };
    }
  }, [selectedConvId]);

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!selectedConvId || !user?.id) return;
    try {
      await updateDoc(doc(db, 'conversations', selectedConvId), {
        typing_id: isTyping ? user.id : null
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    
    // Set typing status
    updateTypingStatus(true);
    
    // Clear timeout if exists
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Set timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 3000);
  };

  useEffect(() => {
    if (selectedConvId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === selectedConvId);
      if (conv?.store_id) {
        fetchStoreProducts(conv.store_id);
      }
    }
  }, [selectedConvId, conversations]);

  const fetchStoreProducts = async (storeId: string) => {
    setIsProductsLoading(true);
    try {
      const q = query(collection(db, 'products'), where('store_id', '==', storeId), limit(10));
      const snap = await getDocs(q);
      setStoreProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  const [unsubList, setUnsubList] = useState<(() => void) | null>(null);

  useEffect(() => {
    const setupRealtimeList = async () => {
      if (!user) return;
      setIsLoading(true);
      
      try {
        if (unsubList) unsubList();

        let storeIds: string[] = [];
        if (isAdmin) {
          // Robust store detection (check both admin_id and owner_id)
          const q1 = query(collection(db, 'stores'), where('owner_id', '==', user.id));
          const q2 = query(collection(db, 'stores'), where('admin_id', '==', user.id));
          
          const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
          const combinedDocs = [...s1.docs, ...s2.docs];
          storeIds = Array.from(new Set(combinedDocs.map(d => d.id)));

          if (storeIds.length === 0) {
            setConversations([]);
            setIsLoading(false);
            return;
          }
        }

        const q = isAdmin 
          ? query(collection(db, 'conversations'), where('store_id', 'in', storeIds), orderBy('updated_at', 'desc'))
          : query(collection(db, 'conversations'), where('customer_id', '==', user.id), orderBy('updated_at', 'desc'));

        const unsub = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data()
          }));

          setConversations(data || []);
          
          // Auto-select logic
          if (conversationIdFromUrl) {
            setSelectedConvId(conversationIdFromUrl);
          } else if (data && data.length > 0 && !selectedConvId) {
            setSelectedConvId(data[0].id);
            setSearchParams({ id: data[0].id });
          }
          
          setIsLoading(false);
        }, () => {
          setIsLoading(false);
        });

        setUnsubList(() => unsub);
      } catch (err) {
        console.error("Setup list error:", err);
        setIsLoading(false);
      }
    };

    setupRealtimeList();

    return () => {
      if (unsubList) unsubList();
    };
  }, [user?.id, isAdmin]);


  const handleSend = async () => {
    if (!inputText.trim() || !selectedConvId) return;
    const userText = inputText;
    const cid = selectedConvId;
    setInputText('');
    try {
      await saveMessage(cid, isAdmin ? 'ai' : 'user', userText);
      await updateTypingStatus(false);
      if (autoReplyEnabled && !isAdmin) {
        setIsAiTyping(true);
        const activeConv = conversations.find(c => c.id === cid);
        const aiResponse = await generateAIResponse(userText, activeConv?.store_id, isAdmin, cid);
        
        // Save with actions
        await addDoc(collection(db, 'messages'), {
          conversation_id: cid,
          sender: 'ai',
          text: aiResponse.text,
          actions: aiResponse.actions || [],
          created_at: serverTimestamp()
        });
        
        setIsAiTyping(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConvId(id);
    setSearchParams({ id });
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Menghubungkan Sinyal...</span>
        </div>
      </main>
    );
  }

  if (conversations.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 text-zinc-700 border border-white/5 shadow-2xl">
          <MessageCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100">{isAdmin ? 'Belum Ada Chat Masuk' : 'Belum Ada Percakapan'}</h2>
        {!isAdmin && (
          <button onClick={() => navigate('/jelajah')} className="mt-10 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2 mx-auto">
            <Search className="w-4 h-4" /> Jelajah Toko
          </button>
        )}
      </main>
    );
  }

  const activeConv = conversations.find(c => c.id === selectedConvId);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Sidebar Inbox */}
      <div className={`
        ${selectedConvId ? 'hidden md:flex' : 'flex'} 
        w-full md:w-[320px] border-r border-white/5 flex-col flex-shrink-0 bg-black/20
      `}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            Inbox <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">{conversations.length}</span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map((conv) => (
            <div key={conv.id} onClick={() => handleSelectConversation(conv.id)} className={`p-4 flex items-center gap-4 cursor-pointer transition-all border-b border-white/5 hover:bg-white/[0.02] ${selectedConvId === conv.id ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : ''}`}>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 flex-shrink-0 border border-white/5 overflow-hidden">
                {isAdmin ? (
                   <div className="w-full h-full flex items-center justify-center bg-violet-500/10 text-violet-400">
                     <UserIcon className="w-6 h-6" />
                   </div>
                ) : (
                  conv.store_image ? (
                    <img src={conv.store_image} alt={conv.store_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-500/10 text-indigo-400">
                      <Store className="w-6 h-6" />
                    </div>
                  )
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-xs font-bold text-zinc-100 truncate">{isAdmin ? (conv.customer_name || 'Pelanggan') : (conv.store_name || 'Toko')}</h3>
                  <span className="text-[8px] text-zinc-600 whitespace-nowrap">
                    {conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate">{conv.last_message || 'Tidak ada pesan...'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <main className={`
        ${selectedConvId ? 'flex' : 'hidden md:flex'} 
        flex-1 flex-col min-w-0 relative bg-black/5 h-full
      `}>
        {!selectedConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-200">Pilih Percakapan</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto">Silakan pilih salah satu percakapan di samping untuk mulai berdiskusi.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/5 bg-black/10 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Back Button for Mobile */}
            <button 
              onClick={() => setSelectedConvId(null)}
              className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>

            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 shadow-lg shadow-indigo-500/10 overflow-hidden border border-white/5 flex-shrink-0">
              {isAdmin ? (
                <div className="w-full h-full flex items-center justify-center bg-violet-500/10 text-violet-400">
                  <UserIcon className="w-6 h-6" />
                </div>
              ) : (
                activeConv?.store_image ? (
                  <img src={activeConv.store_image} alt={activeConv.store_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-500/10 text-indigo-400">
                    <Store className="w-6 h-6" />
                  </div>
                )
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">{isAdmin ? (activeConv?.customer_name || 'Pelanggan') : (activeConv?.store_name || 'Toko')}</h2>
              <div className="flex items-center gap-1.5 mt-0.5"><span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Online</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isAdmin && (
              <button 
                onClick={() => navigate(`/jelajah?storeId=${activeConv?.store_id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-wider"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Lihat Katalog
              </button>
            )}
            <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Phone className="w-4 h-4" /></button>
            <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Video className="w-4 h-4" /></button>
            <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-transparent">
          {messages.map((msg) => {
            const isMe = msg.sender === (isAdmin ? 'ai' : 'user');
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[75%] space-y-1.5`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 rounded-tr-none' : 'bg-white/5 text-zinc-200 border border-white/5 rounded-tl-none'}`}>
                    {msg.text.split('\n').map((line: string, lineIdx: number) => {
                      if (!line.trim()) return <div key={lineIdx} className="h-2" />;
                      
                      // Deteksi tag produk & toko di dalam baris
                      const parts = line.split(/(\[PROD:[^\]]+\]|\[STORE:[^\]]+\])/g);
                      
                      return (
                        <div key={lineIdx} className="mb-1 last:mb-0">
                          {parts.map((part: string, i: number) => {
                            if (part.startsWith('[PROD:') && part.endsWith(']')) {
                              const [_, id, name] = part.replace(/[\[\]]/g, '').split(':');
                              return (
                                <button 
                                  key={`${lineIdx}-${i}`}
                                  onClick={() => navigate(`/toko?storeId=${id}`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-600 hover:text-white transition-all font-bold mx-1 align-middle group shadow-sm"
                                >
                                  <ShoppingBag className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                  {name || 'Produk'}
                                </button>
                              );
                            }
                            if (part.startsWith('[STORE:') && part.endsWith(']')) {
                              const [_, id, name] = part.replace(/[\[\]]/g, '').split(':');
                              return (
                                <button 
                                  key={`${lineIdx}-${i}`}
                                  onClick={() => navigate(`/toko/${id}`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-600 hover:text-white transition-all font-bold mx-1 align-middle group shadow-sm"
                                >
                                  <Store className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                  {name || 'Toko'}
                                </button>
                              );
                            }
                            return <span key={i}>{part}</span>;
                          })}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Chips for AI Messages */}
                  {!isMe && msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 ml-2">
                      {msg.actions.map((action: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => navigate(action.path)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[11px] font-bold transition-all active:scale-95 group shadow-lg shadow-indigo-500/5"
                        >
                          {action.label}
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`flex items-center gap-2 text-[9px] text-zinc-600 font-bold uppercase tracking-widest ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          {isAiTyping && (
            <div className="flex justify-start">
              <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-2">AI Mengetik...</span>
              </div>
            </div>
          )}
          {typingId && typingId !== user?.id && (
            <div className="flex justify-start">
              <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-2">
                  {isAdmin ? 'Pelanggan Mengetik...' : 'Admin Mengetik...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 bg-black/20 border-t border-white/5 pb-8 md:pb-6">
          <div className="flex items-center gap-3 md:gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 focus-within:border-indigo-500/50 transition-all">
            <button className="p-2 text-zinc-500 hover:text-indigo-400 transition-colors"><Plus className="w-5 h-5" /></button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tulis pesan Anda..."
              className="flex-1 bg-transparent border-none focus:outline-none text-sm text-zinc-200 py-2"
            />
            <button onClick={handleSend} disabled={!inputText.trim()} className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl flex items-center justify-center text-white transition-all flex-shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        </>
        )}
      </main>

      {/* Right Sidebar: Store Catalog (Only for Customers) */}
      {!isAdmin && (
        <aside className="w-[260px] border-l border-white/5 bg-black/20 hidden xl:flex flex-col flex-shrink-0">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-indigo-400" /> Katalog Toko</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {isProductsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Memuat...</span>
              </div>
            ) : storeProducts.length === 0 ? (
              <div className="text-center py-12 px-4 text-[10px] text-zinc-500 font-medium italic">Belum ada produk.</div>
            ) : (
              storeProducts.map((product) => (
                <div 
                  key={product.id}
                  onClick={() => setInputText(`Halo, saya tertarik dengan "${product.name}". Stok masih ada?`)}
                  className="glass p-3 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
                >
                  <div className="w-full h-20 bg-white/5 rounded-xl mb-2 overflow-hidden border border-white/5 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-zinc-800" />
                    )}
                  </div>
                  <h4 className="text-[10px] font-bold text-zinc-100 truncate mb-1">{product.name}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-400">Rp {product.price?.toLocaleString('id-ID')}</span>
                    <Plus className="w-3 h-3 text-zinc-600" />
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </div>
  );
};

export default Percakapan;
