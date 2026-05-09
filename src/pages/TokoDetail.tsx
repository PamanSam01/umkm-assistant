import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  Store, 
  MapPin, 
  MessageCircle, 
  ArrowLeft, 
  ShoppingBag,
  Star,
  CheckCircle2,
  Loader2,
  Tag
} from 'lucide-react';

const TokoDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStoreData();
    }
  }, [id]);

  const fetchStoreData = async () => {
    setIsLoading(true);
    try {
      // Fetch Store
      const storeSnap = await getDoc(doc(db, 'stores', id!));
      if (storeSnap.exists()) {
        setStore({ id: storeSnap.id, ...storeSnap.data() });
        
        // Fetch Products
        const q = query(collection(db, 'products'), where('store_id', '==', id));
        const prodSnap = await getDocs(q);
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user || !store) return;
    
    try {
      // Check if conversation exists
      const q = query(
        collection(db, 'conversations'),
        where('customer_id', '==', user.id),
        where('store_id', '==', store.id)
      );
      const snap = await getDocs(q);
      
      let convId;
      if (snap.empty) {
        const newConv = await addDoc(collection(db, 'conversations'), {
          customer_id: user.id,
          customer_name: user.name || 'Pelanggan',
          store_id: store.id,
          store_name: store.name,
          store_image: store.image_url || '',
          last_message: 'Halo! Saya ingin bertanya tentang toko Anda.',
          updated_at: serverTimestamp()
        });
        
        // Add first automated message
        await addDoc(collection(db, 'messages'), {
          conversation_id: newConv.id,
          sender: 'user',
          text: 'Halo! Saya ingin bertanya tentang toko Anda.',
          created_at: serverTimestamp()
        });
        
        convId = newConv.id;
      } else {
        convId = snap.docs[0].id;
      }
      
      navigate(`/percakapan?id=${convId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async (product: any) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const confirmOrder = confirm(`Anda ingin memesan "${product.name}" seharga Rp ${product.price.toLocaleString('id-ID')}?`);
    if (!confirmOrder) return;

    try {
      await addDoc(collection(db, 'orders'), {
        customer_id: user.id,
        customer_name: user.name,
        store_id: id,
        product_id: product.id,
        product_name: product.name,
        total_amount: product.price,
        quantity: 1,
        status: 'pending', // Change to pending for cart-like behavior
        created_at: serverTimestamp()
      });
      
      alert('Pesanan berhasil dibuat! Mengarahkan ke halaman Pesanan Saya...');
      navigate('/pesanan');
    } catch (err) {
      console.error('Checkout Error:', err);
      alert('Gagal membuat pesanan. Silakan coba lagi.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Store className="w-16 h-16 text-zinc-800 mb-4" />
        <h2 className="text-xl font-bold text-zinc-100">Toko Tidak Ditemukan</h2>
        <button onClick={() => navigate('/jelajah')} className="mt-4 text-indigo-400 font-bold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Jelajah
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b]">
      {/* Hero Header */}
      <div className="relative h-48 md:h-64 bg-zinc-900 border-b border-white/5 overflow-hidden">
        {store.banner_url ? (
          <img src={store.banner_url} alt="Store Banner" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80')] bg-cover bg-center opacity-20 grayscale"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:px-12">
          <button 
            onClick={() => navigate('/jelajah')}
            className="mb-4 md:mb-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-[10px] md:text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-2xl border-4 border-white/5 overflow-hidden">
                {store.image_url ? (
                  <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 md:w-16 h-10 md:h-16" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-white">{store.name}</h1>
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-zinc-400">
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-medium">{store.location || 'Indonesia'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-tighter">Buka Sekarang</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-xs font-bold">4.9 (120+ Ulasan)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleStartChat}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Chat Penjual
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 lg:p-12 space-y-12">
        {/* Description */}
        <section className="max-w-3xl space-y-4">
          <h2 className="text-xl font-bold text-zinc-100">Tentang Toko</h2>
          <p className="text-zinc-400 leading-relaxed">
            {store.description || 'Selamat datang di toko kami! Kami menyediakan berbagai produk UMKM berkualitas tinggi dengan harga yang bersaing. Dukung ekonomi lokal dengan berbelanja di sini.'}
          </p>
        </section>

        {/* Product Grid */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-indigo-400" />
                Koleksi Produk
              </h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Menampilkan {products.length} Produk Pilihan</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="py-24 text-center glass rounded-[3rem] border-dashed border-white/10">
               <Tag className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
               <p className="text-zinc-500 font-medium">Toko ini belum mengunggah produk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="group glass p-4 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 flex flex-col h-full shadow-lg hover:shadow-indigo-500/10"
                >
                  <div className="relative aspect-square rounded-[1.8rem] overflow-hidden mb-5 bg-white/5">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={product.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-800">
                        <Tag className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[9px] font-bold text-white uppercase tracking-wider border border-white/10">
                        {product.category || 'Produk'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col space-y-2">
                    <h4 className="text-sm font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-2">{product.name}</h4>
                    <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">{product.description || 'Deskripsi produk berkualitas tinggi.'}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-100">Rp {product.price?.toLocaleString('id-ID')}</span>
                    <button 
                      onClick={() => handleCheckout(product)}
                      className="w-8 h-8 bg-white/5 hover:bg-indigo-600 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-sm"
                      title="Checkout Langsung"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TokoDetail;
