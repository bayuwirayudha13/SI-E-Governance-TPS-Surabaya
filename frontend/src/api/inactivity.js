/**
 * Helper penyimpanan untuk fitur Auto Logout (Inactivity Timeout) role Warga.
 *
 * State dibagikan antar-tab lewat localStorage:
 *  - LAST_ACTIVITY_KEY    : timestamp (ms) aktivitas pengguna terakhir di tab mana pun
 *  - LOGOUT_BROADCAST_KEY : sinyal logout; perubahan nilainya memicu event `storage` di tab lain
 *
 * File ini sengaja tidak meng-import client.js agar tidak terjadi circular import
 * (client.js memakai LAST_ACTIVITY_KEY pada clearSession).
 */

export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 menit
export const LAST_ACTIVITY_KEY = 'sipetasan_last_activity';
export const LOGOUT_BROADCAST_KEY = 'sipetasan_logout_broadcast';

export const INACTIVITY_LOGOUT_MESSAGE =
  'Sesi Anda telah berakhir karena tidak ada aktivitas selama 1 jam. Silakan login kembali.';

export const readLastActivity = () => {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

export const writeLastActivity = (timestamp = Date.now()) => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
  } catch {
    // storage penuh / diblokir: abaikan
  }
};

export const clearLastActivity = () => {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    // abaikan
  }
};

/**
 * Beritahu tab lain bahwa session berakhir.
 * @param {'inactivity'|'manual'} reason
 */
export const broadcastLogout = (reason) => {
  try {
    localStorage.setItem(
      LOGOUT_BROADCAST_KEY,
      JSON.stringify({ reason, at: Date.now(), nonce: Math.random().toString(36).slice(2) })
    );
  } catch {
    // abaikan
  }
};

export const parseLogoutBroadcast = (rawValue) => {
  try {
    return JSON.parse(rawValue)?.reason || 'manual';
  } catch {
    return 'manual';
  }
};
