import { api } from "./client";

export const petugasTpsApi = {
  // Get TPS assigned to current petugas
  getMyTps: async () => {
    const response = await api.get("/api/petugas-tps/my-tps");
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get("/api/petugas-tps/dashboard-stats");
    return response.data;
  },

  // Get monitoring reports history
  getMyMonitoringReports: async () => {
    const response = await api.get("/api/petugas-tps/monitoring-reports");
    return response.data;
  },

  // Get monitoring reports for specific TPS
  getTpsMonitoringReports: async (tpsId) => {
    const response = await api.get(`/api/petugas-tps/tps/${tpsId}/monitoring-reports`);
    return response.data;
  },

  // Create monitoring report
  createMonitoringReport: async (data) => {
    const formData = new FormData();
    formData.append("tps_id", data.tps_id);
    formData.append("volume_aktual_m3", data.volume_aktual_m3);
    formData.append("persentase_kapasitas", data.persentase_kapasitas);
    if (data.catatan_kondisi) formData.append("catatan_kondisi", data.catatan_kondisi);
    if (data.waktu_monitoring) formData.append("waktu_monitoring", data.waktu_monitoring);
    if (data.foto) formData.append("foto", data.foto);
    
    const response = await api.post("/api/petugas-tps/monitoring-report", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get TPS info
  getTpsInfo: async (tpsId) => {
    const response = await api.get(`/api/petugas-tps/tps-info/${tpsId}`);
    return response.data;
  },
};

export default petugasTpsApi;