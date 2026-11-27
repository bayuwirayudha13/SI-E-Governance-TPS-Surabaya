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
