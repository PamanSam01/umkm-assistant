import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Bot, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Package,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateStockInsight, generatePerformanceEvaluation } from '../services/api';
import Logo from '../components/Logo';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
  color: 'indigo' | 'cyan' | 'emerald' | 'violet';
}> = ({ title, value, icon, trend, trendUp, color }) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20 glow-indigo',
    cyan: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/20 glow-cyan',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
    violet: 'from-violet-500/20 to-violet-600/5 text-violet-400 border-violet-500/20 glow-violet',
  };

  return (
    <div className={`glass rounded-2xl p-5 border ${colorMap[color].split(' ')[3]} hover:bg-white/5 transition-all cursor-default slide-in-up`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color].split(' ').slice(0, 2).join(' ')} flex items-center justify-center ${colorMap[color].split(' ')[2]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90" />}
          {trend}
        </div>
      </div>
      <div>
        <div className="text-zinc-300 text-xs font-bold uppercase tracking-wider mb-1">{title}</div>
        <div className="font-display text-2xl font-bold text-zinc-100">{value}</div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>({
    pesanMasuk: "0",
    aiReplyRate: "0%",
    pembeliBaru: "0",
    totalOmset: "Rp 0",
    konversi: "0%",
    pendapatan: "Rp 0",
    pesanTrend: "0%",
    replyTrend: "0%",
    convTrend: "0%",
    revenueTrend: "0%",
    chartData: [0, 0, 0, 0, 0, 0, 0],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const [performanceEval, setPerformanceEval] = useState<string | null>(null);
  const lastEvalTimeRef = useRef<number>(0);
  const lastStockInsightTimeRef = useRef<number>(0);
  const EVAL_COOLDOWN = 5 * 60 * 1000; // 5 Menit jeda analisis

  useEffect(() => {
    if (!user?.id) return;

    let unsubStores: () => void;
    let unsubOrders: () => void;
    let unsubConvs: () => void;

    const setupRealtimeListeners = async () => {
      setLoading(true);
      try {
        // 1. Get Store IDs first (This can stay as getDocs as store count doesn't change as often)
        const storesQuery = query(collection(db, 'stores'), where('admin_id', '==', user.id));
        const storesSnap = await getDocs(storesQuery);
        let storeIds = storesSnap.docs.map(d => d.id);

        if (storeIds.length === 0) {
          const ownerQuery = query(collection(db, 'stores'), where('owner_id', '==', user.id));
          const ownerSnap = await getDocs(ownerQuery);
          storeIds = ownerSnap.docs.map(d => d.id);
        }

        if (storeIds.length === 0) {
          setData({
            pesanMasuk: "0", aiReplyRate: "0%", pembeliBaru: "0", totalOmset: "Rp 0",
            konversi: "0%", pendapatan: "Rp 0", chartData: [0, 0, 0, 0, 0, 0, 0],
            recentActivity: []
          });
          setLoading(false);
          return;
        }

        // 2. Real-time Orders Listener
        const ordersQuery = query(collection(db, 'orders'), where('store_id', 'in', storeIds));
        unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
          let totalRevenue = 0;
          let newOrders = 0;
          const activities: any[] = [];

          snapshot.docs.forEach(doc => {
            const d = doc.data();
            if (d.status !== 'pending') {
              totalRevenue += (d.total_amount * (d.quantity || 1)) || 0;
              if (d.status === 'processing') newOrders++;
              
              activities.push({
                type: 'money',
                msg: `Order masuk: ${d.product_name} (x${d.quantity})`,
                time: d.checkout_at ? 'Baru saja' : 'Menunggu'
              });
            }
          });

          // 3. Real-time Conversations Listener
          const convsQuery = query(collection(db, 'conversations'), where('store_id', 'in', storeIds));
          unsubConvs = onSnapshot(convsQuery, (convSnap) => {
            const chatActivities = convSnap.docs.slice(0, 3).map(d => ({
              type: 'warning',
              msg: `Chat baru dari pelanggan di ${d.data().store_name || 'Toko'}`,
              time: 'Baru saja'
            }));

            const newStats = {
              pesanMasuk: newOrders.toString(),
              pembeliBaru: convSnap.size.toString(),
              totalOmset: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
              pendapatan: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
              konversi: convSnap.size > 0 ? `${Math.round((snapshot.size / convSnap.size) * 100)}%` : "0%",
              pesanTrend: "0%",
              replyTrend: "0%",
              convTrend: "0%",
              revenueTrend: "0%",
              chartData: [0, 0, 0, 0, 0, 0, 0],
              recentActivity: [...chatActivities, ...activities].slice(0, 5)
            };

            setData((prev: any) => ({
              ...prev,
              ...newStats
            }));

            // Generate AI Performance Evaluation (Throttled to save credits)
            const now = Date.now();
            if (now - lastEvalTimeRef.current > EVAL_COOLDOWN) {
              generatePerformanceEvaluation(newStats).then(evalText => {
                if (evalText) {
                  setPerformanceEval(evalText);
                  lastEvalTimeRef.current = now;
                }
              });
            }
          });

          setLoading(false);
        });

        // 4. Low Stock Monitor (Static is fine here, or keep simple)
        const qStock = query(collection(db, 'products'), where('store_id', 'in', storeIds), where('stock', '<', 5), limit(3));
        unsubStores = onSnapshot(qStock, async (snap) => {
          const products = snap.docs.map(doc => doc.data());
          setLowStockProducts(products || []);
          
          const now = Date.now();
          if (products.length > 0 && (now - lastStockInsightTimeRef.current > EVAL_COOLDOWN)) {
            const insight = await generateStockInsight(products);
            if (insight) {
              setAiInsight(insight);
              lastStockInsightTimeRef.current = now;
            }
          }
        });

      } catch (err) {
        console.error("Dashboard Realtime Error:", err);
        setLoading(false);
      }
    };

    setupRealtimeListeners();

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubConvs) unsubConvs();
      if (unsubStores) unsubStores();
    };
  }, [user?.id]);

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#09090b] gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative animate-pulse">
            <Logo size={64} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] ml-1">Menyiapkan Dashboard AI...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto scroll-area bg-[#09090b]">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 slide-in-right">
          <div>
            <h1 className="font-display text-3xl font-bold text-zinc-100 mb-2">
              Selamat Pagi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">{user?.name || 'User'}!</span>
            </h1>
            <p className="text-sm text-zinc-400">Berikut adalah ringkasan performa AI UMKM Anda hari ini.</p>
          </div>
          <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-dot"></div>
            <span className="text-xs font-semibold text-indigo-300">AI Assistant Aktif & Belajar</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard 
            icon={<MessageSquare className="w-5 h-5 text-indigo-400" />} 
            title="Total Pesan Masuk" 
            value={data.pesanMasuk} 
            trend={data.pesanTrend} 
            trendUp={true} 
            color="indigo"
          />
          <StatCard 
            icon={<Bot className="w-5 h-5 text-emerald-400" />} 
            title="Dibalas Oleh AI" 
            value={data.aiReplyRate} 
            trend={data.replyTrend} 
            trendUp={true} 
            color="emerald"
          />
          <StatCard 
            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />} 
            title="Konversi Pembelian" 
            value={data.konversi} 
            trend={data.convTrend} 
            trendUp={true} 
            color="emerald"
          />
          <StatCard 
            icon={<DollarSign className="w-5 h-5 text-violet-400" />} 
            title="Pendapatan Via Chat" 
            value={data.pendapatan} 
            trend={data.revenueTrend} 
            trendUp={false} 
            color="violet"
          />
        </div>

        {/* AI Smart Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 slide-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="lg:col-span-2 glass rounded-3xl p-8 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all"></div>
            
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-100">AI Smart Inventory Alerts</h2>
                  <p className="text-xs text-zinc-500">Analisis stok otomatis berbasis AI.</p>
                </div>
              </div>
            </header>

            <div className="space-y-4">
              {lowStockProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lowStockProducts.map((p, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-200">{p.name}</div>
                            <div className="text-[10px] text-zinc-500">Stok menipis</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-rose-400">{p.stock} pcs</div>
                      </div>
                    ))}
                  </div>
                  
                  {aiInsight && (
                    <div className="mt-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 flex gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0 glow-indigo">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">AI Business Insight</div>
                        <p className="text-xs text-zinc-200 leading-relaxed italic">"{aiInsight}"</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-200">Semua Stok Aman</h3>
                  <p className="text-xs text-zinc-500 mt-1">AI tidak mendeteksi adanya stok kritis saat ini.</p>
                </div>
              )}
            </div>
          </div>

          {/* Small Action Card */}
          <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6 border border-violet-500/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">Evaluasi Performa</h3>
              <p className="text-xs text-zinc-500 leading-relaxed min-h-[60px]">
                {performanceEval || "AI sedang menganalisis data transaksi Anda untuk memberikan saran bisnis terbaik..."}
              </p>
            </div>
            <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2">
              Lihat Laporan Detail <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 slide-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-semibold text-zinc-100">Aktivitas Pesan & Konversi</h3>
              <select className="bg-white/5 border border-white/10 rounded-lg text-xs text-zinc-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500/50">
                <option>7 Hari Terakhir</option>
                <option>30 Hari Terakhir</option>
              </select>
            </div>
            
            <div className="h-[250px] flex items-end justify-between gap-2 md:gap-4 mt-8 px-2 pb-6 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="border-t border-white/20 w-full h-px"></div>
                ))}
              </div>

              {/* Enhanced Bars */}
              {data.chartData.map((h: number, i: number) => (
                <div key={i} className="relative flex-1 group h-full flex items-end justify-center">
                  <div 
                    className="w-full max-w-[40px] bg-white/5 rounded-t-2xl relative group-hover:bg-white/10 transition-all duration-500 overflow-hidden"
                    style={{ height: '100%' }}
                  >
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-cyan-400 rounded-t-2xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all duration-1000 ease-out animate-in slide-in-from-bottom"
                      style={{ height: `${h || 10}%` }}
                    >
                      {/* Animated Glow Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                  <div className="absolute -bottom-8 text-[10px] text-zinc-500 font-bold tracking-tighter uppercase">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-indigo-500/50"></div>
                <span className="text-xs text-zinc-400">Total Pesan Masuk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-400/50"></div>
                <span className="text-xs text-zinc-400">Closing Order</span>
              </div>
            </div>
          </div>

          {/* Live AI Activity Feed */}
          <div className="glass rounded-2xl p-6 slide-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-semibold text-zinc-100">Live AI Feed</h3>
              </div>
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse-dot"></div>
            </div>

            <div className="space-y-4">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((feed: any, i: number) => {
                  const iconMap: any = {
                    ai: { icon: <Bot className="w-3.5 h-3.5 text-indigo-400" />, bg: 'bg-indigo-500/10' },
                    money: { icon: <DollarSign className="w-3.5 h-3.5 text-emerald-400" />, bg: 'bg-emerald-500/10' },
                    error: { icon: <Activity className="w-3.5 h-3.5 text-rose-400" />, bg: 'bg-rose-500/10' },
                    warning: { icon: <MessageSquare className="w-3.5 h-3.5 text-amber-400" />, bg: 'bg-amber-500/10' },
                    success: { icon: <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />, bg: 'bg-cyan-500/10' },
                  };
                  const style = iconMap[feed.type] || iconMap.ai;
                  return (
                    <div key={i} className="flex gap-3 animate-in slide-in-from-right-4 duration-300">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${style.bg}`}>
                        {style.icon}
                      </div>
                      <div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{feed.msg}</p>
                        <span className="text-[10px] text-zinc-500">{feed.time}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-700 mb-4 border border-white/5">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed px-4">
                    Belum ada aktivitas pesan atau pesanan saat ini.
                  </p>
                </div>
              )}
            </div>
            <button className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-zinc-300 transition-colors">
              Lihat Semua Aktivitas
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
