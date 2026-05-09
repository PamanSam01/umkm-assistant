import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  Store, 
  Search, 
  Star,
  Loader2,
  Tag,
  ShoppingBag,
  MessageCircle,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';

const JelajahToko: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const storeId = searchParams.get('storeId');
    if (storeId) {
      setSelectedStoreId(storeId);
    }
  }, [searchParams]);

  const categories = [
    'Semua', 
    'Makanan & Minuman', 
    'Pakaian & Fashion', 
    'Sepatu & Alas Kaki',
    'Aksesoris & Kerajinan', 
    'Kecantikan & Kesehatan', 
    'Elektronik & Gadget',
    'Lainnya'
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stores
      const storesSnap = await getDocs(query(collection(db, 'stores'), orderBy('created_at', 'desc'), limit(10)));
      const storesData = storesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStores(storesData);

      // 2. Fetch Products
      const q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const data = await Promise.all(querySnapshot.docs.map(async (d) => {
        const prodData = d.data();
        const storeSnap = await getDoc(doc(db, 'stores', prodData.store_id));
        return {
          id: d.id,
          ...prodData,
          stores: storeSnap.exists() ? { id: storeSnap.id, ...storeSnap.data() } : null
        };
      }));
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (storeId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const q = query(
        collection(db, 'conversations'),
        where('store_id', '==', storeId),
        where('customer_id', '==', user.uid)
      );
      
      const snap = await getDocs(q);
      
      let existingId = !snap.empty ? snap.docs[0].id : null;

      if (existingId) {
        navigate(`/percakapan?id=${existingId}`);
      } else {
        const store = stores.find(s => s.id === storeId);
        const storeName = store ? store.name : 'Toko';

        const docRef = await addDoc(collection(db, 'conversations'), {
          customer_id: user.uid,
          customer_name: user.displayName || 'Pelanggan',
          store_id: storeId,
          store_name: storeName,
          last_message: 'Halo! Saya ingin bertanya tentang toko Anda.',
          updated_at: serverTimestamp()
        });

        await addDoc(collection(db, 'messages'), {
          conversation_id: docRef.id,
          sender: 'user',
          text: 'Halo! Saya ingin bertanya tentang toko Anda.',
          created_at: serverTimestamp()
        });

        navigate(`/percakapan?id=${docRef.id}`);
      }
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  const handleCheckout = async (product: any) => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    const confirmOrder = confirm(`Anda ingin memesan "${product.name}" dari "${product.stores?.name}" seharga Rp ${product.price.toLocaleString('id-ID')}?`);
    if (!confirmOrder) return;

    try {
      await addDoc(collection(db, 'orders'), {
        customer_id: user.uid,
        customer_name: user.displayName || 'Pembeli UMKM',
        store_id: product.store_id,
        product_id: product.id,
        product_name: product.name,
        total_amount: product.price,
        quantity: 1,
        status: 'pending',
        created_at: serverTimestamp()
      });
      
      alert('Pesanan berhasil dibuat! Mengarahkan ke halaman Pesanan Saya...');
      navigate('/pesanan');
    } catch (err) {
      console.error('Checkout Error:', err);
      alert('Gagal membuat pesanan. Silakan coba lagi.');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.stores?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesStore = !selectedStoreId || p.store_id === selectedStoreId;
    return matchesSearch && matchesCategory && matchesStore;
  });

  const selectedStoreName = stores.find(s => s.id === selectedStoreId)?.name;

  if (isLoading) {
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
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] ml-1">Menyiapkan Etalase AI...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto custom-scrollbar font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner Promotion */}
        <div className="relative h-32 md:h-48 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-700 p-6 md:p-10 flex items-center shadow-2xl shadow-indigo-500/20">
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-white"></div>
          <div className="relative z-10 space-y-2 md:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider">
              <ShoppingBag className="w-3 h-3" /> Dukung UMKM Lokal
            </div>
            <h2 className="text-xl md:text-3xl font-display font-bold text-white leading-tight">
              Dukung Produk Lokal, <br className="hidden md:block" />Kualitas Internasional.
            </h2>
            <p className="text-white/70 text-[10px] md:text-sm max-w-[200px] md:max-w-sm line-clamp-2 md:line-clamp-none">Tanya ongkir & stok langsung via chat untuk pengalaman belanja yang lebih personal.</p>
          </div>
          <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:block opacity-20">
             <ShoppingBag className="w-40 h-40 text-white" />
          </div>
        </div>

        {/* Featured Stores Section */}
        <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-400" />
                Toko UMKM Terbaru
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-semibold">Mendukung Ekonomi Lokal</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedStoreId && (
                <button 
                  onClick={() => setSelectedStoreId(null)}
                  className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all uppercase tracking-wider"
                >
                  Reset Filter: {selectedStoreName}
                </button>
              )}
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Klik Toko untuk Filter Produk</span>
            </div>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-2">
            {stores.length === 0 ? (
              <div className="w-full py-12 text-center text-zinc-600 text-xs font-medium border-dashed border border-white/10 rounded-3xl">
                Belum ada toko yang bergabung hari ini.
              </div>
            ) : (
              stores.map(store => (
                <div 
                  key={store.id} 
                  onClick={() => navigate(`/toko/${store.id}`)}
                  className={`min-w-[200px] max-w-[200px] glass p-4 rounded-[2rem] border transition-all cursor-pointer group flex flex-col ${selectedStoreId === store.id ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5 hover:border-indigo-500/30'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all mb-4 overflow-hidden border border-white/5">
                    {store.image_url ? (
                      <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-zinc-100 truncate mb-1">{store.name}</h4>
                    <div className="flex items-center gap-1 text-zinc-400 mb-3">
                      <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                      <span className="text-[9px] truncate font-medium">{store.location || 'Lokasi...'}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-tight min-h-[24px]">
                      {store.description || 'Dukung UMKM lokal di sini.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Online</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStartChat(store.id); }}
                        className="p-1.5 bg-white/5 hover:bg-indigo-500 text-zinc-400 hover:text-white rounded-lg transition-all"
                        title="Chat dengan Toko"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari produk impianmu atau nama toko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scroll-area no-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="glass rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all group overflow-hidden flex flex-col cursor-pointer"
              onClick={() => handleStartChat(product.stores?.id)}
            >
              {/* Product Image Placeholder */}
              <div className="h-48 bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <Tag className="w-12 h-12 text-zinc-800" />
                )}
                <div className="absolute top-3 left-3 px-2 py-1 bg-indigo-500/90 text-white text-[9px] font-bold rounded-lg shadow-lg">BARU</div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-zinc-100 line-clamp-2 mb-1 group-hover:text-indigo-400 transition-colors leading-snug">
                  {product.name}
                </h3>
                <div className="text-indigo-400 font-bold text-lg mb-2">
                  Rp {product.price.toLocaleString('id-ID')}
                </div>
                
                <div className="mt-auto space-y-3">
                   <div 
                    className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-lg transition-colors cursor-pointer group/store"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStoreId(product.stores?.id);
                    }}
                   >
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover/store:bg-indigo-500 group-hover/store:text-white transition-all">
                         <Store className="w-3 h-3" />
                      </div>
                      <div className="flex flex-col min-w-0">
                         <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-zinc-100 truncate group-hover/store:text-indigo-400">{product.stores?.name}</span>
                            <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400 flex-shrink-0" />
                         </div>
                         <div className="flex items-center gap-1 text-zinc-400">
                            <MapPin className="w-2.5 h-2.5 text-indigo-400" />
                            <span className="text-[9px] font-medium truncate">{product.stores?.location || 'Lokasi tidak tersedia'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1">
                         <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                         <span className="text-[10px] font-bold text-zinc-400">4.9 | Terjual 10+</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStartChat(product.store_id); }}
                          className="p-2 bg-white/5 text-zinc-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                          title="Tanya Stok"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCheckout(product); }}
                          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                          title="Beli Sekarang"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center glass rounded-[3rem] border-dashed border-2 border-white/5">
               <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 text-zinc-700">
                  <Search className="w-10 h-10" />
               </div>
               <h3 className="text-xl font-bold text-zinc-300">Produk tidak ditemukan</h3>
               <p className="text-zinc-500 text-sm mt-2">Coba kata kunci lain atau jelajahi kategori lainnya.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default JelajahToko;
