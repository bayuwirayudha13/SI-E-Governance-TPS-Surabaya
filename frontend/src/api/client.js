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
    const token = sessionStorage.getItem('access_token');
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
  getToken: () => sessionStorage.getItem('access_token'),
  
  getCurrentUser: () => {
    try {
      const user = sessionStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  setSession: (token, user) => {
    if (token) sessionStorage.setItem('access_token', token);
    if (user) sessionStorage.setItem('auth_user', JSON.stringify(user));
    window.dispatchEvent(new Event('auth:change'));
  },

  clearSession: () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('user_id');
    window.dispatchEvent(new Event('auth:change'));
  },

  isAuthenticated: () => {
    const token = sessionStorage.getItem('access_token');
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
      if (cleanEmail === 'admin123@gmail.com' && password === 'admin123') {
        const demoAdmin = { role: 'admin', email: 'admin123@gmail.com', name: 'Dr. Ir. Hendro, M.T.' };
        authService.setSession('demo-token-admin', demoAdmin);
        return { access_token: 'demo-token-admin', user: demoAdmin };
      }

      if (
        cleanEmail === 'petugas@kelurahan.go.id' ||
        cleanEmail === 'hendra@petugas.go.id' ||
        cleanEmail === 'petugas123@gmail.com' ||
        (cleanEmail === 'hendra' && password === 'petugas123')
      ) {
        const demoPetugas = { role: 'petugas', email: cleanEmail, name: 'Hendra' };
        authService.setSession('demo-token-petugas', demoPetugas);
        return { access_token: 'demo-token-petugas', user: demoPetugas };
      }

      // Fallback demo warga if backend offline and credentials match demo
      if (password === 'password123' || password === 'warga123') {
        const demoWarga = { role: 'warga', email: 'bayuwirayudha84@gmail.com', name: 'Budi Susanto', id: 19 };
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
