import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Percakapan from './pages/Percakapan';
import AIInsights from './pages/AIInsights';
import Analitik from './pages/Analitik';
import Pengaturan from './pages/Pengaturan';
import ManajemenToko from './pages/ManajemenToko';
import KatalogProduk from './pages/KatalogProduk';
import Panduan from './pages/Panduan';
import JelajahToko from './pages/JelajahToko';
import PesananSaya from './pages/PesananSaya';
import KelolaPesanan from './pages/KelolaPesanan';
import Login from './pages/Login';
import Profile from './pages/Profile';
import TokoDetail from './pages/TokoDetail';
import LandingPage from './pages/LandingPage';

import Logo from './components/Logo';

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: ('admin' | 'user')[] 
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // Let AppRoutes handle global loading
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/' : '/jelajah'} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
          <div className="relative animate-pulse">
            <Logo size={80} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-1/2 animate-shimmer"></div>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] ml-1">Mengamankan Sesi...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={!user ? <LandingPage /> : <Navigate to={user.role === 'admin' ? '/dashboard' : '/jelajah'} replace />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="percakapan" element={<Percakapan />} />
        <Route path="profile" element={<Profile />} />
        <Route path="jelajah" element={<JelajahToko />} />
        <Route path="toko/:id" element={<TokoDetail />} />
        <Route path="pesanan" element={<PesananSaya />} />
        <Route path="kelola-pesanan" element={<ProtectedRoute allowedRoles={['admin']}><KelolaPesanan /></ProtectedRoute>} />
        <Route path="toko" element={<ProtectedRoute allowedRoles={['admin']}><ManajemenToko /></ProtectedRoute>} />
        <Route path="katalog" element={<ProtectedRoute allowedRoles={['admin']}><KatalogProduk /></ProtectedRoute>} />
        <Route path="ai-insights" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AIInsights />
          </ProtectedRoute>
        } />
        <Route path="analitik" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Analitik />
          </ProtectedRoute>
        } />
        <Route path="panduan" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Panduan />
          </ProtectedRoute>
        } />
        <Route path="pengaturan" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Pengaturan />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
