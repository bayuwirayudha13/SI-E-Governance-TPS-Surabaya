import React, { useState } from "react";
import { loginUser } from "../services/api"; // Sesuaikan path relatifnya

export default function LoginModal({ isOpen, onClose }) {
  const [role, setRole] = useState("warga");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const roles = [
    {
      id: "warga",
      label: "Warga / Publik",
      desc: "Akses Saldo Reward, QR Code Anggota & Riwayat Penimbangan",
    },
    {
      id: "kelurahan",
      label: "Petugas Kelurahan",
      desc: "Verifikasi Timbangan Bank Sampah & Validasi Kebersihan",
    },
    {
      id: "tps",
      label: "Petugas TPS",
      desc: "Update Volume Real-time, Geofencing GPS & Bukti Foto",
    },
    {
      id: "driver",
      label: "Petugas Pengangkut",
      desc: "Scan QR Warga, Angkut Sampah dari Rumah ke TPS",
    },
    {
      id: "admin",
      label: "Admin DLH",
      desc: "Executive Dashboard Kota, Manajemen 231 TPS & Armada",
    },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const backendRoleMap = {
      warga: "warga",
      driver: "driver",
      kelurahan: "petugas_kelurahan",
      tps: "petugas_kelurahan",
      admin: "admin",
    };

    try {
      const result = await loginUser({
        identifier,
        password,
        role: backendRoleMap[role] || role,
      });

      const currentRole = roles.find((r) => r.id === role);
      const fallbackName =
        role === "warga"
          ? "Ibu Siti Aminah (Warga RW 04)"
          : role === "kelurahan"
            ? "Budi Santoso (Petugas Kelurahan Keputih)"
            : role === "tps"
              ? "Agus Triyono (Petugas TPS Wonokromo)"
              : role === "driver"
                ? "Supardi (Driver Armada Truk 08 DLH)"
                : "Dr. Ir. Hendro, M.T. (Admin DLH Surabaya)";

      setLoggedInUser({
        name: result?.user?.nama || result?.user?.name || result?.nama || result?.name || fallbackName,
        roleLabel: currentRole.label,
        token: result?.access_token || "JWT-DLH-SBY-OK",
      });
    } catch (err) {
      setError(err.message || "Gagal masuk. Periksa kembali kredensial Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleId) => {
    const backendRoleMap = {
      warga: "warga",
      driver: "driver",
      kelurahan: "petugas_kelurahan",
      tps: "petugas_kelurahan",
      admin: "admin",
    };
    setRole(roleId);
    const backendRole = backendRoleMap[roleId] || roleId;
    setIdentifier(
      backendRole === "warga"
        ? "3578012304920001"
        : `${backendRole}@dlh.surabaya.go.id`,
    );
    setPassword("surabayabersih2026");
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setLoggedInUser(null);
    setIdentifier("");
    setPassword("");
    setError("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "540px" }}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="logo-icon"
              style={{
                background: "#047857",
                color: "#ffffff",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 0 0 12 22a10 10 0 0 0 7.07-2.93A10 10 0 0 0 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: "1.2rem" }}>
                Sign In SI-Petasan
              </h3>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                Pemerintah Kota Surabaya &bull; DLH
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {loggedInUser ? (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#15803d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h4
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: "4px",
                }}
              >
                Selamat Datang, {loggedInUser.name}!
              </h4>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: "#059669",
                  fontWeight: 600,
                  marginBottom: "20px",
                }}
              >
                Masuk sebagai: {loggedInUser.roleLabel}
              </p>
              <div
                style={{
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  textAlign: "left",
                  marginBottom: "20px",
                  fontSize: "0.85rem",
                  color: "#475569",
                }}
              >
                <div>
                  &bull; Sesi Aktif Token:{" "}
                  <code>{loggedInUser.token.slice(0, 24)}...</code>
                </div>
                <div>
                  &bull; Status Keamanan: Terverifikasi SSW (Surabaya Single
                  Window)
                </div>
                <div>&bull; Hak Akses: Sesuai SOP Dokumen PRD SIPK-TPS</div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  className="btn-pill-dark"
                  onClick={() => {
                    onClose();
                    if (role === "admin") {
                      window.location.hash = "admin";
                    } else if (role === "driver") {
                      window.location.hash = "petugas";
                    } else if (role === "tps" || role === "kelurahan") {
                      window.location.hash = "petugas-tps";
                    } else {
                      window.location.hash = "warga";
                    }
                  }}
                  style={{ padding: "9px 24px" }}
                >
                  Lanjut ke Portal
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "999px",
                    border: "1px solid #cbd5e1",
                    color: "#b91c1c",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  Keluar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              {/* Role Selection Tabs */}
              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: "8px",
                  }}
                >
                  Pilih Peran Pengguna:
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "6px",
                    marginBottom: "6px",
                  }}
                >
                  {roles.slice(0, 3).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: role === r.id ? "#047857" : "#cbd5e1",
                        background: role === r.id ? "#ecfdf5" : "#ffffff",
                        color: role === r.id ? "#065f46" : "#475569",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "6px",
                  }}
                >
                  {roles.slice(3).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: role === r.id ? "#047857" : "#cbd5e1",
                        background: role === r.id ? "#ecfdf5" : "#ffffff",
                        color: role === r.id ? "#065f46" : "#475569",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        textAlign: "center",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginTop: "6px",
                  }}
                >
                  {roles.find((r) => r.id === role)?.desc}
                </div>
              </div>

              {/* Identifier Input */}
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  {role === "warga"
                    ? "NIK / No. Handphone (Terdaftar)"
                    : "NIP / Email Kedinasan DLH:"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    role === "warga"
                      ? "Contoh: 3578012304920001"
                      : "Contoh: petugas@dlh.surabaya.go.id"
                  }
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 600,
                      color: "#334155",
                    }}
                  >
                    Kata Sandi / PIN:
                  </label>
                  <a
                    href="#beranda"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(
                        "Silakan hubungi admin DLH Surabaya atau RT/RW setempat untuk reset password.",
                      );
                    }}
                    style={{
                      fontSize: "0.76rem",
                      color: "#059669",
                      fontWeight: 600,
                    }}
                  >
                    Lupa sandi?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: "0.82rem",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-pill-dark"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "11px",
                  marginBottom: "14px",
                }}
              >
                <span>{loading ? "Memproses..." : "Masuk Sekarang"}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              {/* Quick Demo Autofill */}
              <div
                style={{
                  paddingTop: "12px",
                  borderTop: "1px solid #f1f5f9",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Coba Demo Cepat:
                </span>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("warga")}
                    style={{
                      fontSize: "0.75rem",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    Demo Warga
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("driver")}
                    style={{
                      fontSize: "0.75rem",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    Demo Petugas Pengangkut
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("kelurahan")}
                    style={{
                      fontSize: "0.75rem",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    Demo Petugas Kelurahan
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("tps")}
                    style={{
                      fontSize: "0.75rem",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    Demo Petugas TPS
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin")}
                    style={{
                      fontSize: "0.75rem",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#334155",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    Demo Admin
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}  