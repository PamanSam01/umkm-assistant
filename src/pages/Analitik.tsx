import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  ArrowUpRight,
  Loader2,
  Calendar,
  Store
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const Analitik: React.FC = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgTicket: 0,
    growth: 12.5
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchInitialData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchAnalyticsData(selectedStoreId);
    }
  }, [selectedStoreId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'stores'),
        where('owner_id', '==', user?.id)
      );
      const querySnapshot = await getDocs(q);
      const storeData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setStores(storeData || []);
      if (storeData && storeData.length > 0) {
        setSelectedStoreId(storeData[0].id);
      } else {
        setStats({ totalRevenue: 0, totalOrders: 0, avgTicket: 0, growth: 0 });
        setChartData([0, 0, 0, 0, 0, 0, 0]);
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const fetchAnalyticsData = async (storeId: string) => {
    try {
      const q = query(
        collection(db, 'orders'),
        where('store_id', '==', storeId),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
      }));

      if (orders) {
        const total = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
        setStats({
          totalRevenue: total,
          totalOrders: orders.length,
          avgTicket: orders.length > 0 ? total / orders.length : 0,
          growth: orders.length > 5 ? 15 : 0
        });
        setRecentOrders(orders.slice(0, 5));

        // Calculate chart data (last 7 days)
        const dailyData = new Array(7).fill(0);
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        orders.forEach((order: any) => {
          const orderDate = order.created_at;
          const diffTime = Math.abs(today.getTime() - orderDate.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 7) {
            dailyData[6 - diffDays] += order.total_amount || 0;
          }
        });
        setChartData(dailyData);
      }
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#09090b] font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              Analitik Penjualan
              <BarChart3 className="w-7 h-7 text-indigo-500" />
            </h1>
            <p className="text-zinc-500 mt-1">Pantau performa bisnis dan pertumbuhan omzet Anda.</p>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative group">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <select 
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-white/5 border border-white/10 text-zinc-200 text-sm rounded-2xl pl-10 pr-10 py-3 appearance-none focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer min-w-[200px]"
              >
                {stores.map(s => <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>)}
              </select>
            </div>
            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 px-4 py-3 rounded-2xl border border-white/5 transition-all">
              <Calendar className="w-4 h-4" />
              7 Hari Terakhir
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Omzet', value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', trend: '+12.5%' },
            { label: 'Jumlah Order', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'text-indigo-400', bg: 'bg-indigo-400/10', trend: '+5.2%' },
            { label: 'Rata-rata Order', value: `Rp ${Math.round(stats.avgTicket).toLocaleString('id-ID')}`, icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-400/10', trend: '+2.1%' },
            { label: 'Pelanggan Baru', value: stats.totalOrders > 0 ? (stats.totalOrders - 1).toString() : '0', icon: Users, color: 'text-violet-400', bg: 'bg-violet-400/10', trend: '0%' }
          ].map((s, i) => (
            <div key={i} className="glass p-6 rounded-[2rem] border border-white/5 shadow-xl animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {s.trend}
                </span>
              </div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{s.label}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{s.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 glass rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-zinc-100">Tren Penjualan (7 Hari)</h3>
              <div className="flex gap-2">
                <button className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-lg tracking-widest uppercase">Omzet</button>
                <button className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 px-3 py-1 rounded-lg tracking-widest uppercase">Volume</button>
              </div>
            </div>
            
            {/* Dynamic Chart */}
            <div className="h-64 flex items-end justify-between gap-3 px-2">
              {chartData.length > 0 && chartData.map((val, i) => {
                const max = Math.max(...chartData, 1000);
                const height = (val / max) * 100;
                const days = ['H-6', 'H-5', 'H-4', 'H-3', 'H-2', 'Kemarin', 'Hari Ini'];
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="w-full bg-white/5 rounded-t-xl relative overflow-hidden transition-all duration-1000 ease-out" style={{ height: `${Math.max(height, 5)}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/40 to-indigo-400/10 group-hover:from-indigo-500/60 transition-all"></div>
                      {val > 0 && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-[8px] font-bold text-white px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-20">
                          Rp {val.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${i === 6 ? 'text-indigo-400' : 'text-zinc-600'}`}>
                      {days[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="glass rounded-[2.5rem] p-8 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-100">Order Terakhir</h3>
              <button className="text-zinc-500 hover:text-white transition-colors"><ArrowUpRight className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-4">
              {recentOrders.length === 0 ? (
                <div className="py-10 text-center text-zinc-600 text-sm">Belum ada transaksi.</div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-200 truncate">{order.customer_name || 'Pelanggan UMKM'}</p>
                      <p className="text-[10px] text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right text-xs font-bold text-zinc-100">
                      Rp {order.total_amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button className="w-full mt-6 py-3 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-xs font-bold rounded-2xl transition-all">
              Lihat Semua Laporan
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Analitik;
