import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Package, 
  Truck, 
  Clock, 
  Loader2,
  MapPin,
  CreditCard,
  Store
} from 'lucide-react';

const KelolaPesanan: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    fetchStores();
  }, [user]);

  const fetchStores = async () => {
    if (!user) return;
    try {
      // Robust store detection (check both admin_id and owner_id)
      const q1 = query(collection(db, 'stores'), where('owner_id', '==', user.id));
      const q2 = query(collection(db, 'stores'), where('admin_id', '==', user.id));
      
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const combinedDocs = [...s1.docs, ...s2.docs];
      const uniqueDocs = Array.from(new Map(combinedDocs.map(doc => [doc.id, doc])).values());
      const storeData = uniqueDocs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setStores(storeData);
      if (storeData.length > 0) {
        if (!selectedStoreId) setSelectedStoreId(storeData[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Fetch Stores Error:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedStoreId) return;
    let unsubscribe: () => void;

    const setupRealtime = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'orders'), where('store_id', '==', selectedStoreId));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((o: any) => o.status !== 'pending')
            .sort((a: any, b: any) => {
              const dateA = a.checkout_at?.toDate() || new Date(0);
              const dateB = b.checkout_at?.toDate() || new Date(0);
              return dateB.getTime() - dateA.getTime();
            });
          setOrders(data);
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Setup Real-time Error:', err);
        setIsLoading(false);
      }
    };

    setupRealtime();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [selectedStoreId]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      alert(`Status pesanan berhasil diperbarui menjadi: ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Update Status Error:', err);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Memuat Data Pesanan...</span>
        </div>
      </main>
    );
  }

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar bg-[#09090b] font-sans pb-32">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Manajemen Pesanan</h1>
            <p className="text-zinc-500 mt-1 text-xs md:text-sm">Pantau dan proses semua pesanan masuk dari pelanggan Anda.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            {stores.length > 1 && (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                <Store className="w-4 h-4 text-indigo-400" />
                <select 
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-300 focus:outline-none appearance-none cursor-pointer"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'processing', label: 'Perlu Diproses' },
                { id: 'shipped', label: 'Dikirim' },
                { id: 'delivered', label: 'Selesai' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filterStatus === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="glass rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col md:flex-row">
              {/* Info Utama */}
              <div className="p-6 flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">#{order.id.substring(0, 8)}</div>
                      <div className="text-sm font-bold text-white">{order.product_name} x{order.quantity}</div>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    order.status === 'processing' ? 'bg-amber-500/10 text-amber-500' :
                    order.status === 'shipped' ? 'bg-indigo-500/10 text-indigo-500' :
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {order.status === 'processing' ? 'Menunggu Proses' : order.status === 'shipped' ? 'Sedang Dikirim' : 'Selesai'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-zinc-500 mt-1" />
                      <div>
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Detail Pelanggan</div>
                        <div className="text-xs font-bold text-zinc-100">{order.customer_name}</div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">{order.shipping_address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-4 h-4 text-zinc-500 mt-1" />
                      <div>
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Metode Bayar & Kurir</div>
                        <div className="text-xs font-bold text-indigo-400">{order.payment_method?.toUpperCase()}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 uppercase">{order.courier} Express</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Sidebar */}
              <div className="p-6 bg-white/[0.02] border-l border-white/5 md:w-64 flex flex-col justify-between gap-6">
                <div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1 text-center md:text-left">Total Pendapatan</div>
                  <div className="text-2xl font-bold text-white text-center md:text-left">Rp {(order.total_amount * order.quantity).toLocaleString('id-ID')}</div>
                </div>

                <div className="space-y-2">
                  {order.status === 'processing' && (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'shipped')}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <Truck className="w-3.5 h-3.5" /> Konfirmasi Kirim
                    </button>
                  )}
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-zinc-400 text-[10px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                    Hubungi Pembeli
                  </button>
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center glass rounded-[3rem] border border-white/5">
              <Clock className="w-12 h-12 text-zinc-800 mb-4" />
              <h3 className="text-lg font-bold text-zinc-300">Belum Ada Pesanan Masuk</h3>
              <p className="text-zinc-500 text-sm mt-2 mb-8">Daftar pesanan dari pelanggan akan muncul di sini.</p>
              
              <button 
                onClick={() => navigate('/manajemen-toko')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                Cek Manajemen Toko
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default KelolaPesanan;
