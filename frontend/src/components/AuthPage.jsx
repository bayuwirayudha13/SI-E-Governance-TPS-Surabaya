import React, { useState, useEffect, useRef } from 'react';
import { api, authService } from '../api/client';

export default function AuthPage({
  initialTab = 'masuk',
  onBackToHome,
  onLoginSuccess,
}) {
  // =========================================================
  // AUTH STATES
  // =========================================================
  const [activeTab, setActiveTab] = useState(
    initialTab === 'ganti-password' ? 'masuk' : initialTab
  );
  const [authStep, setAuthStep] = useState('form');

  // =========================================================
  // FORGOT PASSWORD STATES
  // =========================================================
  const [forgotPassword, setForgotPassword] = useState(
    initialTab === 'ganti-password'
  );
  const [resetStep, setResetStep] = useState(
    initialTab === 'ganti-password' ? 'password' : 'email'
  );
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] =
    useState(false);

  // =========================================================
  // LOGIN / REGISTER STATES
  // =========================================================
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState('');
  const [noKK, setNoKK] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // =========================================================
  // REGISTRATION OTP STATES
  // =========================================================
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpStatus, setOtpStatus] = useState(null);
  const [otpTimer, setOtpTimer] = useState(300);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef([]);

  // =========================================================
  // AUTO FOCUS REGISTRATION OTP
  // =========================================================
  useEffect(() => {
    if (!forgotPassword && authStep === 'otp') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [authStep, forgotPassword]);

  // =========================================================
  // OTP COUNTDOWN
  // =========================================================
  useEffect(() => {
    const isRegistrationOtp =
      !forgotPassword && authStep === 'otp';

    const isResetOtp =
      forgotPassword && resetStep === 'otp';

    if (!isRegistrationOtp && !isResetOtp) {
      return;
    }

    if (otpTimer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [authStep, forgotPassword, resetStep, otpTimer]);

  // =========================================================
  // FORMAT TIMER
  // =========================================================
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // =========================================================
  // REGISTRATION OTP INPUT
  // =========================================================
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const char = cleaned.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = char;

    setOtp(newOtp);

    if (otpStatus) {
      setOtpStatus(null);
    }

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

    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pasted) return;

    const newOtp = ['', '', '', '', '', ''];

    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }

    setOtp(newOtp);

    if (otpStatus) {
      setOtpStatus(null);
    }

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================
  const handleForgotPassword = () => {
    setForgotPassword(true);

    setResetStep('email');
    setResetEmail('');
    setResetOtp(['', '', '', '', '', '']);

    setNewPassword('');
    setConfirmNewPassword('');

    setOtpStatus(null);
    setErrorMessage('');
    setOtpTimer(300);
  };

  // =========================================================
  // LOGIN / REGISTER SUBMIT
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage('');
    setIsLoading(true);

    // =======================================================
    // LOGIN (Admin, Petugas, & Warga via authService)
    // =======================================================
    if (activeTab === 'masuk') {
      try {
        const data = await authService.login(email.trim(), password);
        setIsSuccess(true);

        setTimeout(() => {
          setIsSuccess(false);
          setIsLoading(false);

          if (onLoginSuccess) {
            onLoginSuccess(data.user || { role: 'warga', email: email.trim() });
          } else {
            onBackToHome();
          }
        }, 500);
      } catch (err) {
        console.error('Login error:', err);
        setErrorMessage(
          err.response?.data?.detail || err.message || 'Gagal login. Pastikan email dan password benar.'
        );
        setIsLoading(false);
      }

      return;
    }

    // =======================================================
    // VALIDASI REGISTER
    // =======================================================
    if (!fullName.trim()) {
      setErrorMessage('Nama Lengkap wajib diisi');
      setIsLoading(false);
      return;
    }

    if (noKK.trim().length !== 16) {
      setErrorMessage(
        'Nomor Kartu Keluarga (KK) harus 16 digit angka'
      );
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

    // =======================================================
    // REGISTER
    // =======================================================
    try {
      const response = await fetch(
        'http://localhost:8000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            full_name: fullName.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Gagal membuat akun'
        );
      }

      // Berhasil register
      setAuthStep('otp');
      setOtp(['', '', '', '', '', '']);

      // Resend pertama tersedia setelah 1 menit
      setOtpTimer(60);

      setOtpStatus({
        type: 'success',
        message:
          'Akun berhasil dibuat. Kode OTP telah dikirim ke email Anda.',
      });
    } catch (err) {
      console.error('Register error:', err);

      setErrorMessage(
        err.message ||
          'Gagal membuat akun. Pastikan backend berjalan.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // VERIFY REGISTRATION OTP
  // =========================================================
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');

    if (enteredOtp.length < 6) {
      setOtpStatus({
        type: 'error',
        message:
          'Silakan masukkan 6 digit kode OTP secara lengkap.',
      });

      return;
    }

    setIsLoading(true);
    setOtpStatus(null);

    try {
      const response = await fetch(
        'http://localhost:8000/api/auth/verify-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            otp: enteredOtp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Kode OTP salah atau telah kadaluwarsa'
        );
      }

      if (data.access_token) {
        localStorage.setItem(
          'access_token',
          data.access_token
        );
      }

      setOtpStatus({
        type: 'success',
        message:
          'Verifikasi berhasil! Mengalihkan ke dashboard warga...',
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
    } catch (err) {
      console.error('Verify OTP error:', err);

      setOtpStatus({
        type: 'error',
        message:
          err.message ||
          'Kode OTP salah. Silakan periksa kembali.',
      });

      setIsLoading(false);
    }
  };

  // =========================================================
  // RESEND REGISTRATION OTP
  // =========================================================
  const handleResendOtp = async () => {
    if (otpTimer > 0) {
      return;
    }

    setIsResending(true);
    setOtpStatus(null);

    try {
      const response = await fetch(
        'http://localhost:8000/api/auth/resend-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Gagal mengirim ulang OTP'
        );
      }

      const cooldown = data.cooldown_seconds || 300;

      setOtpTimer(cooldown);
      setOtp(['', '', '', '', '', '']);

      setOtpStatus({
        type: 'success',
        message:
          'Kode OTP baru telah dikirimkan ke email Anda.',
      });

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error('Resend OTP error:', err);

      setOtpStatus({
        type: 'error',
        message:
          err.message || 'Gagal mengirim ulang OTP.',
      });
    } finally {
      setIsResending(false);
    }
  };

  // =========================================================
  // SEND RESET PASSWORD OTP
  // =========================================================
  const handleSendResetOtp = async () => {
    if (!resetEmail.trim()) {
      setOtpStatus({
        type: 'error',
        message:
          'Silakan masukkan email terlebih dahulu.',
      });

      return;
    }

    setIsLoading(true);
    setOtpStatus(null);

    try {
      const response = await fetch(
        'http://localhost:8000/api/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: resetEmail.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'Gagal mengirim OTP reset password'
        );
      }

      setResetStep('otp');

      setResetOtp([
        '',
        '',
        '',
        '',
        '',
        '',
      ]);

      setOtpTimer(300);

      setOtpStatus({
        type: 'success',
        message:
          'OTP reset password telah dikirim ke email Anda.',
      });
    } catch (err) {
      console.error(
        'Forgot password error:',
        err
      );

      setOtpStatus({
        type: 'error',
        message:
          err.message || 'Gagal mengirim OTP.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // VERIFY RESET PASSWORD OTP
  // =========================================================
  const handleVerifyResetOtp = async () => {
    const enteredOtp = resetOtp.join('');

    if (enteredOtp.length < 6) {
      setOtpStatus({
        type: 'error',
        message:
          'Silakan masukkan 6 digit OTP.',
      });

      return;
    }

    setIsLoading(true);
    setOtpStatus(null);

    try {
      const response = await fetch(
        'http://localhost:8000/api/auth/verify-reset-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: resetEmail.trim(),
            otp: enteredOtp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            'OTP salah atau sudah expired'
        );
      }

      setOtpStatus({
        type: 'success',
        message:
          'OTP berhasil diverifikasi.',
      });

      setResetStep('password');

      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error(
        'Verify reset OTP error:',
        err
      );

      setOtpStatus({
        type: 'error',
        message:
          err.message || 'OTP salah.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // RESET PASSWORD
  // =========================================================
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setOtpStatus({
        type: 'error',
        message:
          'Kata sandi minimal 8 karakter.',
      });

      return;
    }

    if (newPassword !== confirmNewPassword) {
      setOtpStatus({
        type: 'error',
        message:
          'Konfirmasi kata sandi tidak cocok.',
      });

      return;
    }

    setIsLoading(true);
    setOtpStatus(null);

    try {
      const response = await fetch(
        'http://localhost:8000/api/auth/reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: resetEmail.trim(),
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.warn('Backend reset password info:', data);
      }

      setOtpStatus({
        type: 'success',
        message:
          'Kata sandi berhasil diubah! Silakan masuk dengan kata sandi baru.',
      });

      setTimeout(() => {
        setForgotPassword(false);
        setResetStep('email');

        setActiveTab('masuk');

        setResetEmail('');
        setResetOtp([
          '',
          '',
          '',
          '',
          '',
          '',
        ]);

        setNewPassword('');
        setConfirmNewPassword('');

        setOtpStatus(null);
      }, 1500);
    } catch (err) {
      console.error(
        'Reset password error:',
        err
      );

      setOtpStatus({
        type: 'error',
        message:
          err.message ||
          'Gagal mengubah password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // RESET PASSWORD UI
  // =========================================================
  const renderForgotPassword = () => {
    // =======================================================
    // STEP 1 - EMAIL
    // =======================================================
    if (resetStep === 'email') {
      return (
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2 className="auth-form-title">
              Lupa Password?
            </h2>

            <p className="auth-form-subtitle">
              Masukkan email akun kamu untuk
              mendapatkan kode OTP.
            </p>
          </div>

          {otpStatus && (
            <div
              className={`auth-otp-feedback ${otpStatus.type}`}
            >
              {otpStatus.message}
            </div>
          )}

          <div className="auth-form">
            <div className="form-group">
              <label
                className="form-label"
                htmlFor="resetEmail"
              >
                Email
              </label>

              <input
                id="resetEmail"
                type="email"
                required
                placeholder="email@kelurahan.go.id"
                value={resetEmail}
                onChange={(e) =>
                  setResetEmail(e.target.value)
                }
                className="form-input"
              />
            </div>

            <button
              type="button"
              className="btn-auth-submit"
              onClick={handleSendResetOtp}
              disabled={isLoading}
            >
              <span>
                {isLoading
                  ? 'Mengirim OTP...'
                  : 'Kirim Kode OTP'}
              </span>

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <button
            type="button"
            className="auth-otp-back-link"
            onClick={() => {
              setForgotPassword(false);
              setResetStep('email');
              setOtpStatus(null);
            }}
          >
            ← Kembali ke Login
          </button>

          <div className="auth-copyright">
            &copy; 2025 Dinas Lingkungan Hidup ·
            SampahPintar v2.4.1
          </div>
        </div>
      );
    }

    // =======================================================
    // STEP 2 - RESET OTP
    // =======================================================
    if (resetStep === 'otp') {
      return (
        <div className="auth-otp-wrapper">
          <div className="auth-otp-header">
            <h2 className="auth-otp-title">
              Masukkan kode OTP
            </h2>

            <p className="auth-otp-subtitle">
              Masukkan kode OTP yang terkirim ke
              email{' '}
              <span className="otp-email-highlight">
                {resetEmail}
              </span>
            </p>

            <div className="auth-otp-expiry">
              Kode berlaku selama 5 menit{' '}
              {otpTimer > 0 &&
                `(${formatTimer(otpTimer)})`}
            </div>
          </div>

          {otpStatus && (
            <div
              className={`auth-otp-feedback ${otpStatus.type}`}
            >
              {otpStatus.message}
            </div>
          )}

          <div className="auth-otp-inputs-row">
            {resetOtp.map((digit, index) => (
              <input
                key={index}
                id={`reset-otp-input-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\D/g, '')
                    .slice(-1);

                  const newOtp = [
                    ...resetOtp,
                  ];

                  newOtp[index] = value;

                  setResetOtp(newOtp);

                  if (otpStatus) {
                    setOtpStatus(null);
                  }

                  if (
                    value &&
                    index < 5
                  ) {
                    document
                      .getElementById(
                        `reset-otp-input-${index + 1}`
                      )
                      ?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === 'Backspace' &&
                    !resetOtp[index] &&
                    index > 0
                  ) {
                    document
                      .getElementById(
                        `reset-otp-input-${index - 1}`
                      )
                      ?.focus();
                  }

                  if (
                    e.key === 'ArrowLeft' &&
                    index > 0
                  ) {
                    document
                      .getElementById(
                        `reset-otp-input-${index - 1}`
                      )
                      ?.focus();
                  }

                  if (
                    e.key === 'ArrowRight' &&
                    index < 5
                  ) {
                    document
                      .getElementById(
                        `reset-otp-input-${index + 1}`
                      )
                      ?.focus();
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();

                  const pasted = e.clipboardData
                    .getData('text')
                    .replace(/\D/g, '')
                    .slice(0, 6);

                  if (!pasted) return;

                  const newOtp = [
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                  ];

                  for (
                    let i = 0;
                    i < pasted.length;
                    i++
                  ) {
                    newOtp[i] =
                      pasted[i];
                  }

                  setResetOtp(newOtp);

                  const nextIndex = Math.min(
                    pasted.length,
                    5
                  );

                  document
                    .getElementById(
                      `reset-otp-input-${nextIndex}`
                    )
                    ?.focus();
                }}
                className={`auth-otp-digit ${
                  digit
                    ? 'has-value'
                    : ''
                } ${
                  otpStatus?.type ===
                  'error'
                    ? 'error'
                    : ''
                }`}
                aria-label={`Digit OTP ke-${
                  index + 1
                }`}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="button"
            className="btn-otp-submit"
            onClick={handleVerifyResetOtp}
            disabled={isLoading}
          >
            <span>
              {isLoading
                ? 'Memverifikasi...'
                : 'Konfirmasi OTP'}
            </span>
          </button>

          <button
            type="button"
            className="auth-otp-back-link"
            onClick={() => {
              setResetStep('email');

              setResetOtp([
                '',
                '',
                '',
                '',
                '',
                '',
              ]);

              setOtpStatus(null);
            }}
          >
            ← Ganti Email
          </button>

          <div
            className="auth-copyright"
            style={{
              marginTop: '48px',
            }}
          >
            &copy; 2025 Dinas Lingkungan Hidup ·
            SampahPintar v2.4.1
          </div>
        </div>
      );
    }

    // =======================================================
    // STEP 3 - PASSWORD BARU (GANTI KATA SANDI)
    // =======================================================
    return (
      <div className="auth-form-wrapper">
        <div className="auth-form-header">
          <h2 className="auth-form-title">
            Ganti Kata Sandi
          </h2>

          <p className="auth-form-subtitle">
            Buat kata sandi baru yang kuat untuk mengamankan akun Anda
          </p>
        </div>

        {otpStatus && (
          <div
            className={`auth-otp-feedback ${otpStatus.type}`}
          >
            {otpStatus.message}
          </div>
        )}

        <div className="auth-form">
          {/* KATA SANDI BARU */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="newPassword"
            >
              Kata Sandi Baru
            </label>

            <div className="password-input-wrap">
              <input
                id="newPassword"
                type={
                  showNewPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Minimal 8 karakter"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                className="form-input"
              />

              <button
                type="button"
                className="password-toggle-btn"
                onClick={() =>
                  setShowNewPassword(
                    !showNewPassword
                  )
                }
                aria-label={
                  showNewPassword
                    ? 'Sembunyikan password'
                    : 'Lihat password'
                }
              >
                {showNewPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line
                      x1="1"
                      y1="1"
                      x2="23"
                      y2="23"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* KONFIRMASI PASSWORD */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="confirmNewPassword"
            >
              Konfirmasi Kata Sandi Baru
            </label>

            <div className="password-input-wrap">
              <input
                id="confirmNewPassword"
                type={
                  showConfirmNewPassword
                    ? 'text'
                    : 'password'
                }
                placeholder="Ulangi kata sandi baru"
                value={
                  confirmNewPassword
                }
                onChange={(e) =>
                  setConfirmNewPassword(
                    e.target.value
                  )
                }
                className="form-input"
              />

              <button
                type="button"
                className="password-toggle-btn"
                onClick={() =>
                  setShowConfirmNewPassword(
                    !showConfirmNewPassword
                  )
                }
                aria-label={
                  showConfirmNewPassword
                    ? 'Sembunyikan password'
                    : 'Lihat password'
                }
              >
                {showConfirmNewPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line
                      x1="1"
                      y1="1"
                      x2="23"
                      y2="23"
                    />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* RESET PASSWORD BUTTON */}
          <button
            type="button"
            className="btn-auth-submit"
            onClick={handleResetPassword}
            disabled={isLoading}
            id="btn-confirm-ganti-password"
            style={{
              background: '#136c43',
              borderRadius: '10px',
              padding: '14px',
              marginTop: '16px',
            }}
          >
            <span>
              {isLoading
                ? 'Menyimpan...'
                : 'Konfirmasi'}
            </span>

            <span style={{ marginLeft: '4px', fontSize: '1.1rem' }}>
              &rarr;
            </span>
          </button>
        </div>

        {/* Kembali ke Masuk */}
        <button
          type="button"
          className="auth-otp-back-link"
          style={{ marginTop: '16px' }}
          onClick={() => {
            setForgotPassword(false);
            setResetStep('email');
            setOtpStatus(null);
          }}
          id="btn-back-to-login"
        >
          ← Kembali ke Masuk
        </button>

        <div className="auth-copyright">
          &copy; 2025 Dinas Lingkungan Hidup ·
          SampahPintar v2.4.1
        </div>
      </div>
    );
  };

  // =========================================================
  // RETURN
  // =========================================================
  return (
    <div className="auth-page-container">

      {/* =====================================================
          LEFT PANEL
      ====================================================== */}
      <div className="auth-left-panel">

        <div className="ambient-circle ambient-circle-1"></div>
        <div className="ambient-circle ambient-circle-2"></div>
        <div className="ambient-circle ambient-circle-3"></div>

        <div className="auth-left-content">

          {/* BRAND */}
          <div className="auth-brand-badge">
            <div className="auth-brand-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                <circle
                  cx="12"
                  cy="10"
                  r="3"
                />
              </svg>
            </div>

            <div>
              <div className="auth-brand-name">
                SampahPintar
              </div>

              <div className="auth-brand-subtitle">
                Sistem Manajemen Sampah Kelurahan
              </div>
            </div>
          </div>

          {/* HERO */}
          <div className="auth-hero-copy">

            <h1 className="auth-hero-title">
              <span>Kelola Sampah,</span>
              <span>Raih Reward,</span>
              <span>Jaga Bumi</span>
            </h1>

            <p className="auth-hero-desc">
              Bergabunglah dengan ribuan warga
              Kelurahan Sukamaju yang sudah aktif
              memilah sampah dan mendapat poin
              reward.
            </p>

            {/* STATS */}
            <div className="auth-stats-grid">

              <div className="auth-stat-col">
                <div className="auth-stat-number">
                  2.400+
                </div>

                <div className="auth-stat-label">
                  Warga Aktif
                </div>
              </div>

              <div className="auth-stat-col">
                <div className="auth-stat-number">
                  25+
                </div>

                <div className="auth-stat-label">
                  Titik TPS
                </div>
              </div>

              <div className="auth-stat-col">
                <div className="auth-stat-number">
                  58rb
                </div>

                <div className="auth-stat-label">
                  Poin Dibagi
                </div>
              </div>

            </div>
          </div>

          {/* BACK HOME */}
          <div className="auth-bottom-nav">
            <button
              type="button"
              className="btn-back-home"
              onClick={onBackToHome}
              id="auth-back-to-home"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line
                  x1="19"
                  y1="12"
                  x2="5"
                  y2="12"
                />

                <polyline points="12 19 5 12 12 5" />
              </svg>

              <span>
                Kembali ke Beranda
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* =====================================================
          RIGHT PANEL
      ====================================================== */}
      <div className="auth-right-panel">

        {/* ===================================================
            FORGOT PASSWORD
        ==================================================== */}
        {forgotPassword ? (

          renderForgotPassword()

        ) : authStep === 'otp' ? (

          /* =================================================
             REGISTRATION OTP
          ================================================== */
          <div className="auth-otp-wrapper">

            <div className="auth-otp-header">

              <h2 className="auth-otp-title">
                Masukan kode OTP
              </h2>

              <p className="auth-otp-subtitle">
                Masukan kode OTP yang terkirim
                di email{' '}
                <span className="otp-email-highlight">
                  {email}
                </span>
              </p>

              <div className="auth-otp-expiry">
                Kode berlaku selama 5 menit{' '}
                {otpTimer > 0 &&
                  `(${formatTimer(otpTimer)})`}
              </div>

            </div>

            {otpStatus && (
              <div
                className={`auth-otp-feedback ${otpStatus.type}`}
              >
                {otpStatus.message}
              </div>
            )}

            {/* OTP INPUT */}
            <div
              className="auth-otp-inputs-row"
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) =>
                    (inputRefs.current[index] =
                      el)
                  }
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(
                      index,
                      e.target.value
                    )
                  }
                  onKeyDown={(e) =>
                    handleOtpKeyDown(
                      index,
                      e
                    )
                  }
                  className={`auth-otp-digit ${
                    digit
                      ? 'has-value'
                      : ''
                  } ${
                    otpStatus?.type ===
                    'error'
                      ? 'error'
                      : ''
                  }`}
                  id={`otp-input-${index}`}
                  aria-label={`Digit OTP ke-${
                    index + 1
                  }`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {/* CONFIRM */}
            <button
              type="button"
              className="btn-otp-submit"
              onClick={handleVerifyOtp}
              disabled={isLoading}
              id="btn-otp-confirm"
            >
              <span>
                {isLoading
                  ? 'Memproses...'
                  : 'Konfirmasi'}
              </span>
            </button>

            {/* RESEND */}
            <button
              type="button"
              className="btn-otp-resend"
              onClick={handleResendOtp}
              disabled={
                isResending ||
                otpTimer > 0
              }
              id="btn-otp-resend"
            >
              {isResending
                ? 'Mengirim ulang...'
                : otpTimer > 0
                ? `Kirim ulang OTP (${formatTimer(
                    otpTimer
                  )})`
                : 'Kirim ulang OTP'}
            </button>

            {/* BACK */}
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

            <div
              className="auth-copyright"
              style={{
                marginTop: '48px',
              }}
            >
              &copy; 2025 Dinas Lingkungan Hidup ·
              SampahPintar v2.4.1
            </div>

          </div>

        ) : (

          /* =================================================
             LOGIN / REGISTER FORM
          ================================================== */
          <div className="auth-form-wrapper">

            {/* TAB */}
            <div className="auth-toggle-pill">

              <button
                type="button"
                className={`auth-toggle-btn ${
                  activeTab === 'daftar'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('daftar')
                }
                id="tab-toggle-daftar"
              >
                Daftar
              </button>

              <button
                type="button"
                className={`auth-toggle-btn ${
                  activeTab === 'masuk'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  setActiveTab('masuk')
                }
                id="tab-toggle-masuk"
              >
                Masuk
              </button>

            </div>

            {/* HEADER */}
            {activeTab === 'daftar' ? (

              <div className="auth-form-header">
                <h2 className="auth-form-title">
                  Buat Akun Baru
                </h2>

                <p className="auth-form-subtitle">
                  Daftarkan diri untuk mulai
                  memilah sampah &amp; meraih
                  reward.
                </p>
              </div>

            ) : (

              <div className="auth-form-header">
                <h2 className="auth-form-title">
                  Masuk
                </h2>

                <p className="auth-form-subtitle">
                  Masuk ke akun SampahPintar
                  kamu.
                </p>
              </div>

            )}

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="auth-form"
            >

              {errorMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#fee2e2',
                    color: '#b91c1c',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {/* REGISTER ONLY */}
              {activeTab === 'daftar' && (
                <>
                  {/* NAMA */}
                  <div className="form-group">

                    <label
                      className="form-label"
                      htmlFor="fullName"
                    >
                      Nama Lengkap
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      required
                      placeholder="contoh: Budi Santoso"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(
                          e.target.value
                        )
                      }
                      className="form-input"
                    />

                  </div>

                  {/* KK */}
                  <div className="form-group">

                    <label
                      className="form-label"
                      htmlFor="noKK"
                    >
                      Nomor Kartu Keluarga (KK){' '}
                      <span className="required-star">
                        *
                      </span>
                    </label>

                    <input
                      id="noKK"
                      type="text"
                      required
                      maxLength={16}
                      placeholder="16 digit nomor KK"
                      value={noKK}
                      onChange={(e) =>
                        setNoKK(
                          e.target.value.replace(
                            /\D/g,
                            ''
                          )
                        )
                      }
                      className="form-input font-mono"
                    />

                    <div className="form-helper-text">
                      Digunakan untuk verifikasi
                      kependudukan warga
                      kelurahan.
                    </div>

                  </div>
                </>
              )}

              {/* EMAIL */}
              <div className="form-group">

                <label
                  className="form-label"
                  htmlFor="email"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  placeholder="email@kelurahan.go.id"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  className="form-input"
                />

              </div>

              {/* PASSWORD */}
              <div className="form-group">

                <label
                  className="form-label"
                  htmlFor="password"
                >
                  Password
                </label>

                <div className="password-input-wrap">

                  <input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    required
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    className="form-input"
                  />

                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    aria-label={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Lihat password'
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />

                        <line
                          x1="1"
                          y1="1"
                          x2="23"
                          y2="23"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                        />
                      </svg>
                    )}
                  </button>

                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="btn-auth-submit"
                disabled={
                  isSuccess ||
                  isLoading
                }
                id="auth-submit-btn"
              >
                <span>
                  {isLoading
                    ? 'Memproses...'
                    : activeTab === 'daftar'
                    ? 'Buat Akun & Masuk'
                    : 'Masuk ke Dashboard'}
                </span>

                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line
                    x1="5"
                    y1="12"
                    x2="19"
                    y2="12"
                  />

                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

            </form>

            {/* GANTI & LUPA PASSWORD (HANYA MUNCUL DI LOGIN) */}
            {activeTab === 'masuk' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '14px',
                  width: '100%',
                }}
              >
                <button
                  type="button"
                  className="forgot-password-btn"
                  onClick={() => {
                    setForgotPassword(true);
                    setResetStep('password');
                    setOtpStatus(null);
                  }}
                  id="btn-ganti-password"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#136c43',
                    fontSize: '0.86rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '0',
                  }}
                >
                  Ganti Password
                </button>

                <button
                  type="button"
                  className="forgot-password-btn"
                  onClick={handleForgotPassword}
                  id="btn-lupa-password"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.86rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: '0',
                  }}
                >
                  Lupa Password?
                </button>
              </div>
            )}

            {/* SWITCH LOGIN / REGISTER */}
            <div className="auth-switch-link">

              {activeTab === 'daftar' ? (

                <span>
                  Sudah punya akun?{' '}

                  <button
                    type="button"
                    className="switch-link-btn"
                    onClick={() =>
                      setActiveTab(
                        'masuk'
                      )
                    }
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
                    onClick={() =>
                      setActiveTab(
                        'daftar'
                      )
                    }
                  >
                    Daftar sekarang
                  </button>
                </span>

              )}

            </div>

            {/* QUICK DEMO ACCOUNTS */}
            {activeTab === 'masuk' && (
              <div style={{ marginTop: '20px', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Akses Cepat Demo Akun:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('petugas@kelurahan.go.id');
                      setPassword('petugas123');
                    }}
                    style={{ fontSize: '0.75rem', padding: '5px 10px', background: '#0a5c36', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    🚛 Petugas Pengangkut
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin123@gmail.com');
                      setPassword('admin123');
                    }}
                    style={{ fontSize: '0.75rem', padding: '5px 10px', background: '#1e293b', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    ⚙️ Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onLoginSuccess) {
                        onLoginSuccess({ role: 'warga', name: 'Pak Jaka Susanto', id: 1 });
                      }
                    }}
                    style={{ fontSize: '0.75rem', padding: '5px 10px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    👤 Warga
                  </button>
                </div>
              </div>
            )}

            {/* COPYRIGHT */}
            <div className="auth-copyright">
              &copy; 2025 Dinas Lingkungan Hidup ·
              SampahPintar v2.4.1
            </div>

          </div>
        )}

      </div>
    </div>
  );
}