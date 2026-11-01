import { useEffect, useRef } from "react";
import {
  INACTIVITY_TIMEOUT_MS,
  LOGOUT_BROADCAST_KEY,
  broadcastLogout,
  parseLogoutBroadcast,
  readLastActivity,
  writeLastActivity,
} from "./inactivity";

// Hanya event interaksi pengguna. Request API / WebSocket tidak memicu event DOM ini.
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "click",
  "keydown",
  "scroll",
  "wheel",
  "touchstart",
  "pointerdown",
  "pointermove",
];

// Batasi tulisan ke localStorage (mousemove bisa puluhan kali per detik)
const WRITE_THROTTLE_MS = 1000;

/**
 * Auto logout berdasarkan inaktivitas.
 *
 * - Satu setTimeout saja; saat menyala, waktu aktivitas terakhir (localStorage)
 *   dibaca ulang sehingga akurat walau tab di background / timer di-throttle browser.
 * - Aktivitas di tab mana pun memperbarui timestamp bersama.
 * - Sinyal logout dari tab lain diterima lewat event `storage`.
 *
 * @param {object}   options
 * @param {boolean}  options.enabled         aktif hanya untuk role Warga yang sedang login
 * @param {Function} options.onExpire        dipanggil saat tab ini mendeteksi timeout
 * @param {Function} options.onRemoteLogout  dipanggil (reason) saat tab lain logout
 * @param {number}   [options.timeoutMs]
 */
export default function useInactivityLogout({
  enabled,
  onExpire,
  onRemoteLogout,
  timeoutMs = INACTIVITY_TIMEOUT_MS,
}) {
  const onExpireRef = useRef(onExpire);
  const onRemoteLogoutRef = useRef(onRemoteLogout);

  useEffect(() => {
    onExpireRef.current = onExpire;
    onRemoteLogoutRef.current = onRemoteLogout;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let stopped = false;
    let timerId = null;
    let lastWrite = 0;

    const isExpired = (last, now) => last !== null && now - last >= timeoutMs;

    const stop = () => {
      stopped = true;
      if (timerId !== null) clearTimeout(timerId);
      timerId = null;
      cleanup();
    };

    const expire = () => {
      if (stopped) return;
      stop();
      broadcastLogout("inactivity");
      onExpireRef.current?.();
    };

    const schedule = (ms) => {
      if (timerId !== null) clearTimeout(timerId);
      timerId = setTimeout(check, Math.max(ms, 1000));
    };

    // Dipanggil oleh timer, saat tab kembali terlihat, dan saat window fokus
    function check() {
      if (stopped) return;
      const now = Date.now();
      const last = readLastActivity();

      if (last === null) {
        writeLastActivity(now);
        schedule(timeoutMs);
        return;
      }
      if (isExpired(last, now)) {
        expire();
        return;
      }
      // jika jam sistem berubah mundur, jangan menjadwalkan lebih dari timeout
      schedule(Math.min(last + timeoutMs - now, timeoutMs));
    }

    const onActivity = () => {
      if (stopped) return;
      const now = Date.now();
      // Sesi yang sudah lewat batas tidak boleh "dihidupkan lagi" oleh aktivitas
      // yang terjadi sebelum timer sempat berjalan (mis. laptop baru bangun dari sleep).
      if (isExpired(readLastActivity(), now)) {
        expire();
        return;
      }
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      lastWrite = now;
      writeLastActivity(now);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") check();
    };

    const onStorage = (event) => {
      if (event.key === LOGOUT_BROADCAST_KEY && event.newValue) {
        if (stopped) return;
        stop();
        onRemoteLogoutRef.current?.(parseLogoutBroadcast(event.newValue));
      }
    };

    function cleanup() {
      ACTIVITY_EVENTS.forEach((name) =>
        window.removeEventListener(name, onActivity, true),
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
      window.removeEventListener("storage", onStorage);
    }

    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, onActivity, {
        capture: true,
        passive: true,
      }),
    );
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    window.addEventListener("storage", onStorage);

    // Start: sesi lama yang sudah kedaluwarsa langsung diakhiri, selain itu mulai menghitung
    check();

    return () => {
      stopped = true;
      if (timerId !== null) clearTimeout(timerId);
      timerId = null;
      cleanup();
    };
  }, [enabled, timeoutMs]);
}
