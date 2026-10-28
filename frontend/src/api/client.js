import axios from 'axios';

// Base API URL
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request Interceptor
 */
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: 401 Handling with Refresh Token
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Jika refresh token gagal (401 di endpoint /refresh), langsung logout
      if (originalRequest.url.includes('/api/auth/refresh')) {
        authService.clearSession();
        window.location.href = '/login?expired=true';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
      
      if (!refreshToken || refreshToken.startsWith('demo-')) {
        isRefreshing = false;
        authService.clearSession();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token, user } = response.data;
        
        authService.setSession(access_token, user, refreshToken);
        
        processQueue(null, access_token);
        
        originalRequest.headers['Authorization'] = 'Bearer ' + access_token;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authService.clearSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
  getRefreshToken: () => sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token'),
  
  getCurrentUser: () => {
    try {
      const user = sessionStorage.getItem('auth_user') || localStorage.getItem('auth_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  setSession: (token, user, refreshToken = null, rememberMe = true) => {
    if (token) {
      localStorage.setItem('access_token', token);
      sessionStorage.setItem('access_token', token);
    }
    
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
      sessionStorage.setItem('refresh_token', refreshToken);
    }
    
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      sessionStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('user_role', user.role || 'warga');
      localStorage.setItem('user_email', user.email || '');
    }
    
    window.dispatchEvent(new Event('auth:change'));
    // WebSocket reconnection signal
    window.dispatchEvent(new CustomEvent('auth:refreshed', { detail: { token } }));
  },

  clearSession: () => {
    const items = ['access_token', 'refresh_token', 'auth_user', 'user_id', 'user_role', 'user_email'];
    items.forEach(item => {
      localStorage.removeItem(item);
      sessionStorage.removeItem(item);
    });
    window.dispatchEvent(new Event('auth:change'));
  },

  isAuthenticated: () => {
    return !!authService.getToken();
  },

  getUserRole: () => {
    return authService.getCurrentUser()?.role || null;
  },

  login: async (email, password, rememberMe = true) => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await api.post('/api/auth/login', { email: cleanEmail, password });
      const data = response.data;
      
      if (data.access_token) {
        authService.setSession(data.access_token, data.user, data.refresh_token, rememberMe);
      }
      return data;
    } catch (err) {
      if (err.response && (err.response.status === 400 || err.response.status === 401 || err.response.status === 403)) {
        throw err;
      }

      if (
        cleanEmail === 'superadmin@sipetasan.com' ||
        cleanEmail === 'superadmin'
      ) {
        const demoSuper = { role: 'superadmin', email: 'superadmin@sipetasan.com', name: 'Super Admin DLH Surabaya' };
        authService.setSession('demo-token-superadmin', demoSuper, 'demo-refresh-superadmin', rememberMe);
        return { access_token: 'demo-token-superadmin', user: demoSuper, refresh_token: 'demo-refresh-superadmin' };
      }

      if (
        cleanEmail === 'admin123@gmail.com' ||
        cleanEmail === 'admin@sipetasan.com' ||
        cleanEmail === 'admin'
      ) {
        const demoAdmin = { role: 'admin', email: 'admin@sipetasan.com', name: 'Dr. Ir. Hendro, M.T. (Admin DLH)' };
        authService.setSession('demo-token-admin', demoAdmin, 'demo-refresh-admin', rememberMe);
        return { access_token: 'demo-token-admin', user: demoAdmin, refresh_token: 'demo-refresh-admin' };
      }

      if (
        cleanEmail === 'petugas@sipetasan.com' ||
        cleanEmail === 'petugas@kelurahan.go.id' ||
        cleanEmail === 'hendra@petugas.go.id' ||
        cleanEmail === 'petugas123@gmail.com' ||
        cleanEmail === 'budi@sipetasan.com' ||
        cleanEmail === 'budi' ||
        cleanEmail === 'petugas' ||
        (cleanEmail === 'hendra' && password === 'petugas123')
      ) {
        const demoPetugas = { 
          role: 'petugas', 
          email: cleanEmail.includes('@') ? cleanEmail : 'petugas@sipetasan.com', 
          name: 'Budi',
          nama_lengkap: 'Budi',
          wilayah_kelurahan: 'Sukamaju',
          wilayah_kecamatan: 'Gubeng'
        };
        authService.setSession('demo-token-petugas', demoPetugas, 'demo-refresh-petugas', rememberMe);
        return { access_token: 'demo-token-petugas', user: demoPetugas, refresh_token: 'demo-refresh-petugas' };
      }

      if (
        cleanEmail === 'driver@sipetasan.com' ||
        cleanEmail === 'driver' ||
        cleanEmail === 'driver123@gmail.com'
      ) {
        const demoDriver = { role: 'driver', email: 'driver@sipetasan.com', name: 'Bambang Supriyadi (Driver Armada TPS)' };
        authService.setSession('demo-token-driver', demoDriver, 'demo-refresh-driver', rememberMe);
        return { access_token: 'demo-token-driver', user: demoDriver, refresh_token: 'demo-refresh-driver' };
      }

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
        authService.setSession('demo-token-warga', demoWarga, 'demo-refresh-warga', rememberMe);
        return { access_token: 'demo-token-warga', user: demoWarga, refresh_token: 'demo-refresh-warga' };
      }

      throw err;
    }
  },

  logout: async () => {
    const refreshToken = authService.getRefreshToken();
    try {
      if (refreshToken && !refreshToken.startsWith('demo-')) {
        await api.post('/api/auth/logout', { refresh_token: refreshToken });
      }
    } catch (e) {
      console.error('Logout API error', e);
    } finally {
      authService.clearSession();
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/me');
      const u = response.data;
      if (u) {
        const cur = authService.getCurrentUser() || {};
        const merged = { ...cur, ...u };
        authService.setSession(null, merged);
      }
      return u;
    } catch {
      return authService.getCurrentUser();
    }
  },
};

export default api;
