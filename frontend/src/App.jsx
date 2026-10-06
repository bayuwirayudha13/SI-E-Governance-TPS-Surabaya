import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Features from './components/Features';
import NewsSection from './components/NewsSection';
import WasteTypes from './components/WasteTypes';
import Footer from './components/Footer';

import ArticleModal from './components/ArticleModal';
import RewardCalculatorModal from './components/RewardCalculatorModal';
import TpsMapModal from './components/TpsMapModal';
import WasteGuideModal from './components/WasteGuideModal';
import AuthPage from './components/AuthPage';
import AdminPanel from './components/AdminPanel';
import WargaPanel from './components/WargaPanel';
import PetugasPanel from './components/PetugasPanel';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import { authService } from './api/client';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' | 'auth' | 'admin' | 'warga' | 'petugas'
  const [authTab, setAuthTab] = useState('masuk'); // 'masuk' | 'daftar'
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  // Listen to global auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener('auth:change', handleAuthChange);
    window.addEventListener('auth:unauthorized', handleAuthChange);
    return () => {
      window.removeEventListener('auth:change', handleAuthChange);
      window.removeEventListener('auth:unauthorized', handleAuthChange);
    };
  }, []);

  // Modals state
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isTpsModalOpen, setIsTpsModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);

  // Sync hash routing (support #auth, #masuk, #daftar, #admin, #warga, #petugas)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        setCurrentPage('admin');
      } else if (hash === '#warga' || hash === '#portal-warga' || hash === '#warga-dashboard') {
        setCurrentPage('warga');
      } else if (
        hash === '#petugas' ||
        hash === '#petugas-pengangkut' ||
        hash === '#petugas-lapangan' ||
        hash === '#tugas' ||
        hash === '#tugas-hari-ini' ||
        hash === '#scan' ||
        hash === '#scan-qr' ||
        hash === '#riwayat' ||
        hash === '#riwayat-pengambilan'
      ) {
        setCurrentPage('petugas');
      } else if (hash === '#auth' || hash === '#masuk' || hash === '#signin') {
        setCurrentPage('auth');
        setAuthTab('masuk');
      } else if (hash === '#daftar' || hash === '#register') {
        setCurrentPage('auth');
        setAuthTab('daftar');
      } else if (hash === '#ganti-password' || hash === '#reset-password') {
        setCurrentPage('auth');
        setAuthTab('ganti-password');
      } else if (hash === '#beranda' || hash === '') {
        if (currentPage !== 'admin' && currentPage !== 'warga' && currentPage !== 'petugas') {
          setCurrentPage('landing');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPage]);

  const handleOpenAuth = (tab = 'masuk') => {
    setAuthTab(tab);
    setCurrentPage('auth');
    window.location.hash = tab === 'daftar' ? 'daftar' : 'masuk';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentPage('landing');
    window.location.hash = 'beranda';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentPage('admin');
      window.location.hash = 'admin';
    } else if (user.role === 'petugas') {
      setCurrentPage('petugas');
      window.location.hash = 'petugas';
    } else {
      setCurrentPage('warga');
      window.location.hash = 'warga';
    }
  };

  const handleLogout = () => {
    authService.clearSession();
    setCurrentUser(null);
    setCurrentPage('landing');
    window.location.hash = 'beranda';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is inside Admin Panel (Protected by RBAC: admin)
  if (currentPage === 'admin') {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminPanel onLogout={handleLogout} />
      </ProtectedRoute>
    );
  }

  // If user is inside Petugas Pengangkut Panel (Protected by RBAC: petugas)
  if (currentPage === 'petugas') {
    return (
      <ProtectedRoute allowedRoles={['petugas']}>
        <PetugasPanel
          onLogout={handleLogout}
          officerName={currentUser?.name || 'Hendra'}
          officerRole="Petugas Pengangkut"
        />
      </ProtectedRoute>
    );
  }

  // If user is inside Warga Portal (Protected by RBAC: warga)
  if (currentPage === 'warga') {
    return (
      <ProtectedRoute allowedRoles={['warga']}>
        <WargaPanel 
          onLogout={handleLogout}
          wargaId={currentUser?.id}
        />
      </ProtectedRoute>
    );
  }

  // If user navigates to Auth Page (SampahPintar Login / Daftar)
  if (currentPage === 'auth') {
    return (
      <AuthPage 
        initialTab={authTab} 
        onBackToHome={handleBackToHome}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Otherwise, render full Landing Page with MainLayout
  return (
    <MainLayout
      currentUser={currentUser}
      onOpenLoginModal={() => handleOpenAuth('masuk')}
      onOpenTpsModal={() => setIsTpsModalOpen(true)}
      onOpenRewardModal={() => setIsRewardModalOpen(true)}
    >
      {/* Hero Section with Exact Satellite Map Preview */}
      <Hero onOpenTpsModal={() => setIsTpsModalOpen(true)} />

      {/* 3. Tentang Kami Section */}
      <About />

      {/* 4. Fitur Utama Kami Section */}
      <Features 
        onOpenRewardModal={() => setIsRewardModalOpen(true)}
        onOpenTpsModal={() => setIsTpsModalOpen(true)}
      />

      {/* 5. Berita & Artikel Section */}
      <NewsSection onSelectArticle={(article) => setSelectedArticle(article)} />

      {/* 6. Jenis Sampah Section */}
      <WasteTypes 
        onOpenRewardModal={() => setIsRewardModalOpen(true)}
        onSelectGuide={(guide) => setSelectedGuide(guide)}
      />

      {/* Modals */}
      <ArticleModal 
        article={selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
      />

      <RewardCalculatorModal 
        isOpen={isRewardModalOpen} 
        onClose={() => setIsRewardModalOpen(false)} 
      />

      <TpsMapModal 
        isOpen={isTpsModalOpen} 
        onClose={() => setIsTpsModalOpen(false)} 
      />

      <WasteGuideModal 
        wasteGuide={selectedGuide} 
        onClose={() => setSelectedGuide(null)} 
      />
    </MainLayout>
  );
}
