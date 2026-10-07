import React, { useEffect, useState } from 'react';
import { authService } from '../api/client';

/**
 * ProtectedRoute Component:
 * Guards sensitive routes and panels based on authentication and RBAC roles.
 *
 * @param {React.ReactNode} children - The protected view to render.
 * @param {string[]} allowedRoles - List of roles permitted (e.g. ['admin', 'petugas', 'warga']).
 * @param {string} fallbackHash - Hash to redirect to when unauthenticated (default: '#auth').
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  fallbackHash = '#auth',
}) {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authService.getCurrentUser());
    };

    window.addEventListener('auth:change', handleAuthChange);
    window.addEventListener('auth:unauthorized', handleAuthChange);

    // Short verification tick
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => {
      window.removeEventListener('auth:change', handleAuthChange);
      window.removeEventListener('auth:unauthorized', handleAuthChange);
      clearTimeout(timer);
    };
  }, []);

  // 1. Loading state while checking session
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'inherit',
        color: '#475569'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #cbd5e1',
          borderTopColor: '#0a5c36',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px'
        }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Memverifikasi hak akses...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. Unauthenticated check: User is not logged in
  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '24px',
        fontFamily: 'inherit'
      }}>
        <div style={{
          maxWidth: '460px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            Autentikasi Diperlukan
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
            Anda harus masuk ke sistem SI-PETASAN terlebih dahulu untuk mengakses halaman ini.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => { window.location.hash = fallbackHash; }}
              style={{
                background: '#0a5c36',
                color: '#ffffff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Masuk Sekarang
            </button>
            <button
              type="button"
              onClick={() => { window.location.hash = '#beranda'; }}
              style={{
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. RBAC Role Check: User logged in but lacks required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '24px',
        fontFamily: 'inherit'
      }}>
        <div style={{
          maxWidth: '460px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: '#fef3c7',
            color: '#b45309',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            Akses Tidak Diizinkan
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
            Akun Anda terdaftar sebagai <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{user.role}</strong>, sedangkan halaman ini dikhususkan untuk peran <strong style={{ color: '#0a5c36' }}>{allowedRoles.join(', ')}</strong>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                if (user.role === 'admin' || user.role === 'superadmin') window.location.hash = '#admin';
                else if (user.role === 'petugas' || user.role === 'driver') window.location.hash = '#petugas';
                else window.location.hash = '#warga';
              }}
              style={{
                background: '#0a5c36',
                color: '#ffffff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Buka Portal Saya ({user.role})
            </button>
            <button
              type="button"
              onClick={() => {
                authService.clearSession();
                window.location.hash = '#auth';
              }}
              style={{
                background: 'transparent',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Ganti Akun Lain
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized: Render protected children
  return <>{children}</>;
}
