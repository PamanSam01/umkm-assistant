import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  Bot, 
  MessageSquareQuote,
  Shield,
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Pengaturan: React.FC = () => {
  const { user } = useAuth();
  const { autoReplyEnabled, setAutoReplyEnabled } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchStoreData();
    }
  }, [user?.id]);

  const fetchStoreData = async () => {
    try {
      const q = query(collection(db, 'stores'), where('owner_id', '==', user?.id));
      const snap = await getDocs(q);
      setStores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save for global settings
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 relative scroll-area p-6 lg:p-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-zinc-100 mb-2 flex items-center gap-3">
            Pengaturan Sistem
            <Settings className="w-6 h-6 text-zinc-400" />
          </h1>
          <p className="text-sm text-zinc-400">Kelola profil UMKM dan atur perilaku AI Assistant Anda.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
        </button>
      </div>

      {showSuccess && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Pengaturan berhasil diperbarui!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Store Profiles */}
          <section className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-zinc-100 flex items-center gap-2 mb-6">
              <Store className="w-4 h-4 text-cyan-400" />
              Toko Terhubung ({stores.length})
            </h3>
            
            <div className="space-y-4">
              {stores.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">Belum ada toko yang terdaftar.</p>
              ) : (
                stores.map(s => (
                  <div key={s.id} className="p-4 border border-white/5 bg-white/5 rounded-xl">
                    <div className="text-sm font-bold text-zinc-100 mb-1">{s.name}</div>
                    <div className="text-xs text-zinc-500 line-clamp-2">{s.description}</div>
                    <div className="mt-3 text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                      ID: {s.id}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Integration Status */}
          <section className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-zinc-100 flex items-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-emerald-400" />
              Status Keamanan & Integrasi
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-white/5 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <MessageSquareQuote className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">Firebase Firestore</div>
                    <div className="text-[10px] text-emerald-400">Terkoneksi (Real-time)</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border border-white/5 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-200">Gemini AI Model</div>
                    <div className="text-[10px] text-indigo-400">Aktif (Fallback Mode)</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* AI Behavioral Settings */}
          <section className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold text-zinc-100 flex items-center gap-2 mb-6">
              <Bot className="w-4 h-4 text-indigo-400" />
              Konfigurasi Balasan AI
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <div className="text-sm font-semibold text-zinc-200 mb-0.5">Auto-Reply Global</div>
                  <div className="text-[11px] text-zinc-500">Aktifkan untuk semua toko yang Anda miliki.</div>
                </div>
                <div 
                  className={`toggle-track ${autoReplyEnabled ? 'on' : ''}`} 
                  onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                >
                  <div className="toggle-thumb"></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">Batas Kewenangan (Guardrails)</label>
                <div className="space-y-3">
                  {[
                    "Boleh informasikan stok & harga",
                    "Gunakan sapaan ramah (Kak/Sis)",
                    "Wajib arahkan ke checkout/pembelian"
                  ].map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs text-zinc-400">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Pengaturan;
