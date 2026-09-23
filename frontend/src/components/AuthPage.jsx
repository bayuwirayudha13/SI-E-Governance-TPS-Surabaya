import React, { useState } from 'react';

export default function AuthPage({ initialTab = 'masuk', onBackToHome, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'daftar' or 'masuk'
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [noKK, setNoKK] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (activeTab === 'masuk') {
      // Check admin credentials specified by user:
      // email: admin123@gmail.com, password: admin123
      if (email.trim().toLowerCase() === 'admin123@gmail.com' && password === 'admin123') {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          if (onLoginSuccess) {
            onLoginSuccess({ role: 'admin', email: 'admin123@gmail.com' });
          }
        }, 500);
        return;
      }

      // If other credentials, login simulation
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        alert(`Berhasil masuk ke akun ${email}!`);
        onBackToHome();
      }, 700);
    } else {
      // Register
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        alert(`Akun atas nama ${fullName || 'Warga'} berhasil didaftarkan! Silakan masuk.`);
        setActiveTab('masuk');
      }, 700);
    }
  };

  return (
    <div className="auth-page-container">
      {/* LEFT PANEL: Forest Green Branding & Stats */}
      <div className="auth-left-panel">
        {/* Background Ambient Shapes */}
        <div className="ambient-circle ambient-circle-1"></div>
        <div className="ambient-circle ambient-circle-2"></div>
        <div className="ambient-circle ambient-circle-3"></div>

        <div className="auth-left-content">
          {/* Top Brand Logo */}
          <div className="auth-brand-badge">
            <div className="auth-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <div className="auth-brand-name">SampahPintar</div>
              <div className="auth-brand-subtitle">Sistem Manajemen Sampah Kelurahan</div>
            </div>
          </div>

          {/* Middle Headline & Text */}
          <div className="auth-hero-copy">
            <h1 className="auth-hero-title">
              <span>Kelola Sampah,</span>
              <span>Raih Reward,</span>
              <span>Jaga Bumi</span>
            </h1>
            <p className="auth-hero-desc">
              Bergabunglah dengan ribuan warga Kelurahan Sukamaju yang sudah aktif memilah sampah dan mendapat poin reward.
            </p>

            {/* Stats Row */}
            <div className="auth-stats-grid">
              <div className="auth-stat-col">
                <div className="auth-stat-number">2.400+</div>
                <div className="auth-stat-label">Warga Aktif</div>
              </div>
              <div className="auth-stat-col">
                <div className="auth-stat-number">25+</div>
                <div className="auth-stat-label">Titik TPS</div>
              </div>
              <div className="auth-stat-col">
                <div className="auth-stat-number">58rb</div>
                <div className="auth-stat-label">Poin Dibagi</div>
              </div>
            </div>
          </div>

          {/* Bottom Link Back to Landing */}
          <div className="auth-bottom-nav">
            <button 
              type="button" 
              className="btn-back-home"
              onClick={onBackToHome}
              id="auth-back-to-home"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication Form */}
      <div className="auth-right-panel">
        <div className="auth-form-wrapper">
          {/* Top Toggle Switch: Daftar vs Masuk */}
          <div className="auth-toggle-pill">
            <button
              type="button"
              className={`auth-toggle-btn ${activeTab === 'daftar' ? 'active' : ''}`}
              onClick={() => setActiveTab('daftar')}
              id="tab-toggle-daftar"
            >
              Daftar
            </button>
            <button
              type="button"
              className={`auth-toggle-btn ${activeTab === 'masuk' ? 'active' : ''}`}
              onClick={() => setActiveTab('masuk')}
              id="tab-toggle-masuk"
            >
              Masuk
            </button>
          </div>

          {/* Form Header */}
          {activeTab === 'daftar' ? (
            <div className="auth-form-header">
              <h2 className="auth-form-title">Buat Akun Baru</h2>
              <p className="auth-form-subtitle">
                Daftarkan diri untuk mulai memilah sampah &amp; meraih reward.
              </p>
            </div>
          ) : (
            <div className="auth-form-header">
              <h2 className="auth-form-title">Masuk</h2>
              <p className="auth-form-subtitle">
                Masuk ke akun SampahPintar kamu.
              </p>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="auth-form">
            {activeTab === 'daftar' && (
              <>
                {/* Nama Lengkap */}
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">Nama Lengkap</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    placeholder="contoh: Budi Santoso"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Nomor Kartu Keluarga (KK) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="noKK">
                    Nomor Kartu Keluarga (KK) <span className="required-star">*</span>
                  </label>
                  <input
                    id="noKK"
                    type="text"
                    required
                    maxLength={16}
                    placeholder="16 digit nomor KK"
                    value={noKK}
                    onChange={(e) => setNoKK(e.target.value.replace(/\D/g, ''))}
                    className="form-input font-mono"
                  />
                  <div className="form-helper-text">
                    Digunakan untuk verifikasi kependudukan warga kelurahan.
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                placeholder="email@kelurahan.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Password with Show/Hide Toggle */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              className="btn-auth-submit"
              disabled={isSuccess}
              id="auth-submit-btn"
            >
              <span>{activeTab === 'daftar' ? 'Buat Akun & Masuk' : 'Masuk ke Dashboard'}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>

          {/* Bottom Switch Link */}
          <div className="auth-switch-link">
            {activeTab === 'daftar' ? (
              <span>
                Sudah punya akun?{' '}
                <button
                  type="button"
                  className="switch-link-btn"
                  onClick={() => setActiveTab('masuk')}
                >
                  Masuk di sini
                </button>
              </span>
            ) : (
              <span>
                Belum punya akun?{' '}
                <button
                  type="button"
                  className="switch-link-btn"
                  onClick={() => setActiveTab('daftar')}
                >
                  Daftar sekarang
                </button>
              </span>
            )}
          </div>

          {/* Copyright Info */}
          <div className="auth-copyright">
            &copy; 2025 Dinas Lingkungan Hidup - SampahPintar v2.4.1
          </div>
        </div>
      </div>
    </div>
  );
}
