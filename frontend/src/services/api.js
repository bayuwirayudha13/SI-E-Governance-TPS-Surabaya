const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchPublicTps() {
  try {
    const response = await fetch(`${API_BASE_URL}/tps/public`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching public TPS:', error);
    return null;
  }
}
