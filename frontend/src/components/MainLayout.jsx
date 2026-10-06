import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * MainLayout Component:
 * Base layout wrapper for public/landing page content, providing uniform Header,
 * Navigation, Main container, and Footer.
 */
export default function MainLayout({
  children,
  currentUser,
  onOpenLoginModal,
  onOpenTpsModal,
  onOpenRewardModal,
}) {
  return (
    <div className="app-container">
      {/* 1. Universal Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onOpenLoginModal={onOpenLoginModal}
        onOpenTpsModal={onOpenTpsModal}
      />

      {/* 2. Main Page Content / Children */}
      <main className="main-content-flow">
        {children}
      </main>

      {/* 3. Universal Footer */}
      <Footer
        onOpenTpsModal={onOpenTpsModal}
        onOpenRewardModal={onOpenRewardModal}
      />
    </div>
  );
}
