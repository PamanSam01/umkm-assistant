import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  BrainCircuit, 
  MessageCircle,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2
} from 'lucide-react';

const AIInsights: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0
  });
  const [intents, setIntents] = useState([
    { label: 'Tanya Harga / Katalog', val: 0, color: 'from-indigo-500 to-indigo-400', text: 'text-indigo-400', keywords: ['harga', 'katalog', 'berapa', 'price', 'menu'] },
    { label: 'Konfirmasi Stok', val: 0, color: 'from-cyan-500 to-cyan-400', text: 'text-cyan-400', keywords: ['stok', 'ready', 'ada', 'habis', 'stock'] },
    { label: 'Tanya Ongkir / Pengiriman', val: 0, color: 'from-emerald-500 to-emerald-400', text: 'text-emerald-400', keywords: ['ongkir', 'kirim', 'kurir', 'resi', 'jne', 'jnt'] },
    { label: 'Komplain / Retur', val: 0, color: 'from-rose-500 to-rose-400', text: 'text-rose-400', keywords: ['komplain', 'retur', 'rusak', 'salah', 'kecewa', 'marah'] },
    { label: 'Lainnya', val: 0, color: 'from-zinc-500 to-zinc-400', text: 'text-zinc-400', keywords: [] }
  ]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const storesQuery = query(collection(db, 'stores'), where('owner_id', '==', user.id));
        const storesSnap = await getDocs(storesQuery);
        const storeIds = storesSnap.docs.map(d => d.id);

        if (storeIds.length === 0) {
          setLoading(false);
          return;
        }

        const convsQuery = query(collection(db, 'conversations'), where('store_id', 'in', storeIds));
        const convsSnap = await getDocs(convsQuery);
        const convIds = convsSnap.docs.map(d => d.id);

        if (convIds.length === 0) {
          setLoading(false);
          return;
        }

        const messagesQuery = query(collection(db, 'messages'), where('conversation_id', 'in', convIds.slice(0, 30)));
        const messagesSnap = await getDocs(messagesQuery);
        const messages = messagesSnap.docs
          .map(doc => doc.data() as { text: string, sender: string })
          .filter(m => m.sender === 'user');

        const total = messages.length;
        if (total > 0) {
          const updatedIntents = intents.map(intent => {
            if (intent.label === 'Lainnya') return intent;
            const count = messages.filter(m => 
              intent.keywords.some(k => m.text.toLowerCase().includes(k))
            ).length;
            return { ...intent, val: Math.round((count / total) * 100) };
          });

          const totalRecognized = updatedIntents.reduce((sum, i) => i.label !== 'Lainnya' ? sum + i.val : sum, 0);
          const lainnyaIdx = updatedIntents.findIndex(i => i.label === 'Lainnya');
          updatedIntents[lainnyaIdx].val = Math.max(0, 100 - totalRecognized);
          setIntents(updatedIntents);

          const negCount = messages.filter(m => ['rusak', 'salah', 'kecewa', 'marah', 'jelek', 'mahal'].some(k => m.text.toLowerCase().includes(k))).length;
          const posCount = messages.filter(m => ['bagus', 'terima kasih', 'thanks', 'mantap', 'oke', 'ok', 'murah'].some(k => m.text.toLowerCase().includes(k))).length;
          
          setStats({
            positive: posCount,
            negative: negCount,
            neutral: total - posCount - negCount,
            total: total
          });
        }
      } catch (err) {
        console.error('Error fetching insights:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [user?.id]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </main>
    );
  }

  const positivePercent = stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;
  const neutralPercent = stats.total > 0 ? Math.round((stats.neutral / stats.total) * 100) : 0;
  const negativePercent = stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0;

  return (
    <main className="flex-1 overflow-y-auto scroll-area bg-[#09090b]">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-100 mb-2 flex items-center gap-3">
              Pusat Wawasan AI
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </h1>
            <p className="text-sm text-zinc-400">Analisis mendalam dari AI mengenai pelanggan dan percakapan Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-zinc-100 flex items-center gap-2 mb-6">
              <BrainCircuit className="w-4 h-4 text-violet-400" />
              Analisis Sentimen
            </h3>
            <div className="flex items-center justify-center relative w-40 h-40 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-[16px] border-white/5"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-bold text-zinc-100">{positivePercent}%</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Positif</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-zinc-300">Positif</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400">{positivePercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-zinc-300">Netral</span>
                </div>
                <span className="text-xs font-semibold text-cyan-400">{neutralPercent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-rose-400" />
                  <span className="text-xs text-zinc-300">Negatif / Komplain</span>
                </div>
                <span className="text-xs font-semibold text-rose-400">{negativePercent}%</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-zinc-100 flex items-center gap-2 mb-6">
              <MessageCircle className="w-4 h-4 text-indigo-400" />
              Top Intent (Niat Pelanggan)
            </h3>
            <div className="space-y-5">
              {intents.map((intent, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-300">{intent.label}</span>
                    <span className={`text-sm font-semibold ${intent.text}`}>{intent.val}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${intent.color}`} style={{ width: `${intent.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h3 className="font-display font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Rekomendasi Strategi AI
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass p-5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group overflow-hidden relative">
            <div className="w-full h-28 mb-4 rounded-xl overflow-hidden bg-emerald-500/5 border border-white/5">
              <img src="/indonesia_shipping_strategy.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100 mb-1">Konsultasi Ongkir</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Dorong pelanggan untuk bertanya ongkir di chat. AI akan membantu menghitung estimasi kurir terbaik secara instan.
            </p>
          </div>

          <div className="glass p-5 rounded-3xl border border-white/5 hover:border-cyan-500/30 transition-all group overflow-hidden relative">
            <div className="w-full h-28 mb-4 rounded-xl overflow-hidden bg-cyan-500/5 border border-white/5">
              <img src="/indonesia_bundle_strategy.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100 mb-1">Upsell Bundle</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Tingkatkan nilai transaksi dengan paket bundling produk yang sering dibeli bersamaan.
            </p>
          </div>

          <div className="glass p-5 rounded-3xl border border-white/5 hover:border-violet-500/30 transition-all group overflow-hidden relative">
            <div className="w-full h-28 mb-4 rounded-xl overflow-hidden bg-violet-500/5 border border-white/5">
              <img src="/indonesia_busy_hours_strategy.png" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100 mb-1">Jam Sibuk</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Siapkan stok dan respons AI lebih cepat pada jam sibuk belanja (19:00 - 21:00).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AIInsights;
