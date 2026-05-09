import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Tag, 
  Layers,
  Store,
  AlertCircle,
  Wand2,
  Camera,
  Search
} from 'lucide-react';
import { generateProductDescription } from '../services/api';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const KatalogProduk: React.FC = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    category: 'Lainnya',
    image_url: ''
  });
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Gagal kompresi'));
          }, 'image/jpeg', 0.8);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar!');
      return;
    }
    setIsUploading(true);
    try {
      const compressedBlob = await compressImage(file);
      const reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result as string });
        setIsUploading(false);
      };
    } catch (err) {
      alert('Gagal memproses gambar');
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      fetchProducts(selectedStoreId);
    } else {
      setProducts([]);
    }
  }, [selectedStoreId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch user's stores from Firestore
      const q = query(
        collection(db, 'stores'),
        where('admin_id', '==', user?.id)
      );
      const querySnapshot = await getDocs(q);
      const storeData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setStores(storeData || []);
      
      if (storeData && storeData.length > 0) {
        setSelectedStoreId(storeData[0].id);
      }
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async (storeId: string) => {
    try {
      const q = query(
        collection(db, 'products'),
        where('store_id', '==', storeId)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;

    const payload = {
      store_id: selectedStoreId,
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      description: formData.description,
      category: formData.category,
      image_url: formData.image_url || '',
      updated_at: serverTimestamp()
    };

    try {
      if (isEditing && currentProduct) {
        const docRef = doc(db, 'products', currentProduct.id);
        await updateDoc(docRef, payload);
        setProducts(products.map(p => p.id === currentProduct.id ? { ...p, ...payload } : p));
      } else {
        const docRef = await addDoc(collection(db, 'products'), {
          ...payload,
          created_at: serverTimestamp()
        });
        setProducts([{ id: docRef.id, ...payload }, ...products]);
      }
      
      closeModal();
    } catch (err) {
      alert('Gagal menyimpan produk: ' + (err as any).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini dari katalog?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert('Gagal menghapus produk');
    }
  };

  const handleAiDescription = async () => {
    if (!formData.name) {
      alert('Tulis nama produk dulu ya kak!');
      return;
    }
    setIsAiGenerating(true);
    try {
      const desc = await generateProductDescription(formData.name);
      setFormData({ ...formData, description: desc });
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const openEditModal = (product: any) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || '',
      category: product.category || 'Lainnya',
      image_url: product.image_url || ''
    });
    setIsEditing(true);
  };

  const closeModal = () => {
    setIsAdding(false);
    setIsEditing(false);
    setCurrentProduct(null);
    setFormData({ name: '', price: '', stock: '', description: '', category: 'Lainnya', image_url: '' });
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Memuat Katalog...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto custom-scrollbar font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Katalog Produk</h1>
            <p className="text-zinc-400 mt-1">Kelola {products.length} barang dagangan di toko Anda.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative group flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text"
                placeholder="Cari nama produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-zinc-200 text-sm rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            {/* Filter Kategori */}
            <div className="relative group">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" />
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white/5 border border-white/10 text-zinc-200 text-sm rounded-2xl pl-10 pr-10 py-3 appearance-none focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer min-w-[150px]"
              >
                <option value="Semua" className="bg-zinc-900">Semua Kategori</option>
                <option value="Makanan & Minuman" className="bg-zinc-900">Makanan & Minuman</option>
                <option value="Pakaian & Fashion" className="bg-zinc-900">Pakaian & Fashion</option>
                <option value="Sepatu & Alas Kaki" className="bg-zinc-900">Sepatu & Alas Kaki</option>
                <option value="Aksesoris & Kerajinan" className="bg-zinc-900">Aksesoris & Kerajinan</option>
                <option value="Kecantikan & Kesehatan" className="bg-zinc-900">Kecantikan & Kesehatan</option>
                <option value="Elektronik & Gadget" className="bg-zinc-900">Elektronik & Gadget</option>
                <option value="Lainnya" className="bg-zinc-900">Lainnya</option>
              </select>
            </div>
            <div className="relative group flex-1">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-indigo-400 transition-colors" />
              <select 
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-zinc-200 text-sm rounded-2xl pl-10 pr-10 py-3 appearance-none focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
              >
                {stores.map(s => <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>)}
                {stores.length === 0 && <option value="">Belum Ada Toko</option>}
              </select>
            </div>
            
            <button 
              disabled={stores.length === 0}
              onClick={() => setIsAdding(true)}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>
          </div>
        </header>

        {stores.length === 0 ? (
          <div className="glass rounded-[2rem] p-12 text-center border border-dashed border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-600">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-200">Anda belum memiliki toko</h3>
            <p className="text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
              Silakan buat toko terlebih dahulu di menu <strong>Manajemen Toko</strong> sebelum bisa mengelola katalog produk.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                const filteredProducts = products.filter(p => {
                  const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchCategory = filterCategory === 'Semua' || p.category === filterCategory;
                  return matchSearch && matchCategory;
                });

                if (filteredProducts.length === 0) {
                  return (
                    <div className="col-span-full py-20 text-center">
                      <div className="w-20 h-20 bg-white/5 rounded-3xl flex-col flex items-center justify-center mx-auto mb-6 text-zinc-700">
                        {searchTerm || filterCategory !== 'Semua' ? <Search className="w-10 h-10 mb-2 opacity-20" /> : <Layers className="w-10 h-10" />}
                      </div>
                      <h3 className="text-lg font-bold text-zinc-300">
                        {searchTerm || filterCategory !== 'Semua' ? 'Produk tidak ditemukan' : 'Katalog masih kosong'}
                      </h3>
                      <p className="text-zinc-500 text-sm mt-2">
                        {searchTerm || filterCategory !== 'Semua' 
                          ? 'Coba gunakan kata kunci lain atau ubah filter kategori.' 
                          : 'Mulai tambahkan produk pertama Anda di toko ini.'}
                      </p>
                    </div>
                  );
                }

                return filteredProducts.map((product) => (
                  <div key={product.id} className="glass rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all group overflow-hidden flex flex-col">
                    <div className="h-40 bg-zinc-900 flex items-center justify-center relative overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-12 h-12 text-zinc-800" />
                      )}
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(product)} className="p-2 bg-black/50 backdrop-blur-md text-zinc-300 hover:text-white rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 bg-black/50 backdrop-blur-md text-zinc-300 hover:text-rose-400 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-zinc-100 mb-1 group-hover:text-indigo-400 transition-colors">{product.name}</h3>
                      <p className="text-zinc-500 text-xs line-clamp-2 mb-4 leading-relaxed">{product.description || 'Tidak ada deskripsi...'}</p>
                      
                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Harga</span>
                          <span className="text-indigo-400 font-bold">Rp {product.price.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Stok</span>
                          <span className={`text-sm font-bold ${product.stock > 0 ? 'text-zinc-300' : 'text-rose-500'}`}>
                            {product.stock} pcs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </>
        )}

        {/* Modal Add/Edit */}
        {(isAdding || isEditing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass w-full max-w-lg rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-300">
              <header className="mb-8">
                <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                  <Package className="w-6 h-6 text-indigo-500" />
                  {isAdding ? 'Tambah Produk Baru' : 'Edit Detail Produk'}
                </h2>
                <p className="text-zinc-500 text-sm mt-1">Lengkapi data produk untuk memudahkan AI berjualan.</p>
              </header>

              <form onSubmit={handleAction} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Nama Produk
                  </label>
                  <input 
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Pashmina Silk Premium"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    Harga (Rp)
                  </label>
                  <input 
                    type="number" required value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="55000"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>

                <div className="flex flex-col items-center gap-4 mb-2">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                      {formData.image_url ? (
                        <img src={formData.image_url} alt="Product Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-700">
                          <Camera className="w-8 h-8" />
                          <span className="text-[8px] font-bold uppercase tracking-tighter">Foto Produk</span>
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center text-white cursor-pointer shadow-lg transition-all active:scale-95 border-4 border-[#09090b]">
                      <Plus className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Gambar Produk</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Kategori Produk</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="Makanan & Minuman" className="bg-zinc-900">Makanan & Minuman</option>
                      <option value="Pakaian & Fashion" className="bg-zinc-900">Pakaian & Fashion</option>
                      <option value="Sepatu & Alas Kaki" className="bg-zinc-900">Sepatu & Alas Kaki</option>
                      <option value="Aksesoris & Kerajinan" className="bg-zinc-900">Aksesoris & Kerajinan</option>
                      <option value="Kecantikan & Kesehatan" className="bg-zinc-900">Kecantikan & Kesehatan</option>
                      <option value="Elektronik & Gadget" className="bg-zinc-900">Elektronik & Gadget</option>
                      <option value="Lainnya" className="bg-zinc-900">Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Stok</label>
                    <input 
                      type="number" required value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      placeholder="100"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Deskripsi Produk (Untuk AI)</label>
                    <button 
                      type="button"
                      onClick={handleAiDescription}
                      disabled={isAiGenerating || !formData.name}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors disabled:opacity-30"
                    >
                      {isAiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      {isAiGenerating ? 'AI sedang menulis...' : 'Tulis Otomatis dengan AI'}
                    </button>
                  </div>
                  <textarea 
                    required value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    placeholder="Jelaskan keunggulan produk, ukuran, bahan, dll..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-zinc-400 font-bold rounded-2xl transition-all">Batal</button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all">
                    {isAdding ? 'Tambahkan ke Katalog' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default KatalogProduk;
