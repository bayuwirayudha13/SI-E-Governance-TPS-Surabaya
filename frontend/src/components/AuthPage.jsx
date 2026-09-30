import React, { useState, useEffect, useRef } from 'react';

export default function AuthPage({ initialTab = 'masuk', onBackToHome, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'daftar' or 'masuk'
  const [authStep, setAuthStep] = useState('form'); // 'form' or 'otp'
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [noKK, setNoKK] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OTP states
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpStatus, setOtpStatus] = useState(null); // { type: 'error' | 'success', message: string }
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes in seconds
  const [isResending, setIsResending] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('123456');
  const inputRefs = useRef([]);

  // Auto focus first OTP input when switching to OTP view
  useEffect(() => {
    if (authStep === 'otp') {
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [authStep]);

  // Countdown timer for OTP
  useEffect(() => {
    let interval = null;
    if (authStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authStep, otpTimer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // OTP inputs key navigation & entry
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const char = cleaned.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    if (otpStatus) setOtpStatus(null);

    // Auto advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);
    if (otpStatus) setOtpStatus(null);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // 1. Check admin credentials (admin123@gmail.com / admin123)
    if (activeTab === 'masuk' && email.trim().toLowerCase() === 'admin123@gmail.com' && password === 'admin123') {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess({ role: 'admin', email: 'admin123@gmail.com' });
        }
      }, 500);
      return;
    }

    // 2. Handle Login
    if (activeTab === 'masuk') {
      try {
        const response = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Email atau password salah');
        }

        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          if (onLoginSuccess) {
            onLoginSuccess({ role: 'warga', ...data.user });
          } else {
            onBackToHome();
          }
        }, 500);
      } catch (err) {
        console.error(err);
        if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
          // Backend offline fallback simulation
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            if (onLoginSuccess) {
              onLoginSuccess({ role: 'warga', email: email || 'warga@sukamaju.id', full_name: 'Warga Sukamaju' });
            } else {
              onBackToHome();
            }
          }, 500);
        } else {
          setErrorMessage(err.message);
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. Handle Registration -> Proceed to OTP Step
    if (!fullName.trim()) {
      setErrorMessage('Nama Lengkap wajib diisi');
      setIsLoading(false);
      return;
    }
    if (noKK.trim().length !== 16) {
      setErrorMessage('Nomor Kartu Keluarga (KK) harus 16 digit angka');
      setIsLoading(false);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Format email tidak valid');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password minimal 6 karakter');
      setIsLoading(false);
      return;
    }

    // Generate fallback OTP for dev/testing in case SMTP/backend is offline
    const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(fallbackOtp);

    try {
      // Backend /api/auth/register will register the user and generate OTP
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 400) {
        // If email already exists, might allow continuing to OTP or show error
        console.warn('Backend register status:', response.status, data);
      }
    } catch (err) {
      console.warn('Backend offline, using simulated OTP:', fallbackOtp, err);
    } finally {
      setIsLoading(false);
      setAuthStep('otp');
      setOtp(['', '', '', '', '', '']);
      setOtpTimer(300);
      setOtpStatus(null);
    }
  };

  // OTP Verification Handler
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6) {
      setOtpStatus({
        type: 'error',
        message: 'Silakan masukkan 6 digit kode OTP secara lengkap.',
      });
      return;
    }

    setIsLoading(true);
    setOtpStatus(null);

    try {
      const res = await fetch('http://localhost:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: enteredOtp }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        setOtpStatus({
          type: 'success',
          message: 'Verifikasi berhasil! Selamat datang di SampahPintar.',
        });
        setTimeout(() => {
          setIsLoading(false);
          if (onLoginSuccess) {
            onLoginSuccess({
              role: 'warga',
              ...(data.user || {}),
              email: email.trim(),
              full_name: fullName.trim(),
            });
          } else {
            onBackToHome();
          }
        }, 600);
        return;
      } else {
        // Check fallback if simulated OTP matches
        if (enteredOtp === simulatedOtp) {
          setOtpStatus({
            type: 'success',
            message: 'Verifikasi berhasil! Mengalihkan ke dashboard warga...',
          });
          setTimeout(() => {
            setIsLoading(false);
            if (onLoginSuccess) {
              onLoginSuccess({
                role: 'warga',
                email: email.trim(),
                full_name: fullName.trim() || 'Warga Sukamaju',
                noKK: noKK.trim(),
                total_poin: 0,
              });
            } else {
              onBackToHome();
            }
          }, 600);
          return;
        } else {
          throw new Error(data.detail || 'Kode OTP salah atau telah kadaluwarsa');
        }
      }
    } catch (err) {
      if (enteredOtp === simulatedOtp) {
        setOtpStatus({
          type: 'success',
          message: 'Verifikasi berhasil! Mengalihkan ke dashboard warga...',
        });
        setTimeout(() => {
          setIsLoading(false);
          if (onLoginSuccess) {
            onLoginSuccess({
              role: 'warga',
              email: email.trim(),
              full_name: fullName.trim() || 'Warga Sukamaju',
              noKK: noKK.trim(),
              total_poin: 0,
            });
          } else {
            onBackToHome();
          }
        }, 600);
      } else {
        setOtpStatus({
          type: 'error',
          message: err.message || 'Kode OTP salah. Silakan periksa kembali.',
        });
        setIsLoading(false);
      }
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    setIsResending(true);
    setOtpStatus(null);
    const newFallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(newFallbackOtp);

    try {
      await fetch('http://localhost:8000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
    } catch (e) {
      console.warn('Backend offline, simulated OTP renewed:', newFallbackOtp, e);
    } finally {
      setIsResending(false);
      setOtp(['', '', '', '', '', '']);
      setOtpTimer(300);
      setOtpStatus({
        type: 'success',
        message: 'Kode OTP baru telah dikirimkan ke email Anda.',
      });
      if (inputRefs.current[0]) inputRefs.current[0].focus();
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
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                <circle cx="12" cy="10" r="3" />
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

      {/* RIGHT PANEL: Form or OTP Verification */}
      <div className="auth-right-panel">
        {authStep === 'otp' ? (
          /* OTP VERIFICATION VIEW (1:1 with User's Mockup) */
          <div className="auth-otp-wrapper">
            <div className="auth-otp-header">
              <h2 className="auth-otp-title">Masukan kode OTP</h2>
              <p className="auth-otp-subtitle">
                Masukan kode OTP yang terkirim di email <span className="otp-email-highlight">{email || 'testes@gmail.com'}</span>
              </p>
              <div className="auth-otp-expiry">
                Kode berlaku selama 5 menit {otpTimer > 0 && `(${formatTimer(otpTimer)})`}
              </div>
            </div>

            {otpStatus && (
              <div className={`auth-otp-feedback ${otpStatus.type}`}>
                {otpStatus.message}
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div className="auth-otp-inputs-row" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className={`auth-otp-digit ${digit ? 'has-value' : ''} ${otpStatus?.type === 'error' ? 'error' : ''}`}
                  id={`otp-input-${index}`}
                  aria-label={`Digit OTP ke-${index + 1}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {/* Submit Confirmation CTA */}
            <button
              type="button"
              className="btn-otp-submit"
              onClick={handleVerifyOtp}
              disabled={isLoading}
              id="btn-otp-confirm"
            >
              <span>{isLoading ? 'Memproses...' : 'Konfirmasi'}</span>
            </button>

            {/* Resend OTP Link */}
            <button
              type="button"
              className="btn-otp-resend"
              onClick={handleResendOtp}
              disabled={isResending}
              id="btn-otp-resend"
            >
              {isResending ? 'Mengirim ulang...' : 'Kirim ulang OTP'}
            </button>

            {/* Option to change registration details */}
            <button
              type="button"
              className="auth-otp-back-link"
              onClick={() => {
                setAuthStep('form');
                setOtpStatus(null);
              }}
              id="btn-otp-back-form"
            >
              ← Ubah data pendaftaran
            </button>

            {/* Copyright Info - Placed inside wrapper */}
            <div className="auth-copyright" style={{ marginTop: '48px' }}>
              &copy; 2025 Dinas Lingkungan Hidup · SampahPintar v2.4.1
            </div>
          </div>
        ) : (
          /* FORM VIEW: Daftar or Masuk */
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
              {errorMessage && (
                <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {errorMessage}
                </div>
              )}
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
                    placeholder="Minimal 6 karakter"
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
                disabled={isSuccess || isLoading}
                id="auth-submit-btn"
              >
                <span>
                  {isLoading
                    ? 'Memproses...'
                    : (activeTab === 'daftar' ? 'Buat Akun & Masuk' : 'Masuk ke Dashboard')}
                </span>
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

            {/* Copyright Info - Placed inside wrapper at original place */}
            <div className="auth-copyright">
              &copy; 2025 Dinas Lingkungan Hidup · SampahPintar v2.4.1
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
