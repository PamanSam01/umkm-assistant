import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight,
  Loader2,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PesananSaya: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cart' | 'tracking'>('cart');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Checkout States
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('jne');
  const [paymentMethod, setPaymentMethod] = useState('transfer');

  // Real-time Orders Listener
  useEffect(() => {
    if (!user?.id) return;
    setIsLoading(true);

    const q = query(collection(db, 'orders'), where('customer_id', '==', user.id));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const data = await Promise.all(snapshot.docs.map(async (d) => {
          const orderData = d.data();
          const storeSnap = await getDoc(doc(db, 'stores', orderData.store_id));
          const productSnap = await getDoc(doc(db, 'products', orderData.product_id));
          const productData = productSnap.exists() ? productSnap.data() : null;

          let createdAtStr = new Date().toISOString();
          try {
            if (orderData.created_at && typeof orderData.created_at.toDate === 'function') {
              createdAtStr = orderData.created_at.toDate().toISOString();
            }
          } catch (e) {
            // Silently ignore date conversion errors
          }

          return {
            id: d.id,
            ...orderData,
            quantity: orderData.quantity || 1,
            stores: storeSnap.exists() ? storeSnap.data() : null,
            product_image: orderData.product_image || productData?.image_url || null,
            product_name: orderData.product_name || productData?.name || 'Produk',
            created_at: createdAtStr
          };
        }));
        setOrders(data);
        setIsLoading(false);
      } catch (err) {
        console.error("Order process error:", err);
        setIsLoading(false);
      }
    }, (err) => {
      console.error("Order snapshot error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Auto-fill address from profile
  useEffect(() => {
    if (isCheckoutModalOpen && user?.id) {
      const fetchProfileAddress = async () => {
        try {
          const profSnap = await getDoc(doc(db, 'profiles', user.id));
          if (profSnap.exists() && profSnap.data().address) {
            setShippingAddress(profSnap.data().address);
          }
        } catch (err) {
          console.error("Error auto-filling address:", err);
        }
      };
      fetchProfileAddress();
    }
  }, [isCheckoutModalOpen, user?.id]);

  const handleUpdateQuantity = async (orderId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { quantity: newQty });
    } catch (err) {
      console.error('Update Qty Error:', err);
    }
  };

  const handleDeleteItem = async (orderId: string) => {
    if (!confirm('Hapus item ini dari keranjang?')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      const newSelected = new Set(selectedItems);
      newSelected.delete(orderId);
      setSelectedItems(newSelected);
    } catch (err) {
      console.error('Delete Item Error:', err);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm('Konfirmasi bahwa Anda telah menerima pesanan ini?')) return;
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'delivered' });
      alert('Terima kasih! Pesanan telah selesai.');
    } catch (err) {
      console.error('Complete Order Error:', err);
    }
  };

  const toggleSelect = (orderId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    const cartItems = orders.filter(o => o.status === 'pending');
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(o => o.id)));
    }
  };

  const calculateTotal = () => {
    return orders
      .filter(o => selectedItems.has(o.id))
      .reduce((sum, o) => sum + (o.total_amount * (o.quantity || 1)), 0);
  };

  const couriers = [
    { id: 'pickup', name: 'Ambil di Tempat', price: 0, etd: 'Langsung' },
    { id: 'toko', name: 'Kurir Toko (Lokal)', price: 10000, etd: '1-2 Hari' },
    { id: 'jne', name: 'JNE Express', price: 15000, etd: '2-3 Hari' },
    { id: 'jnt', name: 'J&T Reguler', price: 12000, etd: '2-4 Hari' },
    { id: 'gosend', name: 'GoSend/Grab', price: 25000, etd: 'Hari Ini' }
  ];

  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      alert('Mohon isi alamat pengiriman terlebih dahulu!');
      return;
    }

    const itemsToCheckout = orders.filter(o => selectedItems.has(o.id));
    setIsLoading(true);
    try {
      for (const item of itemsToCheckout) {
        const orderRef = doc(db, 'orders', item.id);
        await updateDoc(orderRef, {
          status: 'processing',
          shipping_address: shippingAddress,
          courier: selectedCourier,
          payment_method: paymentMethod,
          checkout_at: serverTimestamp()
        });
      }
      
      setIsCheckoutModalOpen(false);
      setIsPaymentModalOpen(true);
      setSelectedItems(new Set());
      setActiveTab('tracking');
    } catch (err) {
      console.error('Checkout Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Sinkronisasi Data...</span>
        </div>
      </main>
    );
  }

  const subtotal = calculateTotal();
  const shippingCost = selectedItems.size > 0 ? (couriers.find(c => c.id === selectedCourier)?.price || 0) : 0;
  const finalTotal = subtotal + shippingCost;

  const cartOrders = orders.filter(o => o.status === 'pending');
  const trackingOrders = orders.filter(o => o.status !== 'pending').sort((a, b) => {
    const timeA = a.checkout_at?.seconds ? (a.checkout_at.seconds * 1000) : new Date(a.created_at).getTime();
    const timeB = b.checkout_at?.seconds ? (b.checkout_at.seconds * 1000) : new Date(b.created_at).getTime();
    return timeB - timeA;
  });

  return (
    <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar bg-[#09090b] font-sans pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Status Pesanan</h1>
            <p className="text-zinc-500 mt-1 text-xs md:text-sm">Pantau belanjaan UMKM Anda di satu tempat.</p>
          </div>
          
          <div className="flex w-full md:w-auto bg-white/5 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('cart')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'cart' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              KERANJANG ({cartOrders.length})
            </button>
            <button 
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'tracking' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              LACAK PAKET ({trackingOrders.length})
            </button>
          </div>
        </header>

        {activeTab === 'cart' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Daftar Belanja</div>
              {cartOrders.length > 0 && (
                <button onClick={toggleSelectAll} className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest hover:text-indigo-300">
                  {selectedItems.size === cartOrders.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </button>
              )}
            </div>

            {cartOrders.map((order) => {
              const isSelected = selectedItems.has(order.id);
              return (
                <div key={order.id} className={`glass p-4 md:p-6 rounded-[2.5rem] border transition-all duration-300 ${isSelected ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/5'}`}>
                  <div className="flex items-center gap-4 md:gap-6">
                    <button 
                      onClick={() => toggleSelect(order.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-700 hover:border-zinc-500'}`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>

                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/5 border border-white/5 overflow-hidden flex-shrink-0">
                      {order.product_image ? (
                        <img src={order.product_image} alt={order.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-800"><Package className="w-8 h-8" /></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{order.stores?.name || 'Toko UMKM'}</div>
                      <h3 className="text-sm md:text-base font-bold text-white truncate">{order.product_name}</h3>
                      <div className="text-indigo-400 font-bold mt-1 text-sm">Rp {order.total_amount.toLocaleString('id-ID')}</div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3 bg-black/20 rounded-lg p-1 border border-white/5">
                          <button onClick={() => handleUpdateQuantity(order.id, order.quantity - 1)} className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-white"><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-bold text-white w-4 text-center">{order.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(order.id, order.quantity + 1)} className="w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-white"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => handleDeleteItem(order.id)} className="text-zinc-600 hover:text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {cartOrders.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center glass rounded-[3rem] border border-white/5">
                <ShoppingBag className="w-12 h-12 text-zinc-800 mb-4" />
                <h3 className="text-lg font-bold text-zinc-300">Keranjang Kosong</h3>
                <button onClick={() => navigate('/jelajah')} className="mt-6 px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl">Mulai Belanja</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {trackingOrders.map((order) => (
              <div key={order.id} className="glass rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-indigo-500/20 transition-all">
                <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ID Pesanan: {order.id.substring(0, 8)}</div>
                      <div className="text-sm font-bold text-white mt-1">{order.product_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        order.status === 'processing' ? 'bg-amber-500/10 text-amber-500' :
                        order.status === 'shipped' ? 'bg-indigo-500/10 text-indigo-500' :
                        'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {order.status === 'processing' ? 'Diproses' : order.status === 'shipped' ? 'Dikirim' : 'Selesai'}
                      </div>
                      {!order.stores && (
                        <button 
                          onClick={() => handleDeleteItem(order.id)}
                          className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[9px] text-zinc-600 font-bold mt-1.5 uppercase">{new Date(order.created_at).toLocaleDateString('id-ID')}</div>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  <div className="relative flex justify-between">
                    <div className="absolute top-5 left-8 right-8 h-[2px] bg-white/5">
                      <div className={`h-full bg-indigo-500 transition-all duration-1000 ${
                        order.status === 'processing' ? 'w-[33%]' :
                        order.status === 'shipped' ? 'w-[66%]' : 
                        order.status === 'delivered' ? 'w-[100%]' : 'w-[0%]'
                      }`} />
                    </div>
                    
                    {[
                      { icon: Clock, label: 'Dibayar', active: true },
                      { icon: Package, label: 'Diproses', active: order.status !== 'pending' },
                      { icon: Truck, label: 'Dikirim', active: order.status === 'shipped' || order.status === 'delivered' },
                      { icon: CheckCircle2, label: 'Sampai', active: order.status === 'delivered' }
                    ].map((step, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step.active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110' : 'bg-[#151520] text-zinc-700 border border-white/5'}`}>
                          <step.icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-tighter ${step.active ? 'text-zinc-100' : 'text-zinc-700'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-start gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <MapPin className="w-4 h-4 text-zinc-500 mt-1" />
                      <div>
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Alamat Pengiriman</div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">{order.shipping_address || 'Alamat belum diatur'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <Truck className="w-4 h-4 text-zinc-500 mt-1" />
                      <div>
                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Informasi Kurir</div>
                        <div className="text-xs font-bold text-white uppercase">{order.courier || 'JNE'} Express</div>
                        <div className="text-[10px] text-indigo-400 font-bold mt-0.5">NOMOR RESI: {order.id.toUpperCase().substring(0, 12)}</div>
                      </div>
                    </div>
                  </div>

                  {order.status === 'shipped' && (
                    <button 
                      onClick={() => handleCompleteOrder(order.id)}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Konfirmasi Barang Diterima
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {trackingOrders.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center glass rounded-[3rem] border border-white/5">
                <Truck className="w-12 h-12 text-zinc-800 mb-4" />
                <h3 className="text-lg font-bold text-zinc-300">Belum Ada Pengiriman</h3>
                <p className="text-xs text-zinc-500 mt-2">Selesaikan checkout di keranjang untuk melihat status pengiriman.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'cart' && selectedItems.size > 0 && (
        <div className="fixed bottom-[85px] md:bottom-8 right-4 md:right-8 z-50 animate-in slide-in-from-right-8 duration-500">
          <div className="glass p-3 md:px-5 md:py-3 border border-white/10 shadow-2xl flex items-center gap-6">
            <div className="flex flex-col">
              <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Total ({selectedItems.size})</div>
              <div className="text-lg md:text-xl font-display font-bold text-white leading-none">Rp {subtotal.toLocaleString('id-ID')}</div>
            </div>

            <button 
              onClick={() => setIsCheckoutModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2 group whitespace-nowrap text-xs md:text-sm"
            >
              Checkout
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-[#0b0b14] w-full max-w-xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90dvh] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Lengkapi Pengiriman</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Satu langkah lagi menuju pesanan Anda</p>
                </div>
              </div>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto scroll-area space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Alamat Pengiriman</label>
                <textarea 
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder={selectedCourier === 'pickup' ? "Contoh: Diambil sore hari jam 4..." : "Masukkan alamat lengkap pengiriman Anda..."}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Pilih Kurir</label>
                <div className="grid grid-cols-1 gap-3">
                  {couriers.map((c) => (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedCourier(c.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedCourier === c.id ? 'bg-indigo-600/10 border-indigo-500/50 shadow-inner' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedCourier === c.id ? 'border-indigo-400' : 'border-zinc-700'}`}>
                          {selectedCourier === c.id && <div className="w-2 h-2 bg-indigo-400 rounded-full" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-100">{c.name}</div>
                          <div className="text-[10px] text-zinc-500 font-medium">Estimasi: {c.etd}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-indigo-400">Rp {c.price.toLocaleString('id-ID')}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'transfer', name: 'Transfer Bank' },
                    { id: 'ewallet', name: 'E-Wallet' },
                    { id: 'cod', name: 'Bayar di Tempat' },
                    { id: 'qris', name: 'QRIS' }
                  ].map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => setPaymentMethod(p.id)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-[10px] font-bold uppercase tracking-tight ${paymentMethod === p.id ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-indigo-600/5 rounded-2xl border border-indigo-500/20 space-y-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Ongkos Kirim</span>
                  <span>Rp {shippingCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="h-px bg-white/5 my-2" />
                <div className="flex justify-between text-base font-bold text-white">
                  <span>Total Bayar</span>
                  <span className="text-indigo-400">Rp {finalTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/5">
              <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                Konfirmasi Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-[#0b0b14] w-full max-w-md rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white">Pesanan Terkonfirmasi!</h2>
                <p className="text-zinc-500 text-sm mt-1">Selesaikan pembayaran untuk memproses pesanan.</p>
              </div>

              <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 space-y-4">
                {paymentMethod === 'transfer' && (
                  <div className="space-y-3">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Transfer Bank (BCA)</div>
                    <div className="text-2xl font-mono font-bold text-indigo-400 tracking-wider">1234 5678 90</div>
                    <div className="text-xs text-zinc-400">a/n UMKM Assistant Digital</div>
                  </div>
                )}

                {paymentMethod === 'ewallet' && (
                  <div className="space-y-3">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">E-Wallet (Dana/OVO/GoPay)</div>
                    <div className="text-2xl font-mono font-bold text-indigo-400 tracking-wider">0812 3456 7890</div>
                    <div className="text-xs text-zinc-400">Scan QR atau Transfer ke Nomor HP</div>
                  </div>
                )}

                {paymentMethod === 'qris' && (
                  <div className="space-y-4">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Scan QRIS</div>
                    <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto shadow-xl">
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UMKM_ASSISTANT_PAYMENT" 
                        alt="QRIS" 
                        className="w-full h-full grayscale brightness-90"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 italic">Berlaku untuk semua aplikasi pembayaran digital</p>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="space-y-3 py-4">
                    <Truck className="w-8 h-8 text-indigo-400 mx-auto" />
                    <div className="text-sm font-bold text-zinc-200">Bayar Saat Barang Sampai</div>
                    <p className="text-[10px] text-zinc-500">Mohon siapkan uang tunai sesuai total tagihan saat kurir tiba.</p>
                  </div>
                )}
                
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500 font-medium">Total Tagihan</span>
                  <span className="text-lg font-bold text-white">Rp {finalTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                >
                  {paymentMethod === 'cod' ? 'Selesai' : 'Saya Sudah Bayar'}
                </button>
                <p className="text-[10px] text-zinc-600">
                  Pesanan Anda akan segera diverifikasi oleh Admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default PesananSaya;
