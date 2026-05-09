import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Store, 
  Package, 
  MessageCircle, 
  ChevronRight, 
  Zap, 
  ShieldCheck,
  Bot
} from 'lucide-react';

const Panduan: React.FC = () => {
  const navigate = useNavigate();
  const steps = [
    {
      title: 'Registrasi Toko UMKM',
      desc: 'Langkah pertama adalah mendaftarkan bisnis Anda. Masukkan nama toko, logo, dan deskripsi singkat yang menarik.',
      icon: Store,
      color: 'bg-blue-500/10 text-blue-400',
      menu: 'Manajemen Toko',
      path: '/toko'
    },
    {
      title: 'Lengkapi Katalog Produk',
      desc: 'Masukkan produk yang Anda jual beserta harga dan deskripsi detail. Ini sangat penting agar AI bisa membantu menjawab pertanyaan pelanggan.',
      icon: Package,
      color: 'bg-indigo-500/10 text-indigo-400',
      menu: 'Katalog Produk',
      path: '/katalog'
    },
    {
      title: 'Aktifkan AI Assistant',
      desc: 'Buka menu Pengaturan untuk mengaktifkan Fitur Auto-Reply. AI akan otomatis membalas pesan berdasarkan data katalog Anda.',
      icon: Bot,
      color: 'bg-violet-500/10 text-violet-400',
      menu: 'Pengaturan',
      path: '/pengaturan'
    },
    {
      title: 'Kelola Percakapan',
      desc: 'Pantau semua chat yang masuk. Anda bisa membalas secara manual jika ada pertanyaan yang sangat spesifik atau membutuhkan sentuhan personal.',
      icon: MessageCircle,
      color: 'bg-emerald-500/10 text-emerald-400',
      menu: 'Percakapan',
      path: '/percakapan'
    }
  ];

  return (
    <main className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#09090b] font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Panduan Alur Admin</h1>
          <p className="text-zinc-500 mt-3 text-lg">Ikuti langkah-langkah di bawah ini untuk mengoptimalkan penggunaan InboxAI.</p>
        </header>

        <div className="space-y-8 relative">
          {/* Connector Line */}
          <div className="absolute left-[31px] top-10 bottom-10 w-px bg-gradient-to-b from-indigo-500/50 via-white/5 to-transparent hidden md:block"></div>

          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col md:flex-row gap-8 slide-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center flex-shrink-0 z-10 border border-white/5 shadow-xl`}>
                <step.icon className="w-8 h-8" />
              </div>
              
              <div className="flex-1 glass p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-2 block">Langkah {i + 1}</span>
                    <h3 className="text-xl font-bold text-zinc-100">{step.title}</h3>
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-zinc-500 uppercase tracking-wider border border-white/5">
                    Menu: {step.menu}
                  </div>
                </div>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  {step.desc}
                </p>
                <div 
                  onClick={() => navigate(step.path)}
                  className="mt-6 flex items-center gap-2 text-indigo-400 font-bold text-xs cursor-pointer hover:underline group/btn w-fit"
                >
                  Buka Menu Sekarang <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pro Tips */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <Zap className="w-8 h-8 text-amber-400 mb-4" />
            <h4 className="text-lg font-bold text-zinc-100 mb-2">Tips Cepat: AI Insights</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Gunakan menu AI Insights secara berkala untuk memahami tren apa yang sedang diminati pelanggan Anda minggu ini.
            </p>
          </div>
          <div className="glass p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="text-lg font-bold text-zinc-100 mb-2">Keamanan Data</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Data chat dan katalog Anda tersimpan aman dan terenkripsi di server kami. Kami tidak akan membagikannya ke pihak manapun.
            </p>
          </div>
        </div>

        <footer className="mt-20 py-12 border-t border-white/5 text-center">
          <p className="text-zinc-600 text-xs">
            Butuh bantuan lebih lanjut? Hubungi Tim Support kami di menu Pengaturan.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Panduan;
