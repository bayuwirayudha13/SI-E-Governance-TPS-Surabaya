import axios from 'axios';

// Base API URL with environment variable support
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
 * Automatically attaches JWT Bearer token from localStorage
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
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
      // If 401 Unauthorized, clear stored token and notify
      if (error.response.status === 401) {
        console.warn('[API] Sesi login telah berakhir atau token tidak valid.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Centralized Authentication & Storage Helper Service
 */
export const authService = {
  getToken: () => localStorage.getItem('access_token'),
  
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  setSession: (token, user) => {
    if (token) localStorage.setItem('access_token', token);
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    window.dispatchEvent(new Event('auth:change'));
  },

  clearSession: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_id');
    window.dispatchEvent(new Event('auth:change'));
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    const user = authService.getCurrentUser();
    return Boolean(token || user);
  },

  getUserRole: () => {
    const user = authService.getCurrentUser();
    return user?.role || null;
  },

  // API Call: Login
  login: async (email, password) => {
    // 1. Check local demo accounts first for seamless offline presentation
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin123@gmail.com' && password === 'admin123') {
      const demoAdmin = { role: 'admin', email: 'admin123@gmail.com', name: 'Dr. Ir. Hendro, M.T.' };
      authService.setSession('demo-token-admin', demoAdmin);
      return { access_token: 'demo-token-admin', user: demoAdmin };
    }

    if (
      cleanEmail === 'petugas@kelurahan.go.id' ||
      cleanEmail === 'hendra@petugas.go.id' ||
      cleanEmail === 'petugas123@gmail.com' ||
      (cleanEmail.includes('petugas') && password === 'petugas123') ||
      (cleanEmail === 'hendra' && password === 'petugas123')
    ) {
      const demoPetugas = { role: 'petugas', email: cleanEmail, name: 'Hendra' };
      authService.setSession('demo-token-petugas', demoPetugas);
      return { access_token: 'demo-token-petugas', user: demoPetugas };
    }

    // 2. Real Backend API Login
    try {
      const response = await api.post('/api/auth/login', { email: cleanEmail, password });
      const data = response.data;
      if (data.access_token) {
        authService.setSession(data.access_token, data.user || { role: 'warga', email: cleanEmail });
      }
      return data;
    } catch (err) {
      // Fallback demo warga if backend offline and credentials match demo
      if (password === 'password123' || password === 'warga123') {
        const demoWarga = { role: 'warga', email: cleanEmail, name: 'Pak Jaka Susanto', id: 1 };
        authService.setSession('demo-token-warga', demoWarga);
        return { access_token: 'demo-token-warga', user: demoWarga };
      }
      throw err;
    }
  },

  // API Call: Get Current Profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch {
      return authService.getCurrentUser();
    }
  },
};

export default api;
