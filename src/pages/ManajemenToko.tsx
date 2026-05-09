import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
import { 
  Store, 
  Plus, 
  Edit2, 
  Trash2,
  Globe, 
  Loader2,
  Camera,
  MapPin,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { generateStoreDescription } from '../services/api';

const ManajemenToko: React.FC = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', image_url: '', location: '', banner_url: '' });

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBannerUploading(true);
    try {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.readAsDataURL(compressed);
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, banner_url: reader.result as string }));
        setIsBannerUploading(false);
      };
    } catch (err) {
      console.error(err);
      setIsBannerUploading(false);
    }
  };

  const handleAIWrite = async () => {
    if (!formData.name || !formData.location) {
      alert('Mohon isi Nama Toko dan Lokasi terlebih dahulu agar AI bisa membuatkan deskripsi yang pas! 😊');
      return;
    }
    setIsGenerating(true);
    const result = await generateStoreDescription(formData.name, formData.location);
    if (result) {
      setFormData(prev => ({ ...prev, description: result }));
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    fetchStores();
  }, [user]);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
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
            else reject(new Error('Gagal kompresi gambar'));
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
      alert('Mohon pilih file gambar yang valid.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Compress Image
      const compressedBlob = await compressImage(file);
      
      // 2. Convert to Base64 (This bypasses Storage and CORS issues)
      const reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setFormData({ ...formData, image_url: base64data });
        setIsUploading(false);
      };
    } catch (err: any) {
      console.error('Upload Error:', err);
      alert('Gagal memproses gambar: ' + err.message);
      setIsUploading(false);
    }
  };

  const fetchStores = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'stores'),
        where('admin_id', '==', user.id)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStores(data || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = { 
        name: formData.name, 
        description: formData.description,
        image_url: formData.image_url,
        banner_url: formData.banner_url || '',
        location: formData.location,
        admin_id: user.id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'stores'), payload);
      setStores([{ id: docRef.id, ...payload }, ...stores]);
      setIsAdding(false);
      setFormData({ name: '', description: '', image_url: '', location: '', banner_url: '' });
    } catch (err) {
      alert('Gagal menambah toko: ' + (err as any).message);
    }
  };

  const handleEditStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !user) return;

    try {
      const docRef = doc(db, 'stores', currentStore.id);
      const payload = { 
        name: formData.name, 
        description: formData.description,
        image_url: formData.image_url,
        banner_url: formData.banner_url || '',
        location: formData.location,
        updated_at: serverTimestamp()
      };
      
      await updateDoc(docRef, payload);
      setStores(stores.map(s => s.id === currentStore.id ? { ...s, ...payload } : s));
      setIsEditing(false);
      setCurrentStore(null);
      setFormData({ name: '', description: '', image_url: '', location: '', banner_url: '' });
    } catch (err) {
      alert('Gagal mengedit toko: ' + (err as any).message);
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm('PERHATIAN: Menghapus toko akan menghapus semua produk dan percakapan di dalamnya. Lanjutkan?')) return;

    try {
      // 1. Hapus Produk terkait
      const productsQuery = query(collection(db, 'products'), where('store_id', '==', id));
      const productsSnap = await getDocs(productsQuery);
      const deleteProductsPromises = productsSnap.docs.map(d => deleteDoc(d.ref));
      
      // 2. Hapus Percakapan terkait
      const convsQuery = query(collection(db, 'conversations'), where('store_id', '==', id));
      const convsSnap = await getDocs(convsQuery);
      const deleteConvsPromises = convsSnap.docs.map(d => deleteDoc(d.ref));

      // 3. Eksekusi semua penghapusan
      await Promise.all([...deleteProductsPromises, ...deleteConvsPromises]);
      
      // 4. Hapus Dokumen Toko utama
      await deleteDoc(doc(db, 'stores', id));
      
      setStores(stores.filter(s => s.id !== id));
      alert('Toko dan semua data terkait berhasil dihapus.');
    } catch (err) {
      console.error("Delete Error:", err);
      alert('Gagal menghapus toko: ' + (err as any).message);
    }
  };

  const openEditModal = (store: any) => {
    setCurrentStore(store);
    setFormData({ 
      name: store.name, 
      description: store.description, 
      image_url: store.image_url || '',
      banner_url: store.banner_url || '',
      location: store.location || ''
    });
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-zinc-100 shimmer-text">Manajemen Toko</h1>
            <p className="text-zinc-500 text-sm mt-1">Kelola semua bisnis UMKM Anda dalam satu tempat.</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Toko Baru
          </button>
        </div>

        {/* Modal Add/Edit Store */}
        {(isAdding || isEditing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-strong w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl relative">
              <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
                <Store className="w-5 h-5 text-indigo-400" />
                {isAdding ? 'Registrasi Toko Baru' : 'Edit Profil Toko'}
              </h2>
              <form onSubmit={isAdding ? handleAddStore : handleEditStore} className="space-y-6">
                  {/* Section 1: Store Banner */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Banner Toko</label>
                      <label className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-white/10">
                        {isBannerUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                        {isBannerUploading ? 'Memproses...' : 'Upload Banner'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} disabled={isBannerUploading} />
                      </label>
                    </div>
                    <div className="relative h-32 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden shadow-inner group">
                      {formData.banner_url ? (
                        <img src={formData.banner_url} alt="Banner Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800">
                          <ImageIcon className="w-10 h-10 mb-1" />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Klik Upload Banner</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Logo & Identity */}
                  <div className="flex flex-col items-center gap-4 py-2 border-y border-white/5">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                        {formData.image_url ? (
                          <img src={formData.image_url} alt="Logo Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-zinc-800" />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center text-white cursor-pointer shadow-lg transition-all active:scale-95 border-4 border-[#0b0b14]">
                        <Plus className="w-5 h-5" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                      </label>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Logo Toko</span>
                  </div>

                  {/* Section 3: Information */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-1">Nama Toko</label>
                      <input 
                        type="text" required value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Contoh: Toko Maju Jaya"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider ml-1">Lokasi Toko</label>
                      <input 
                        type="text" required value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Contoh: Bandung, Jawa Barat"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Deskripsi (AI)</label>
                        <button
                          type="button"
                          onClick={handleAIWrite}
                          disabled={isGenerating}
                          className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg text-[10px] font-bold transition-all active:scale-95 border border-indigo-500/20"
                        >
                          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          {isGenerating ? 'Menulis...' : 'Generate Deskripsi'}
                        </button>
                      </div>
                      <textarea 
                        required value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        placeholder="Jelaskan produk Anda..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                      />
                    </div>
                  </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => { setIsAdding(false); setIsEditing(false); }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold rounded-2xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    {isAdding ? 'Simpan Toko' : 'Update Toko'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Store Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="glass rounded-3xl p-6 border border-white/10 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button 
                  onClick={() => openEditModal(store)}
                  className="p-2 bg-white/5 hover:bg-indigo-500/20 text-zinc-400 hover:text-indigo-400 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteStore(store.id)}
                  className="p-2 bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-500 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all overflow-hidden border border-white/5">
                {store.image_url ? (
                  <img src={store.image_url} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-6 h-6" />
                )}
              </div>

              <h3 className="text-lg font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">{store.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-zinc-500">
                <MapPin className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{store.location || 'Lokasi belum diset'}</span>
              </div>
              <p className="text-sm text-zinc-500 mt-2 line-clamp-3 min-h-[60px]">{store.description || 'Belum ada deskripsi.'}</p>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-zinc-300">0</span>
                    <span className="text-[10px] text-zinc-600 uppercase">Chat</span>
                  </div>
                  <div className="w-px h-6 bg-white/10"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-emerald-400">Aktif</span>
                    <span className="text-[10px] text-zinc-600 uppercase">Status</span>
                  </div>
                </div>
                <button className="p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white hover:bg-indigo-600 transition-all">
                  <Globe className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {stores.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center glass rounded-3xl border-dashed border-2 border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-zinc-300 font-semibold">Belum Ada Toko Terdaftar</h3>
              <p className="text-zinc-500 text-sm mt-1">Klik tombol "Tambah Toko Baru" untuk memulai bisnis Anda.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ManajemenToko;
