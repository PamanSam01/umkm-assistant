import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Loader2, 
  CheckCircle2,
  Shield
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    bio: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'profiles', user.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          bio: data.bio || ''
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    try {
      const docRef = doc(db, 'profiles', user.id);
      await updateDoc(docRef, {
        ...formData,
        updated_at: new Date()
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("Gagal menyimpan profil: " + (err as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#09090b] font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Profil Saya</h1>
            <p className="text-zinc-500 mt-1 text-sm">Kelola informasi pribadi dan identitas Anda.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            {user?.role === 'admin' ? 'Akun Penjual' : 'Akun Pembeli'}
          </div>
        </header>

        {showSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Profil berhasil diperbarui!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="glass rounded-[2rem] border border-white/5 p-8 space-y-6">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 border-4 border-white/5">
                <UserIcon className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-zinc-100">{formData.full_name || 'User UMKM'}</h2>
                <p className="text-xs text-zinc-500 flex items-center justify-center gap-2 mt-1">
                  <Mail className="w-3 h-3" />
                  {firebaseUser?.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <UserIcon className="w-3 h-3" /> Nama Lengkap
                </label>
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                  placeholder="Masukkan nama lengkap..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> No. WhatsApp
                </label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                  placeholder="Contoh: 08123456789"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> 
                {user?.role === 'admin' ? 'Kota / Daerah Toko' : 'Kota / Daerah Penerima'}
              </label>
              <input 
                type="text" 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                placeholder={user?.role === 'admin' ? "Contoh: Bandung, Jawa Barat" : "Contoh: Kec. Lengkong, Kota Bandung"}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Shield className="w-3 h-3" /> 
                {user?.role === 'admin' ? 'Motto / Deskripsi Singkat Bisnis' : 'Bio Singkat'}
              </label>
              <input 
                type="text" 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                placeholder={user?.role === 'admin' ? "Contoh: Menyediakan kopi terbaik dari petani lokal." : "Contoh: Penikmat kopi dan pendukung UMKM."}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> 
                {user?.role === 'admin' ? 'Alamat Lengkap Toko (Pengirim)' : 'Alamat Lengkap Penerima'}
              </label>
              <textarea 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                placeholder={user?.role === 'admin' ? "Masukkan alamat lengkap toko untuk keperluan penjemputan barang..." : "Masukkan alamat lengkap pengiriman untuk keperluan pengantaran pesanan..."}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Simpan Perubahan
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
};

export default Profile;
