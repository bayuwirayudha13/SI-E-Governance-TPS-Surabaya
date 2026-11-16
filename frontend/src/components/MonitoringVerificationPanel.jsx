import React, { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../api/client";
import { petugasTpsApi } from "../api/petugasTps";
import "./MonitoringVerificationPanel.css";

const getErrorMessage = (error) =>
  error?.response?.data?.detail || error?.message || "Terjadi kesalahan saat menghubungi server.";

const formatDate = (value) => {
  if (!value) return "Tidak tersedia";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("id-ID");
};

const getPhotoUrl = (path) =>
  path?.startsWith("http") ? path : `${API_BASE_URL}${path || ""}`;

export default function MonitoringVerificationPanel() {
  const [reports, setReports] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyReportId, setBusyReportId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPendingReports = useCallback(async () => {
    try {
      const data = await petugasTpsApi.getPendingReports();
      if (!Array.isArray(data)) {
        throw new Error("Format daftar laporan dari server tidak valid.");
      }
      setReports(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadInitialReports = async () => {
      try {
        const data = await petugasTpsApi.getPendingReports();
        if (!Array.isArray(data)) {
          throw new Error("Format daftar laporan dari server tidak valid.");
        }
        if (active) setReports(data);
      } catch (requestError) {
        if (active) {
          setError(getErrorMessage(requestError));
          setReports([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadInitialReports();
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setError("");
    setNotice("");
    loadPendingReports();
  };

  const handleApprove = async (reportId) => {
    setBusyReportId(reportId);
    setError("");
    setNotice("");
    try {
      await petugasTpsApi.approveReport(reportId);
      setNotice("Laporan disetujui. Kapasitas resmi TPS diperbarui.");
      await loadPendingReports();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyReportId(null);
    }
  };

  const handleReject = async (event, reportId) => {
    event.preventDefault();
    const reason = (rejectionReasons[reportId] || "").trim();
    if (!reason) {
      setError("Alasan penolakan wajib diisi.");
      return;
    }

    setBusyReportId(reportId);
    setError("");
    setNotice("");
    try {
      await petugasTpsApi.rejectReport(reportId, reason);
      setNotice("Laporan ditolak. Kapasitas resmi TPS tidak berubah.");
      await loadPendingReports();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyReportId(null);
    }
  };

  return (
    <section className="monitoring-verification">
      <header className="monitoring-verification__header">
        <div>
          <h2>Verifikasi Monitoring TPS</h2>
          <p>Periksa data dan foto sebelum menyetujui atau menolak laporan petugas.</p>
        </div>
        <button type="button" onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? "Memuat..." : "Muat ulang"}
        </button>
      </header>

      {error && <div role="alert" className="monitoring-verification__alert is-error">{error}</div>}
      {notice && <div role="status" className="monitoring-verification__alert is-success">{notice}</div>}

      {isLoading ? (
        <p className="monitoring-verification__empty" role="status">Memuat laporan dari server...</p>
      ) : reports.length === 0 ? (
        <p className="monitoring-verification__empty">Tidak ada laporan yang menunggu verifikasi.</p>
      ) : (
        <div className="monitoring-verification__list">
          {reports.map((report) => (
            <article className="monitoring-verification__card" key={report.id}>
              <div className="monitoring-verification__details">
                <div className="monitoring-verification__title">
                  <h3>{report.tps_nama || `TPS ID ${report.tps_id}`}</h3>
                  <span>Menunggu Verifikasi</span>
                </div>
                <dl>
                  <div><dt>Petugas</dt><dd>{report.petugas_nama || `ID ${report.petugas_id}`}</dd></div>
                  <div><dt>Waktu monitoring</dt><dd>{formatDate(report.waktu_monitoring)}</dd></div>
                  <div><dt>Volume aktual</dt><dd>{report.volume_aktual_m3} m³</dd></div>
                  <div><dt>Kapasitas terisi</dt><dd>{report.persentase_kapasitas}%</dd></div>
                </dl>
                {report.catatan_kondisi && (
                  <p className="monitoring-verification__notes">{report.catatan_kondisi}</p>
                )}
              </div>

              {report.foto_url ? (
                <a
                  className="monitoring-verification__photo"
                  href={getPhotoUrl(report.foto_url)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Buka foto kondisi ${report.tps_nama || `TPS ${report.tps_id}`}`}
                >
                  <img src={getPhotoUrl(report.foto_url)} alt={`Kondisi ${report.tps_nama || `TPS ${report.tps_id}`}`} />
                  <span>Buka foto</span>
                </a>
              ) : (
                <div className="monitoring-verification__no-photo">Tidak ada foto</div>
              )}

              <form className="monitoring-verification__actions" onSubmit={(event) => handleReject(event, report.id)}>
                <label htmlFor={`reject-reason-${report.id}`}>Alasan penolakan</label>
                <textarea
                  id={`reject-reason-${report.id}`}
                  value={rejectionReasons[report.id] || ""}
                  onChange={(event) => setRejectionReasons((previous) => ({
                    ...previous,
                    [report.id]: event.target.value,
                  }))}
                  placeholder="Jelaskan alasan jika laporan ditolak"
                  rows={3}
                />
                <div>
                  <button
                    type="button"
                    className="is-approve"
                    disabled={busyReportId !== null}
                    onClick={() => handleApprove(report.id)}
                  >
                    {busyReportId === report.id ? "Menyimpan..." : "Setujui"}
                  </button>
                  <button
                    type="submit"
                    className="is-reject"
                    disabled={busyReportId !== null}
                  >
                    {busyReportId === report.id ? "Menyimpan..." : "Tolak"}
                  </button>
                </div>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
