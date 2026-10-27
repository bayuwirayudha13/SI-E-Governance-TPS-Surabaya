import axios from 'axios';

// Base API URL with environment variable support
const API_BASE_URL = 'http://localhost:8000';

/**
 * Configured Axios instance for SI-PETASAN
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor:
 * Automatically attaches JWT Bearer token from sessionStorage
 */
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Standardizes error responses and handles 401 Unauthorized
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // If 401 Unauthorized, log but don't dispatch logout event
      // This prevents accidental logouts from notification requests
      if (error.response.status === 401) {
        console.warn('[API] Request unauthorized (401) - token may have expired');
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Centralized Authentication & Storage Helper Service
 */
export const authService = {
  getToken: () => sessionStorage.getItem('access_token') || localStorage.getItem('access_token'),
  
  getCurrentUser: () => {
    try {
      const user = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  setSession: (token, user) => {
    if (token) {
      sessionStorage.setItem('access_token', token);
      localStorage.setItem('access_token', token);
    }
    if (user) {
      sessionStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('user_role', user.role || 'warga');
      localStorage.setItem('user_email', user.email || '');
    }
    window.dispatchEvent(new Event('auth:change'));
  },

  clearSession: () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('user_id');
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    window.dispatchEvent(new Event('auth:change'));
  },

  isAuthenticated: () => {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    return Boolean(token || user);
  },

  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },

  // API Call: Login
  login: async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Selalu utamakan login ke Backend API sesungguhnya
    try {
      const response = await api.post('/api/auth/login', { email: cleanEmail, password });
      const data = response.data;
      if (data.access_token) {
        authService.setSession(data.access_token, data.user || { role: 'warga', email: cleanEmail });
      }
      return data;
    } catch (err) {
      // Jika backend merespon error validasi atau kredensial salah (400, 401, 403), jangan fallback demo
      if (err.response && (err.response.status === 400 || err.response.status === 401 || err.response.status === 403)) {
        throw err;
      }

      // 2. Demo fallback HANYA jika backend offline/tidak terhubung
      if (
        cleanEmail === 'superadmin@sipetasan.com' ||
        cleanEmail === 'superadmin'
      ) {
        const demoSuper = { role: 'superadmin', email: 'superadmin@sipetasan.com', name: 'Super Admin DLH Surabaya' };
        authService.setSession('demo-token-superadmin', demoSuper);
        return { access_token: 'demo-token-superadmin', user: demoSuper };
      }

      if (
        cleanEmail === 'admin123@gmail.com' ||
        cleanEmail === 'admin@sipetasan.com' ||
        cleanEmail === 'admin'
      ) {
        const demoAdmin = { role: 'admin', email: 'admin@sipetasan.com', name: 'Dr. Ir. Hendro, M.T. (Admin DLH)' };
        authService.setSession('demo-token-admin', demoAdmin);
        return { access_token: 'demo-token-admin', user: demoAdmin };
      }

      if (
        cleanEmail === 'petugas@sipetasan.com' ||
        cleanEmail === 'petugas@kelurahan.go.id' ||
        cleanEmail === 'hendra@petugas.go.id' ||
        cleanEmail === 'petugas123@gmail.com' ||
        cleanEmail === 'petugas' ||
        (cleanEmail === 'hendra' && password === 'petugas123')
      ) {
        const demoPetugas = { role: 'petugas', email: cleanEmail.includes('@') ? cleanEmail : 'petugas@sipetasan.com', name: 'Petugas TPS - Hendra' };
        authService.setSession('demo-token-petugas', demoPetugas);
        return { access_token: 'demo-token-petugas', user: demoPetugas };
      }

      if (
        cleanEmail === 'driver@sipetasan.com' ||
        cleanEmail === 'driver' ||
        cleanEmail === 'driver123@gmail.com'
      ) {
        const demoDriver = { role: 'driver', email: 'driver@sipetasan.com', name: 'Bambang Supriyadi (Driver Armada TPS)' };
        authService.setSession('demo-token-driver', demoDriver);
        return { access_token: 'demo-token-driver', user: demoDriver };
      }

      // Fallback demo warga if backend offline and credentials match demo
      if (
        cleanEmail === 'warga@sipetasan.com' ||
        cleanEmail === 'warga' ||
        password === 'password123' ||
        password === 'warga123'
      ) {
        const demoWarga = {
          role: 'warga',
          email: cleanEmail.includes('@') ? cleanEmail : 'warga@sipetasan.com',
          nama_lengkap: 'Budi Santoso',
          kelurahan: 'Tembok Dukuh',
          kecamatan: 'Bubutan',
          id: 19
        };
        authService.setSession('demo-token-warga', demoWarga);
        return { access_token: 'demo-token-warga', user: demoWarga };
      }
      throw err;
    }
  },

  // API Call: Get Current Profile (sinkron wilayah petugas biar hijau live)
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/me');
      const u = response.data;
      if (u) {
        // merge ke auth_user biar PetugasPanel langsung baca wilayah terbaru
        const cur = authService.getCurrentUser() || {};
        const merged = { ...cur, ...u, wilayah_kecamatan: u.wilayah_kecamatan ?? cur.wilayah_kecamatan, wilayah_kelurahan: u.wilayah_kelurahan ?? cur.wilayah_kelurahan, wilayah_kota: u.wilayah_kota ?? cur.wilayah_kota };
        sessionStorage.setItem('auth_user', JSON.stringify(merged));
        window.dispatchEvent(new Event('auth:change'));
      }
      return u;
    } catch {
      return authService.getCurrentUser();
    }
  },
};

export default api;
