import { API_BASE_URL } from "../api/client";

const API_BASE_URL_V1 = `${API_BASE_URL}/api`;

export async function fetchPublicTps() {
  try {
    const response = await fetch(`${API_BASE_URL_V1}/tps/public`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching public TPS:", error);
    return null;
  }
}

// src/services/api.js
// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL;

export async function loginUser({ identifier, password }) {
  // Petakan input "identifier" dari form LoginModal ke field "email" & "username"
  const payload = {
    email: identifier,
    username: identifier, // Berjaga-jaga jika backend mengecek salah satu dari email/username
    password: password,
  };

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    // Menangani pesan error dari FastAPI (baik string maupun array validasi 422)
    const errorMessage = Array.isArray(data.detail)
      ? data.detail.map((err) => `${err.loc[1]}: ${err.msg}`).join(", ")
      : data.detail || "Gagal login, periksa email dan kata sandi Anda.";
    throw new Error(errorMessage);
  }

  // Simpan token ke localStorage jika backend mengembalikan access_token
  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token);
  }

  return data;
}
