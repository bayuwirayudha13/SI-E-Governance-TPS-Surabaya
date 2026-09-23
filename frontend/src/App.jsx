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

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' | 'auth'
  const [authTab, setAuthTab] = useState('masuk'); // 'masuk' | 'daftar'

  // Modals state
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isTpsModalOpen, setIsTpsModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);

  // Sync hash routing (support #auth, #masuk, #daftar)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#auth' || hash === '#masuk' || hash === '#signin') {
        setCurrentPage('auth');
        setAuthTab('masuk');
      } else if (hash === '#daftar' || hash === '#register') {
        setCurrentPage('auth');
        setAuthTab('daftar');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // check initial hash

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  // If user navigates to Auth Page (SampahPintar Login / Daftar)
  if (currentPage === 'auth') {
    return (
      <AuthPage 
        initialTab={authTab} 
        onBackToHome={handleBackToHome} 
      />
    );
  }

  // Otherwise, render full Landing Page
  return (
    <div className="app-container">
      {/* 1. Header / Navbar with Sign In button opening AuthPage */}
      <Navbar 
        onOpenLoginModal={() => handleOpenAuth('masuk')}
        onOpenTpsModal={() => setIsTpsModalOpen(true)} 
      />

      {/* 2. Main Content */}
      <main>
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
      </main>

      {/* 7. Footer */}
      <Footer 
        onOpenTpsModal={() => setIsTpsModalOpen(true)} 
        onOpenRewardModal={() => setIsRewardModalOpen(true)} 
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
    </div>
  );
}
