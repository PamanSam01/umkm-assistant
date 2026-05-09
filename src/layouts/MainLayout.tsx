import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats } from '../services/api';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Sparkles, 
  LogOut,
  Store,
  Package,
  Truck,
  ShoppingBag,
  BarChart3,
  BookOpen,
  Settings,
  ChevronDown,
  User as UserIcon,
  X,
  MoreHorizontal
} from 'lucide-react';
import AIChatMini from '../components/AIChatMini';
import Logo from '../components/Logo';

const MainLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({ pesanMasuk: '0', aiReplyRate: '0%', pembeliBaru: '0' });
  const [showAIChat, setShowAIChat] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Debug log to monitor efficiency
  useEffect(() => {
    if (user?.role === 'admin' && user?.id) {
      const fetchStats = async () => {
        try {
          const s = await getDashboardStats(user.id);
          setStats({
            pesanMasuk: s.pesanMasuk,
            aiReplyRate: s.aiReplyRate,
            pembeliBaru: s.pembeliBaru
          });
        } catch (err) {
          console.error('Failed to fetch stats:', err);
        }
      };
      fetchStats();
      const interval = setInterval(fetchStats, 60000); 
      return () => clearInterval(interval);
    }
  }, [user?.id, user?.role]);

  const isCartPage = location.pathname === '/pesanan';

  // Prevent flickering by showing a clean loader or nothing until auth is settled
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-screen h-[100dvh] w-screen overflow-hidden bg-[#09090b] flex-col md:flex-row relative">
      {/* ══════════════════════════════════ */}
      {/*  LEFT SIDEBAR (Desktop Only)       */}
      {/* ══════════════════════════════════ */}
      <aside className={`hidden md:flex ${isCollapsed ? 'w-[80px]' : 'w-[240px]'} flex-shrink-0 flex flex-col glass border-r border-white/5 z-50 relative transition-all duration-500 ease-in-out`}>
        {/* Decorative glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none"></div>

        {/* Sidebar Header */}
        <div className={`px-5 pt-6 pb-5 flex items-center justify-between transition-all duration-500 ${isCollapsed ? 'flex-col gap-6' : ''}`}>
          <div className={`flex items-center gap-3 overflow-hidden transition-all duration-500 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/10">
              <Logo size={22} />
            </div>
            <span className="font-display font-bold text-lg text-zinc-100 tracking-tight shimmer-text whitespace-nowrap">InboxAI</span>
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-indigo-400 transition-all active:scale-90 border border-white/5 shadow-inner group"
          >
            <div className="flex flex-col gap-1 items-center">
              <div className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${isCollapsed ? 'rotate-45 translate-y-1.5' : ''}`}></div>
              <div className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${isCollapsed ? 'opacity-0' : ''}`}></div>
              <div className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${isCollapsed ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 mt-1 overflow-y-auto no-scrollbar">
          {isAdmin ? (
            <>
              <NavLink 
                to="/dashboard" 
                title={isCollapsed ? "Dashboard" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Dashboard</span>}
              </NavLink>

              <NavLink 
                to="/kelola-pesanan" 
                title={isCollapsed ? "Pesanan Masuk" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <Truck className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Pesanan Masuk</span>}
              </NavLink>

              <NavLink 
                to="/toko" 
                title={isCollapsed ? "Manajemen Toko" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <Store className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Manajemen Toko</span>}
              </NavLink>

              <NavLink 
                to="/katalog" 
                title={isCollapsed ? "Katalog Produk" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <Package className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Katalog Produk</span>}
              </NavLink>

              <NavLink 
                to="/percakapan" 
                title={isCollapsed ? "Percakapan" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Percakapan</span>}
              </NavLink>

              <NavLink 
                to="/ai-insights" 
                title={isCollapsed ? "AI Insights" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="animate-in fade-in slide-in-from-left-2 duration-300">AI Insights</span>
                    <span className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse-dot shadow-[0_0_6px_rgba(34,211,238,0.8)]"></span>
                  </>
                )}
              </NavLink>

              <NavLink 
                to="/analitik" 
                title={isCollapsed ? "Analitik" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Analitik</span>}
              </NavLink>

              <NavLink 
                to="/panduan" 
                title={isCollapsed ? "Panduan" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <BookOpen className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Panduan Admin</span>}
              </NavLink>

              <NavLink 
                to="/pengaturan" 
                title={isCollapsed ? "Pengaturan" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Pengaturan</span>}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink 
                to="/jelajah" 
                title={isCollapsed ? "Jelajah Toko" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <Store className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Jelajah Toko</span>}
              </NavLink>

              <NavLink 
                to="/pesanan" 
                title={isCollapsed ? "Pesanan Saya" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <ShoppingBag className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Pesanan Saya</span>}
              </NavLink>

              <NavLink 
                to="/percakapan" 
                title={isCollapsed ? "Percakapan" : ""}
                className={({ isActive }) => `nav-item rounded-xl px-3 py-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} text-sm cursor-pointer transition-all duration-300 ${isActive ? 'active' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Percakapan</span>}
              </NavLink>
            </>
          )}

          {/* Divider */}
          {!isCollapsed && <div className="border-t border-white/5 my-3"></div>}

          {/* Quick stats (Admin Only) */}
          {isAdmin && !isCollapsed && (
            <div className="glass rounded-xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Hari Ini</div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-300">Pesan masuk</span>
                <span className="text-xs font-semibold text-indigo-300">{stats.pesanMasuk}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-300">AI Reply Rate</span>
                <span className="text-xs font-semibold text-cyan-300">{stats.aiReplyRate}</span>
              </div>
            </div>
          )}
        </nav>

        {/* User profile */}
        <div className={`px-3 pb-4 transition-all duration-500 ${isCollapsed ? 'mt-auto' : ''}`}>
          <div className="group relative">
            <div className={`glass rounded-xl p-3 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} cursor-pointer hover:bg-white/5 transition-all duration-300`}>
              <div className="relative flex-shrink-0">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${isAdmin ? 'from-violet-500 to-indigo-600' : 'from-emerald-500 to-cyan-600'} flex items-center justify-center text-xs font-bold text-white uppercase shadow-lg`}>
                  {user?.name?.substring(0, 2) || 'US'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#09090b]"></div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate capitalize">{user?.role}</div>
                </div>
              )}
              {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 group-hover:rotate-180 transition-transform" />}
            </div>
            
            {/* Logout Popover */}
            <div className={`absolute bottom-full ${isCollapsed ? 'left-full ml-2' : 'left-0 w-full'} mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform ${isCollapsed ? 'translate-x-2 group-hover:translate-x-0' : 'translate-y-2 group-hover:translate-y-0'} z-50`}>
              <div className={`glass rounded-xl border border-white/10 p-1 shadow-2xl space-y-1 ${isCollapsed ? 'w-48' : 'w-full'}`}>
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-300 hover:bg-white/5 text-xs font-medium transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                  Edit Profil Saya
                </button>
                <div className="h-px bg-white/5 mx-2"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-2xl border-t border-white/5 px-2 py-3 flex items-center justify-around">
        {isAdmin ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Dashboard</span>
            </NavLink>
            <NavLink to="/kelola-pesanan" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>
              <Truck className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Pesanan</span>
            </NavLink>
            <NavLink to="/percakapan" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>
              <MessageSquare className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Chat AI</span>
            </NavLink>
            <button 
              onClick={() => setShowMobileMenu(true)}
              className="flex flex-col items-center gap-1 text-zinc-500"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Lainnya</span>
            </button>
          </>
        ) : (
          <>
            <NavLink to="/jelajah" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>
              <Store className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Jelajah</span>
            </NavLink>
            <NavLink to="/pesanan" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Pesanan</span>
            </NavLink>
            <NavLink to="/percakapan" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>
              <MessageSquare className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Chat AI</span>
            </NavLink>
            <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-zinc-500">
              <LogOut className="w-5 h-5 text-rose-500/70" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Keluar</span>
            </button>
          </>
        )}
      </nav>

      {/* MOBILE FULL MENU OVERLAY (Admin Only) */}
      {isAdmin && showMobileMenu && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 md:hidden overflow-y-auto">
          <div className="p-8 space-y-8 pb-32">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Logo size={24} />
                </div>
                <span className="font-display font-bold text-xl text-white">Menu Admin</span>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="p-3 bg-white/5 rounded-full text-zinc-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-indigo-400' },
                { to: '/kelola-pesanan', label: 'Pesanan Masuk', icon: Truck, color: 'text-amber-400' },
                { to: '/toko', label: 'Manajemen Toko', icon: Store, color: 'text-emerald-400' },
                { to: '/katalog', label: 'Katalog Produk', icon: Package, color: 'text-blue-400' },
                { to: '/percakapan', label: 'Percakapan', icon: MessageSquare, color: 'text-cyan-400' },
                { to: '/ai-insights', label: 'AI Insights', icon: Sparkles, color: 'text-purple-400' },
                { to: '/analitik', label: 'Analitik', icon: BarChart3, color: 'text-rose-400' },
                { to: '/panduan', label: 'Panduan', icon: BookOpen, color: 'text-zinc-400' },
                { to: '/pengaturan', label: 'Pengaturan', icon: Settings, color: 'text-zinc-500' },
                { to: '/profile', label: 'Edit Profil', icon: UserIcon, color: 'text-indigo-300' }
              ].map((item) => (
                <NavLink 
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) => `flex flex-col gap-3 p-5 rounded-[2rem] border transition-all ${isActive ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-white/5 border-white/5 active:scale-95'}`}
                >
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">{item.label}</span>
                </NavLink>
              ))}
            </div>
            <button 
              onClick={handleLogout}
              className="w-full py-5 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <LogOut className="w-5 h-5" />
              LOGOUT AKUN
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden page-fade-in relative pb-[85px] md:pb-0">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        
        <Outlet />
      </div>
      
      {/* Floating AI Button (Adjust for Mobile) */}
      <div 
        className={`fab animate-float ${showAIChat ? 'rotate-90' : ''} !bg-none !bg-[#18181b] border border-white/10 shadow-2xl shadow-indigo-500/20 fixed z-[110] transition-all duration-300`} 
        style={{ 
          bottom: isAdmin ? '95px' : (isCartPage ? '165px' : '95px'), 
          right: '20px' 
        }}
        title="AI Assistant"
        onClick={() => setShowAIChat(!showAIChat)}
      >
        <Logo size={28} />
      </div>

      {/* Mini AI Chat Window */}
      {showAIChat && <AIChatMini onClose={() => setShowAIChat(false)} />}
    </div>
  );
};

export default MainLayout;
