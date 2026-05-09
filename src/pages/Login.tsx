import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Iridescence from '../components/Iridescence';
import Logo from '../components/Logo';

const BACKGROUND_COLOR: [number, number, number] = [0.15, 0.15, 0.25];

const Login: React.FC = () => {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('admin');
  
  const navigate = useNavigate();

  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        await setDoc(doc(db, 'profiles', fbUser.uid), {
          id: fbUser.uid,
          full_name: email.split('@')[0],
          role: selectedRole,
          store_name: selectedRole === 'admin' ? 'Toko UMKM Baru' : null,
          updated_at: new Date().toISOString()
        });
        navigate('/');
      } else {
        const { error } = await login(email, password);
        if (error) {
          setErrorMsg(error);
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('DEBUG [Login]: Exception Caught:', err.message);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already logged in, redirect away from login page
  if (!isLoading && user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen min-h-[100dvh] w-screen flex items-center justify-center bg-[#09090b] p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Dynamic Iridescence Background - Rendered immediately to prevent black flicker */}
      <Iridescence 
        color={BACKGROUND_COLOR} 
        speed={0.4} 
        amplitude={0.05}
        mouseReact={true}
      />
      
      {/* Dark Overlay for contrast */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>

      {isLoading ? (
        <div className="relative z-20 flex flex-col items-center gap-4 animate-pulse">
          <Logo size={64} />
          <div className="text-zinc-500 text-sm font-medium">Mempersiapkan InboxAI...</div>
        </div>
      ) : (
        <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-[#0d0d15]/80 md:bg-transparent glass-strong rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500 relative z-10 backdrop-blur-2xl">
        
        {/* Left Side: Branding & Illustration (Visible on Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900/40 items-center justify-center overflow-hidden border-r border-white/10">
          <img 
            src="/assets/images/login_bg.png" 
            alt="UMKM Assistant" 
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/90 via-indigo-950/40 to-transparent"></div>
          
          <div className="relative z-10 p-16 w-full flex flex-col h-full justify-end">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-white/10 border border-white/20 items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20 backdrop-blur-md">
               <Logo size={32} />
            </div>
            <h2 className="text-4xl font-display font-bold text-white leading-tight shimmer-text-static">
              Bawa UMKM Anda <br/>Ke Level Digital.
            </h2>
            <p className="text-zinc-400 mt-4 max-w-sm text-sm leading-relaxed">
              Satu platform cerdas berbasis AI untuk mengelola percakapan, produk, dan analitik bisnis Anda secara otomatis.
            </p>
            <div className="mt-8 flex items-center gap-4">
               {/* Mockup elements removed for a cleaner look */}
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-[#0d0d15]/60 md:bg-black/20 backdrop-blur-md">
          <div className="max-w-md mx-auto w-full">
            <div className="lg:hidden text-center mb-8 flex flex-col items-center">
               <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Logo size={28} />
               </div>
               <h1 className="text-2xl font-bold text-white">InboxAI</h1>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">{isSignUp ? 'Daftar Akun Baru' : 'Selamat Datang'}</h1>
              <p className="text-zinc-500 text-sm">
                {isSignUp ? 'Pilih peran Anda untuk mulai bergabung.' : 'Masuk untuk mengelola toko atau belanja hari ini.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className={`p-4 rounded-2xl text-xs border animate-in slide-in-from-top-2 duration-300 ${errorMsg.includes('berhasil') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                  {errorMsg}
                </div>
              )}

              {isSignUp && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <button 
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`p-4 rounded-2xl border transition-all text-left group ${selectedRole === 'admin' ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${selectedRole === 'admin' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-zinc-500'}`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${selectedRole === 'admin' ? 'text-indigo-300' : 'text-zinc-500'}`}>Penjual</div>
                    <div className="text-[10px] text-zinc-500 leading-tight">Kelola toko & katalog produk.</div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setSelectedRole('user')}
                    className={`p-4 rounded-2xl border transition-all text-left group ${selectedRole === 'user' ? 'bg-emerald-600/20 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${selectedRole === 'user' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-zinc-500'}`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${selectedRole === 'user' ? 'text-emerald-300' : 'text-zinc-500'}`}>Pembeli</div>
                    <div className="text-[10px] text-zinc-500 leading-tight">Jelajahi UMKM & belanja produk.</div>
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@umkm.id"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                  {!isSignUp && <button type="button" className="text-[10px] text-zinc-600 hover:text-indigo-400">Lupa Password?</button>}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 ${selectedRole === 'user' && isSignUp ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'} text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95`}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? `Daftar sebagai ${selectedRole === 'admin' ? 'Penjual' : 'Pembeli'}` : 'Masuk Sekarang')}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-8">
              <p className="text-xs text-zinc-600">
                {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun UMKM?'}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-2 font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {isSignUp ? 'Login di sini' : 'Daftar sekarang'}
                </button>
              </p>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Login;
