import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ShoppingBag, 
  Bot, 
  ShieldCheck, 
  Store,
  Star,
  CheckCircle2,
  Sparkles,
  Globe
} from 'lucide-react';
import Logo from '../components/Logo';
import Iridescence from '../components/Iridescence';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen h-[100dvh] overflow-y-auto bg-[#030303] text-white selection:bg-indigo-500/30 overflow-x-hidden scroll-smooth custom-scrollbar">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Logo size={32} />
          <div className="hidden md:flex items-center gap-12 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
            <a href="#statistik" className="hover:text-white transition-colors">Statistik</a>
            <a href="#ai" className="hover:text-white transition-colors">InboxAI</a>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="text-[11px] md:text-sm font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Masuk
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-2 md:px-6 md:py-2.5 bg-indigo-600 text-white text-[11px] md:text-sm font-bold rounded-full hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
            >
              Daftar Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen min-h-[100dvh] flex flex-col items-center justify-center pt-24 md:pt-32 overflow-hidden px-6">
        {/* IRIDESCENCE BACKGROUND */}
        <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none">
          <Iridescence 
            color={[0.4, 0.3, 1.0]} 
            speed={1.5} 
            amplitude={0.2}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/80 to-[#030303]"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center space-y-6 md:space-y-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-indigo-300 text-[9px] md:text-xs font-bold uppercase tracking-[0.15em] animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Platform UMKM Berbasis AI Pertama di Indonesia
          </div>
          
          <h1 className="text-4xl md:text-7xl lg:text-[120px] font-display font-black leading-[1.1] md:leading-[1] lg:leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            MASA DEPAN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-[length:200%_auto] animate-gradient">
              UMKM DIGITAL
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-zinc-400 text-sm md:text-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400 px-4 md:px-0">
            Lupakan cara lama. Kelola toko, stok, dan pelanggan secara otomatis dengan asisten AI pintar yang bekerja 24/7 untuk Anda.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 pt-2 md:pt-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500 w-full md:w-auto">
            <button 
              onClick={() => navigate('/login')}
              className="w-full md:w-auto px-8 md:px-12 py-3.5 md:py-6 bg-white text-black font-bold rounded-xl md:rounded-[2.5rem] shadow-2xl shadow-white/10 transition-all flex items-center justify-center gap-3 active:scale-95 text-xs md:text-lg group"
            >
              Mulai Bangun Toko <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/jelajah')}
              className="w-full md:w-auto px-8 md:px-12 py-3.5 md:py-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl md:rounded-[2.5rem] transition-all flex items-center justify-center gap-3 backdrop-blur-md active:scale-95 text-xs md:text-lg"
            >
              <ShoppingBag className="w-4 h-4" /> Jelajah Produk
            </button>
          </div>
        </div>

        {/* HERO MOCKUP DISPLAY */}
        <div className="relative mt-24 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-24 duration-1500 delay-700">
          <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full -z-10 animate-pulse"></div>
          <div className="glass rounded-[2rem] md:rounded-[4rem] border border-white/10 p-2 md:p-4 overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.3)] animate-float">
            <img 
              src="/dashboard-preview.png" 
              alt="Dashboard Preview" 
              className="w-full h-auto rounded-[1.5rem] md:rounded-[3.2rem]"
            />
          </div>
          
          {/* Decorative floating elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full"></div>
        </div>

        {/* Scroll Indicator for Mobile */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:hidden animate-bounce opacity-50">
          <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-500">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-indigo-500 to-transparent"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="statistik" className="py-32 bg-[#030303] relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'UMKM Indonesia', value: '2,500+', icon: Store, color: 'text-indigo-400' },
            { label: 'Transaksi Berhasil', value: '150k+', icon: ShoppingBag, color: 'text-cyan-400' },
            { label: 'Efisiensi Bisnis', value: '98%', icon: Bot, color: 'text-purple-400' },
            { label: 'Rating Platform', value: '4.9/5', icon: Star, color: 'text-amber-400' }
          ].map((stat, i) => (
            <div key={i} className="space-y-4 group">
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:bg-white/10 transition-colors shadow-inner">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="text-4xl md:text-5xl font-black tracking-tighter">{stat.value}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Showcase */}
      <section id="fitur" className="py-32 px-6 relative">
        <div id="ai" className="max-w-7xl mx-auto space-y-32">
          <div className="flex flex-col md:flex-row items-center gap-20">
            <div className="flex-1 space-y-8 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                Kekuatan Utama
              </div>
              <h2 className="text-4xl md:text-6xl font-bold leading-tight">AI yang Paham <br /><span className="text-zinc-500">Bisnis Anda Secara Utuh.</span></h2>
              <p className="text-zinc-400 text-lg md:text-xl leading-relaxed">
                Bukan sekadar chatbot biasa. InboxAI terintegrasi langsung dengan database produk, inventaris, dan status pengiriman Anda secara real-time.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  'Menjawab pertanyaan stok 24/7',
                  'Memberikan estimasi ongkir otomatis',
                  'Update status pesanan secara instan',
                  'Saran strategi marketing berbasis data'
                ].map((item, i) => (
                  <li key={i} className="flex items-center justify-center md:justify-start gap-3 text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 relative">
               <div className="absolute inset-0 bg-indigo-600/30 blur-[100px] rounded-full animate-pulse"></div>
               <div className="glass rounded-[3rem] border border-white/10 p-8 md:p-12 space-y-6 relative overflow-hidden">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Bot className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">InboxAI Assistant</div>
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">Online & Ready</div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-4">
                    <div className="bg-white/5 p-4 rounded-2xl rounded-bl-none max-w-[80%] text-xs leading-relaxed text-zinc-300">
                      Halo! Stok "Kopi Robusta" sisa 5 bungkus lagi nih. Mau saya buatkan promo diskon 10% untuk habisin stok hari ini?
                    </div>
                    <div className="bg-indigo-600 p-4 rounded-2xl rounded-br-none max-w-[80%] ml-auto text-xs leading-relaxed font-bold">
                      Boleh, buatkan promo "Flash Sale" sekarang ya!
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-40 px-6 text-center">
        <div className="max-w-4xl mx-auto glass p-10 md:p-20 rounded-[3rem] md:rounded-[4rem] border border-white/5 space-y-8 md:space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] -z-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 blur-[80px] -z-10"></div>
          
          <h2 className="text-4xl md:text-7xl font-black tracking-tight leading-tight uppercase">
            Sudah Siap <br />Naik Kelas?
          </h2>
          <p className="text-zinc-400 text-base md:text-xl">Daftarkan toko Anda hari ini dan rasakan kemudahan mengelola bisnis dengan teknologi masa depan.</p>
          <div className="pt-6">
            <button 
              onClick={() => navigate('/login')}
              className="w-full md:w-auto px-10 md:px-16 py-5 md:py-6 bg-white text-black font-black rounded-full hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 text-lg md:text-xl"
            >
              GABUNG SEKARANG
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="space-y-6">
            <Logo />
            <p className="text-zinc-600 text-sm max-w-xs leading-relaxed">Platform pemberdayaan UMKM melalui inovasi teknologi kecerdasan buatan demi Indonesia Maju.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <div className="flex flex-col gap-4">
              <span className="text-zinc-200">Layanan</span>
              <span className="text-zinc-600">Manajemen Toko</span>
              <span className="text-zinc-600">Katalog Produk</span>
              <span className="text-zinc-600">AI Assistant</span>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-zinc-200">UMKM Assistant</span>
              <span className="text-zinc-600">Tentang Kami</span>
              <span className="text-zinc-600">Syarat & Ketentuan</span>
              <span className="text-zinc-600">Kebijakan Privasi</span>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-zinc-200">Sosial</span>
              <a 
                href="https://github.com/PamanSam01" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white transition-colors flex items-center gap-2"
              >
                <Globe className="w-3 h-3" /> GitHub
              </a>
              <a 
                href="https://x.com/mrsamweb3" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white transition-colors flex items-center gap-2"
              >
                <Globe className="w-3 h-3" /> Twitter / X
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            &copy; 2026 UMKM ASSISTANT. BANGGA BUATAN INDONESIA.
          </div>
          <div className="flex gap-6 items-center">
             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-zinc-500" />
             </div>
             <span className="text-[10px] text-zinc-700 font-bold">SSL SECURED ENCRYPTION</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
