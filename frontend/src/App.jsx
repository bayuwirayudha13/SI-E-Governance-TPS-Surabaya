import React, { useState } from 'react';
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
import LoginModal from './components/LoginModal';

export default function App() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isTpsModalOpen, setIsTpsModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="app-container">
      {/* 1. Header / Navbar with Sign in button */}
      <Navbar 
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenTpsModal={() => setIsTpsModalOpen(true)} 
      />

      {/* 2. Hero Section with Exact Satellite Map Preview */}
      <main>
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
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

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
