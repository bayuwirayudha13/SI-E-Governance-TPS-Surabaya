import React, { useState, useEffect, useCallback } from "react";
import { fetchAllTps, extractRegionsFromTps } from "../api/tpsStats";
import { API_BASE_URL } from "../api/client";
import TpsMapSuperadmin from "./TpsMapSuperadmin";
import SearchableSelect from "./common/SearchableSelect";
import "./common/SearchableSelect.css";
import {
  IconUsers,
  IconTrendingUp,
  IconAlert,
  IconMegaphone,
  IconBuilding,
  IconGraduationCap,
  IconAnchor,
  IconTree,
  IconMap,
  IconCheck,
  IconCalendar,
} from "./common/AppIcons";

const API_BASE = API_BASE_URL;

export default function SuperadminPanel({
  onLogout,
  currentUser: userFromProp,
}) {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(userFromProp);
  const [users, setUsers] = useState([]);
  const [petugasList, setPetugasList] = useState([]);
  const [tpsList, setTpsList] = useState([]);
  const [jadwals, setJadwals] = useState([]);
  const [laporanList, setLaporanList] = useState([]);
  const [dispatchedTpsList, setDispatchedTpsList] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddJadwalModal, setShowAddJadwalModal] = useState(false);
  const [showAddTpsModal, setShowAddTpsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sipetasan_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sipetasan_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Form states — dropdown kecamatan/kelurahan seperti register warga
  const KEC_DEFAULT = [
    "Asemrowo",
    "Benowo",
    "Bubutan",
    "Bulak",
    "Dukuh Pakis",
    "Gayungan",
    "Genteng",
    "Gubeng",
    "Gunung Anyar",
    "Jambangan",
    "Karang Pilang",
    "Kenjeran",
    "Krembangan",
    "Lakarsantri",
    "Mulyorejo",
    "Pabean Cantian",
    "Pakal",
    "Rungkut",
    "Sambikerep",
    "Sawahan",
    "Semampir",
    "Simokerto",
    "Sukolilo",
    "Sukomanunggal",
    "Tambaksari",
    "Tandes",
    "Tegalsari",
    "Tenggilis Mejoyo",
    "Wiyung",
    "Wonocolo",
    "Wonokromo",
  ];
  const [newUser, setNewUser] = useState({
    nama_lengkap: "",
    email: "",
    password: "",
    role: "petugas_pengangkut",
    wilayah_kecamatan: "",
    wilayah_kelurahan: "",
    foto_url: "",
    tps_ids: [],
  });
  const [editUser, setEditUser] = useState(null); // {id, ...} saat klik Edit (hijau) / View (merah)
  const [viewUser, setViewUser] = useState(null);
  const [kecamatanOptions, setKecamatanOptions] = useState([]);
  const [kelurahanOptions, setKelurahanOptions] = useState([]);
  const [petugasOptions, setPetugasOptions] = useState([]);
  const [jadwalFilterKec, setJadwalFilterKec] = useState("");
  const [jadwalFilterKel, setJadwalFilterKel] = useState("");
  const [tpsOptions, setTpsOptions] = useState([]);
  const [newUserFotoFile, setNewUserFotoFile] = useState(null);
  const [newUserFotoPreview, setNewUserFotoPreview] = useState("");
  const [editFotoFile, setEditFotoFile] = useState(null);
  const [editFotoPreview, setEditFotoPreview] = useState("");
  const [newJadwal, setNewJadwal] = useState({
    hari: "",
    waktu_mulai: "",
    waktu_selesai: "",
    area: "",
    petugas: "",
    petugas_id: null,
    tipe: "Rutin",
    tps_id: null,
    kecamatan: "",
    kelurahan: "",
  });
  const [editingJadwal, setEditingJadwal] = useState(null);
  const [showEditJadwalModal, setShowEditJadwalModal] = useState(false);
  const [newTps, setNewTps] = useState({
    nama: "",
    kecamatan: "",
    wilayah_kota: "Surabaya Pusat",
    lokasi: "",
    jenis_tps: "TPS Resmi",
    latitude: "",
    longitude: "",
    jumlah_container: "",
    daya_tampung_m3: "",
    status: "Aktif",
  });
  const [editingTpsId, setEditingTpsId] = useState(null);
  const [tpsSearchQuery, setTpsSearchQuery] = useState("");
  const [tpsFilterKecamatan, setTpsFilterKecamatan] = useState("");
  const [tpsFilterKelurahan, setTpsFilterKelurahan] = useState("");
  const [tpsFilterCapacity, setTpsFilterCapacity] = useState({
    min: "",
    max: "",
  });
  const [tpsFilterStatus, setTpsFilterStatus] = useState("");
  const [tpsFilteredList, setTpsFilteredList] = useState([]);
  const [availableKelurahan, setAvailableKelurahan] = useState([]);
  const [showTpsFilterPopover, setShowTpsFilterPopover] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardStatsLoading, setDashboardStatsLoading] = useState(false);
  const [settings, setSettings] = useState({
    website_name: "SI-PETASAN",
    website_email: "admin@sipetasan.com",
    current_password: "",
    new_password: "",
  });

  // Load current user
  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    const userData = sessionStorage.getItem("user_role");
    const authUser = sessionStorage.getItem("auth_user");

    if (token) {
      if (authUser) {
        setCurrentUser(JSON.parse(authUser));
      } else {
        setCurrentUser({
          role: userData,
          email:
            sessionStorage.getItem("user_email") || "superadmin@sipetasan.com",
          nama_lengkap: "Super Admin",
        });
      }
    }
  }, []);

  // Load users & jadwals + kecamatan dari backend (dropdown seperti register warga)
  useEffect(() => {
    loadUsers();
    loadJadwals();
    loadTps();
    loadSettings();
    loadLaporan();
    loadDashboardStats();
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/wilayah/kecamatan`);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d) && d.length)
            setKecamatanOptions(d.map((x) => ({ id: x.id || x.nama, nama: x.nama || x })));
        }
      } catch {}
    })();
  }, []);

  // Fetch TPS data from API
  useEffect(() => {
    const loadTpsData = async () => {
      try {
        const data = await fetchAllTps();
        setTpsList(data);
      } catch (err) {
        console.error("Failed to load TPS data:", err);
        setTpsList([]);
      }
    };

    loadTpsData();
  }, []);

  // load kelurahan saat kecamatan newUser / editUser berubah (dropdown tingkat 2)
  useEffect(() => {
    const kec = editUser
      ? editUser.wilayah_kecamatan
      : newUser.wilayah_kecamatan;
    if (!kec) {
      setKelurahanOptions([]);
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${API_BASE}/api/wilayah/kelurahan?kecamatan=${encodeURIComponent(kec)}`,
        );
        if (r.ok) {
          const d = await r.json();
          setKelurahanOptions((d || []).map((x) => ({ id: x.id || x.nama, nama: x.nama || x })));
        }
      } catch {
        setKelurahanOptions([]);
      }
    })();
  }, [newUser.wilayah_kecamatan, editUser?.wilayah_kecamatan]);

  // load TPS options saat kecamatan/kelurahan berubah untuk role petugas_tps
  useEffect(() => {
    const kec = editUser
      ? editUser.wilayah_kecamatan
      : newUser.wilayah_kecamatan;
    const kel = editUser
      ? editUser.wilayah_kelurahan
      : newUser.wilayah_kelurahan;
    const role = editUser ? editUser.role : newUser.role;

    if (role !== "petugas_tps" || !kec) {
      setTpsOptions([]);
      return;
    }

    (async () => {
      try {
        let url = `${API_BASE}/api/tps/?kecamatan=${encodeURIComponent(kec)}`;
        if (kel) {
          url += `&kelurahan=${encodeURIComponent(kel)}`;
        }
        const r = await fetch(url, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (r.ok) {
          const d = await r.json();
          setTpsOptions((d || []).map((x) => ({
            id: x.id,
            nama: x.nama,
            kecamatan: x.kecamatan,
            kelurahan: x.kelurahan,
          })));
        }
      } catch {
        setTpsOptions([]);
      }
    })();
  }, [newUser.wilayah_kecamatan, newUser.wilayah_kelurahan, editUser?.wilayah_kecamatan, editUser?.wilayah_kelurahan, editUser?.role, newUser.role]);

  // Fetch kelurahan options untuk modal jadwal saat kecamatan berubah
  useEffect(() => {
    const kec = newJadwal.kecamatan || editingJadwal?.kecamatan;
    if (!kec) {
      setKelurahanOptions([]);
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${API_BASE}/api/wilayah/kelurahan?kecamatan=${encodeURIComponent(kec)}`,
        );
        if (r.ok) {
          const d = await r.json();
          setKelurahanOptions((d || []).map((x) => ({ id: x.id || x.nama, nama: x.nama || x })));
        } else {
          setKelurahanOptions([]);
        }
      } catch {
        setKelurahanOptions([]);
      }
    })();
  }, [newJadwal.kecamatan, editingJadwal?.kecamatan]);

  // Fetch petugas list saat kecamatan/kelurahan jadwal berubah
  useEffect(() => {
    fetchPetugasList(jadwalFilterKec, jadwalFilterKel);
  }, [jadwalFilterKec, jadwalFilterKel]);

  // Get current date
  const getCurrentDate = () => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const date = new Date();
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("id-ID", { month: "long" });
    const year = date.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  };

  // Check if day is passed
  const isDayPassed = (day) => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const todayIndex = new Date().getDay();
    const targetIndex = days.indexOf(day);
    if (targetIndex === -1) return false;
    return targetIndex < todayIndex;
  };

  const getToken = () => sessionStorage.getItem("access_token");

  const loadUsers = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setPetugasList(
          data.filter(
            (u) =>
              u.role === "admin" ||
              u.role === "superadmin" ||
              u.role === "driver" ||
              u.role === "petugas_kelurahan" ||
              u.role === "petugas_pengangkut" ||
              u.role === "petugas_tps",
          ),
        );
      } else {
        setUsers([]);
        setPetugasList([]);
      }
    } catch (err) {
      console.error("Load users error:", err);
      setUsers([]);
      setPetugasList([]);
      setError("Gagal memuat data pengguna. Silakan coba lagi.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const loadJadwals = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/jadwal/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setJadwals(data);
      } else {
        setJadwals([]);
      }
    } catch (err) {
      console.error("Load jadwals error:", err);
      setJadwals([]);
      setError("Gagal memuat jadwal pengambilan. Silakan coba lagi.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const fetchPetugasList = async (kec, kel) => {
    try {
      const token = getToken();
      if (!kec || !kel) { setPetugasOptions([]); return; }
      const r = await fetch(
        `${API_BASE}/api/jadwal/petugas?kecamatan=${encodeURIComponent(kec)}&kelurahan=${encodeURIComponent(kel)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (r.ok) {
        const d = await r.json();
        setPetugasOptions(Array.isArray(d) ? d : []);
      } else {
        setPetugasOptions([]);
      }
    } catch {
      setPetugasOptions([]);
    }
  };

  const loadLaporan = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/laporan/`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setLaporanList(data);
          return;
        }
      }
    } catch (err) {
      console.error("Load laporan API error:", err);
      setError("Gagal memuat laporan dari server.");
      setTimeout(() => setError(""), 4000);
    }
    try {
      const saved = JSON.parse(
        localStorage.getItem("sipetasan_laporan_warga") || "[]",
      );
      if (saved.length > 0) {
        setLaporanList(saved);
        return;
      }
    } catch (err) {
      console.error("Load laporan localStorage error:", err);
    }
    setLaporanList([
      {
        id: 101,
        tps_nama: "TPS PRINGADI",
        jenis_laporan: "Penuh",
        deskripsi: "Kontainer meluber ke badan jalan, bau menyengat.",
        status_tindak_lanjut: "Menunggu",
        tanggal_lapor: "10 menit lalu",
      },
      {
        id: 102,
        tps_nama: "TPS KEPUTRAN",
        jenis_laporan: "Rusak",
        deskripsi: "Roda kontainer patah dan penutup tidak bisa dibuka.",
        status_tindak_lanjut: "Proses",
        tanggal_lapor: "35 menit lalu",
      },
      {
        id: 103,
        tps_nama: "TPS KALISARI",
        jenis_laporan: "Penuh",
        deskripsi: "Tumpukan sampah plastik memenuhi bak kontainer.",
        status_tindak_lanjut: "Menunggu",
        tanggal_lapor: "1 jam lalu",
      },
    ]);
  };

  const handleDispatchTruck = (tps) => {
    setDispatchedTpsList((prev) => [...prev, tps.id]);
    setSuccess(
      `Instruksi Disposisi Terkirim! Truk Armada DLH SBY-${Math.floor(10 + Math.random() * 89)} segera meluncur ke ${tps.nama} (Kecamatan ${tps.kecamatan}).`,
    );
    setTimeout(() => setSuccess(""), 5000);
  };

  const handleResolveLaporan = (id) => {
    setLaporanList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status_tindak_lanjut: "Selesai" } : item,
      ),
    );
    setSuccess(
      `Laporan aduan #${id} berhasil divalidasi dan ditandai selesai ditangani.`,
    );
    setTimeout(() => setSuccess(""), 4500);
  };

  const loadTps = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tps/public`);
      if (response.ok) {
        const data = await response.json();
        setTpsList(data);
      } else {
        const txt = await response.text();
        console.error("Load TPS failed:", response.status, txt);
        setTpsList([]);
        setError("Gagal memuat data TPS dari server.");
        setTimeout(() => setError(""), 4000);
      }
    } catch (err) {
      console.error("Load TPS error:", err);
      setTpsList([]);
      setError("Gagal memuat data TPS. Silakan coba lagi.");
      setTimeout(() => setError(""), 4000);
    }
  };

  const loadDashboardStats = async () => {
    setDashboardStatsLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/dashboard/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      } else {
        console.error("Load dashboard stats failed:", response.status);
        setDashboardStats(null);
      }
    } catch (err) {
      console.error("Load dashboard stats error:", err);
      setDashboardStats(null);
      setError("Gagal memuat statistik dashboard. Silakan coba lagi.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setDashboardStatsLoading(false);
    }
  };

  // Load kelurahan for TPS filter when kecamatan changes
  useEffect(() => {
    if (!tpsFilterKecamatan) {
      setAvailableKelurahan([]);
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${API_BASE}/api/wilayah/kelurahan?kecamatan=${encodeURIComponent(tpsFilterKecamatan)}`,
        );
        if (r.ok) {
          const d = await r.json();
          setAvailableKelurahan(
            Array.isArray(d) ? d.map((x) => x.nama || x) : [],
          );
        }
      } catch {}
    })();
  }, [tpsFilterKecamatan]);

  // Filter TPS based on search and filters
  useEffect(() => {
    let result = [...tpsList];

    // Search filter
    if (tpsSearchQuery.trim()) {
      const q = tpsSearchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          (t.nama && t.nama.toLowerCase().includes(q)) ||
          (t.nama_lama && t.nama_lama.toLowerCase().includes(q)) ||
          (t.lokasi && t.lokasi.toLowerCase().includes(q)) ||
          (t.kecamatan && t.kecamatan.toLowerCase().includes(q)),
      );
    }

    // Kecamatan filter
    if (tpsFilterKecamatan) {
      result = result.filter((t) => t.kecamatan === tpsFilterKecamatan);
    }

    // Kelurahan filter
    if (tpsFilterKelurahan) {
      result = result.filter(
        (t) =>
          t.kelurahans &&
          Array.isArray(t.kelurahans) &&
          t.kelurahans.some((k) => k.nama === tpsFilterKelurahan),
      );
    }

    // Status filter
    if (tpsFilterStatus) {
      result = result.filter((t) => t.status === tpsFilterStatus);
    }

    // Capacity filter
    if (tpsFilterCapacity.min !== "") {
      result = result.filter(
        (t) =>
          t.daya_tampung_m3 != null &&
          t.daya_tampung_m3 >= parseFloat(tpsFilterCapacity.min),
      );
    }
    if (tpsFilterCapacity.max !== "") {
      result = result.filter(
        (t) =>
          t.daya_tampung_m3 != null &&
          t.daya_tampung_m3 <= parseFloat(tpsFilterCapacity.max),
      );
    }

    setTpsFilteredList(result);
  }, [
    tpsList,
    tpsSearchQuery,
    tpsFilterKecamatan,
    tpsFilterKelurahan,
    tpsFilterStatus,
    tpsFilterCapacity,
  ]);

  const resetTpsFilters = () => {
    setTpsSearchQuery("");
    setTpsFilterKecamatan("");
    setTpsFilterKelurahan("");
    setTpsFilterStatus("");
    setTpsFilterCapacity({ min: "", max: "" });
  };

  // Close filter popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const popoverEl = document.querySelector("[data-tps-filter-popover]");
      if (popoverEl && !popoverEl.contains(e.target)) {
        setShowTpsFilterPopover(false);
      }
    };
    if (showTpsFilterPopover) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showTpsFilterPopover]);

  const handleAddTps = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const token = getToken();
      if (!token)
        throw new Error(
          "Token tidak ditemukan, login ulang sebagai superadmin",
        );

      // Helper to safely parse coordinate strings/numbers
      const parseCoord = (val) => {
        if (val === "" || val === null || val === undefined) return null;
        const str = String(val).replace(",", ".");
        return parseFloat(str);
      };

      // Validate coordinates format before sending
      const latVal = parseCoord(newTps.latitude);
      const lngVal = parseCoord(newTps.longitude);

      if (
        newTps.latitude &&
        (isNaN(latVal) ||
          !/^-?\d+\.?\d*$/.test(String(newTps.latitude).replace(",", ".")))
      ) {
        throw new Error(
          "Format latitude tidak valid. Gunakan desimal seperti: -7.2575",
        );
      }
      if (
        newTps.longitude &&
        (isNaN(lngVal) ||
          !/^-?\d+\.?\d*$/.test(String(newTps.longitude).replace(",", ".")))
      ) {
        throw new Error(
          "Format longitude tidak valid. Gunakan desimal seperti: 112.7521",
        );
      }

      const payload = {
        ...newTps,
        latitude: latVal,
        longitude: lngVal,
        daya_tampung_m3: newTps.daya_tampung_m3
          ? parseFloat(newTps.daya_tampung_m3)
          : null,
      };

      // Validate latitude/longitude ranges before sending
      if (
        payload.latitude !== null &&
        (payload.latitude < -90 || payload.latitude > 90)
      ) {
        throw new Error("Latitude harus antara -90 dan 90");
      }
      if (
        payload.longitude !== null &&
        (payload.longitude < -180 || payload.longitude > 180)
      ) {
        throw new Error("Longitude harus antara -180 dan 180");
      }

      const url = editingTpsId
        ? `${API_BASE}/api/tps/${editingTpsId}`
        : `${API_BASE}/api/tps/`;
      const method = editingTpsId ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      let resText = await response.text();
      if (!response.ok) {
        let msg = resText;
        try {
          const j = JSON.parse(resText);
          msg = j.detail || resText;
        } catch {}
        throw new Error(
          msg || (editingTpsId ? "Gagal mengupdate TPS" : "Gagal menambah TPS"),
        );
      }
      setSuccess(
        editingTpsId ? "TPS berhasil diupdate" : "TPS berhasil ditambahkan",
      );
      setNewTps({
        nama: "",
        kecamatan: "",
        wilayah_kota: "Surabaya Pusat",
        lokasi: "",
        jenis_tps: "TPS Resmi",
        latitude: "",
        longitude: "",
        jumlah_container: "",
        daya_tampung_m3: "",
        status: "Aktif",
      });
      setEditingTpsId(null);
      setShowAddTpsModal(false);
      loadTps();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTps = (tps) => {
    setEditingTpsId(tps.id);
    setNewTps({
      nama: tps.nama || "",
      kecamatan: tps.kecamatan || "",
      wilayah_kota: tps.wilayah_kota || "Surabaya Pusat",
      lokasi: tps.lokasi || "",
      jenis_tps: tps.jenis_tps || "TPS Resmi",
      latitude:
        tps.latitude !== null && tps.latitude !== undefined ? tps.latitude : "",
      longitude:
        tps.longitude !== null && tps.longitude !== undefined
          ? tps.longitude
          : "",
      jumlah_container: tps.jumlah_container || "",
      daya_tampung_m3:
        tps.daya_tampung_m3 !== null && tps.daya_tampung_m3 !== undefined
          ? tps.daya_tampung_m3
          : "",
      status: tps.status || "Aktif",
    });
    setShowAddTpsModal(true);
  };

  const handleDeleteTps = async (tpsId) => {
    if (!window.confirm("Yakin ingin menghapus TPS ini?")) return;
    setError("");
    setSuccess("");
    try {
      const token = getToken();
      if (!token)
        throw new Error(
          "Token tidak ditemukan, login ulang sebagai superadmin",
        );
      const response = await fetch(`${API_BASE}/api/tps/${tpsId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      let body = "";
      try {
        body = await response.text();
      } catch {}
      if (!response.ok) {
        let msg = body;
        try {
          const j = JSON.parse(body);
          msg = j.detail || body;
        } catch {}
        throw new Error(msg || `Gagal menghapus TPS (${response.status})`);
      }
      setSuccess("TPS berhasil dihapus");
      loadTps();
    } catch (err) {
      if (err.message === "Failed to fetch") {
        setError(
          `Gagal terhubung ke server (${API_BASE}). Pastikan backend nyala.`,
        );
      } else {
        setError(err.message);
      }
    }
  };

  const uploadPetugasFoto = async (userId, file) => {
    if (!file) return null;
    const fd = new FormData();
    fd.append("foto", file);
    const r = await fetch(`${API_BASE}/api/admin/users/${userId}/foto`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    });
    if (!r.ok) throw new Error((await r.text()) || "Gagal upload foto");
    const j = await r.json();
    return j.foto_url;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama_lengkap: newUser.nama_lengkap,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          username: newUser.email.split("@")[0],
          wilayah_kecamatan: newUser.wilayah_kecamatan || null,
          wilayah_kelurahan: newUser.wilayah_kelurahan || null,
          wilayah_kota: "Surabaya",
        }),
      });
      let txt = await response.text();
      if (!response.ok) {
        let msg = txt;
        try {
          msg = JSON.parse(txt).detail || txt;
        } catch {}
        throw new Error(msg || "Gagal menambah user");
      }
      let created = null;
      try {
        created = JSON.parse(txt);
      } catch {}
      const uid = created?.id;
      if (uid && newUserFotoFile) {
        try {
          await uploadPetugasFoto(uid, newUserFotoFile);
        } catch (fe) {
          console.warn(fe);
        }
      }
      // Assign TPS if role is petugas_tps
      if (uid && newUser.role === "petugas_tps" && newUser.tps_ids && newUser.tps_ids.length > 0) {
        try {
          const assignResponse = await fetch(`${API_BASE}/api/petugas-tps/assignments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: uid,
              tps_ids: newUser.tps_ids,
            }),
          });
          if (!assignResponse.ok) {
            const errTxt = await assignResponse.text();
            console.warn("Failed to assign TPS:", errTxt);
          }
        } catch (assignErr) {
          console.warn("Failed to assign TPS:", assignErr);
        }
      }
      setSuccess("User berhasil ditambahkan");
      setNewUser({
        nama_lengkap: "",
        email: "",
        password: "",
        role: "petugas_pengangkut",
        wilayah_kecamatan: "",
        wilayah_kelurahan: "",
        foto_url: "",
        tps_ids: [],
      });
      setNewUserFotoFile(null);
      setNewUserFotoPreview("");
      setShowAddUserModal(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditUser = async (u) => {
    let tps_ids = [];
    if (u.role === "petugas_tps") {
      try {
        const r = await fetch(`${API_BASE}/api/petugas-tps/assignments/${u.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (r.ok) {
          const data = await r.json();
          tps_ids = data.map(a => a.tps_id);
        }
      } catch {}
    }
    setEditUser({
      id: u.id,
      nama_lengkap: u.nama_lengkap,
      email: u.email,
      role: u.role,
      wilayah_kecamatan: u.wilayah_kecamatan || "",
      wilayah_kelurahan: u.wilayah_kelurahan || "",
      foto_url: u.foto_url || "",
      tps_ids,
    });
    setEditFotoFile(null);
    setEditFotoPreview(u.foto_url ? `${API_BASE}${u.foto_url}` : "");
  };
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setIsLoading(true);
    setError("");
    try {
      const token = getToken();
      // upload foto dulu jika ada file baru
      let fotoUrl = editUser.foto_url;
      if (editFotoFile)
        fotoUrl = await uploadPetugasFoto(editUser.id, editFotoFile);
      const r = await fetch(`${API_BASE}/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama_lengkap: editUser.nama_lengkap,
          role: editUser.role,
          wilayah_kecamatan: editUser.wilayah_kecamatan || "",
          wilayah_kelurahan: editUser.wilayah_kelurahan || "",
          wilayah_kota: "Surabaya",
          foto_url: fotoUrl,
        }),
      });
      let txt = await r.text();
      if (!r.ok) {
        let m = txt;
        try {
          m = JSON.parse(txt).detail || txt;
        } catch {}
        throw new Error(m);
      }
      // Update TPS assignments if role is petugas_tps
      if (editUser.role === "petugas_tps") {
        try {
          // Get current assignments
          const currentAssignmentsResponse = await fetch(`${API_BASE}/api/petugas-tps/assignments/${editUser.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          let currentTpsIds = [];
          if (currentAssignmentsResponse.ok) {
            const data = await currentAssignmentsResponse.json();
            currentTpsIds = data.map(a => a.tps_id);
          }
          
          const newTpsIds = editUser.tps_ids || [];
          
          // Find TPS to remove
          const toRemove = currentTpsIds.filter(id => !newTpsIds.includes(id));
          // Find TPS to add
          const toAdd = newTpsIds.filter(id => !currentTpsIds.includes(id));
          
          // Remove old assignments
          for (const tpsId of toRemove) {
            await fetch(`${API_BASE}/api/petugas-tps/assignments/${editUser.id}/${tpsId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
          
          // Add new assignments
          if (toAdd.length > 0) {
            await fetch(`${API_BASE}/api/petugas-tps/assignments`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                user_id: editUser.id,
                tps_ids: toAdd,
              }),
            });
          }
        } catch (assignErr) {
          console.warn("Failed to update TPS assignments:", assignErr);
        }
      }
      setSuccess("Petugas berhasil diperbarui");
      setEditUser(null);
      setEditFotoFile(null);
      setEditFotoPreview("");
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const openViewUser = async (u) => {
    try {
      const r = await fetch(`${API_BASE}/api/admin/users/${u.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (r.ok) setViewUser(await r.json());
      else setViewUser(u);
    } catch {
      setViewUser(u);
    }
  };

  const handleAddJadwal = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const token = getToken();
      // Validate waktu
      if (newJadwal.tipe !== "Libur" && newJadwal.waktu_selesai <= newJadwal.waktu_mulai) {
        throw new Error("Waktu selesai harus lebih besar dari waktu mulai");
      }
      if (!newJadwal.kecamatan || !newJadwal.kelurahan) {
        throw new Error("Kecamatan dan kelurahan wajib diisi");
      }
      const payload = { ...newJadwal };
      const response = await fetch(`${API_BASE}/api/jadwal/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Gagal menambah jadwal");
      }
      setSuccess("Jadwal berhasil ditambahkan");
      setNewJadwal({
        hari: "",
        waktu_mulai: "",
        waktu_selesai: "",
        area: "",
        petugas: "",
        petugas_id: null,
        tipe: "Rutin",
        tps_id: null,
        kecamatan: "",
        kelurahan: "",
      });
      setShowAddJadwalModal(false);
      loadJadwals();
    } catch (err) {
      setError(err.message || "Gagal menambah jadwal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditJadwal = async (e) => {
    e.preventDefault();
    if (!editingJadwal) return;
    setIsLoading(true);
    setError("");
    try {
      const token = getToken();
      const payload = { ...editingJadwal };
      const response = await fetch(`${API_BASE}/api/jadwal/${editingJadwal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Gagal memperbarui jadwal");
      }
      setSuccess("Jadwal berhasil diperbarui");
      setShowEditJadwalModal(false);
      setEditingJadwal(null);
      loadJadwals();
    } catch (err) {
      setError(err.message || "Gagal memperbarui jadwal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJadwal = async (jadwalId) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/jadwal/${jadwalId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Gagal menghapus jadwal");
      }
      setSuccess("Jadwal berhasil dihapus");
      loadJadwals();
    } catch (err) {
      setError(err.message || "Gagal menghapus jadwal");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Yakin ingin menghapus akun pengguna ini?")) return;
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Gagal menghapus pengguna");
      setSuccess("Pengguna berhasil dihapus");
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const loadSettings = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          website_name: data.website_name,
          website_email: data.website_email,
          current_password: "",
          new_password: "",
        });
      }
    } catch (err) {
      console.error("Load settings error:", err);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const token = getToken();
      const updateData = {
        website_name: settings.website_name,
        website_email: settings.website_email,
      };
      if (settings.new_password) {
        if (!settings.current_password) {
          throw new Error(
            "Password saat ini wajib diisi untuk mengganti password",
          );
        }
        updateData.current_password = settings.current_password;
        updateData.new_password = settings.new_password;
      }
      const response = await fetch(`${API_BASE}/api/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Gagal mengupdate pengaturan");
      }
      setSuccess("Pengaturan berhasil diperbarui");
      setSettings({ ...settings, current_password: "", new_password: "" });
      loadSettings();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-container">
      {/* Mobile Sticky Top Header Bar with Hamburger Button */}
      <header className="admin-mobile-top-bar">
        <div className="admin-mobile-left">
          <button
            type="button"
            className="admin-mobile-hamburger-btn"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Buka navigasi menu superadmin"
            title="Menu Navigasi Superadmin"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div
            className="admin-mobile-brand"
            onClick={() => {
              setActiveMenu("dashboard");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <div
              className="admin-mobile-logo-icon"
              style={{ background: "#059669" }}
            >
              SA
            </div>
            <div className="admin-mobile-brand-title">
              <span>SI-Petasan</span>
              <span
                className="brand-badge-country"
                style={{ background: "#d1fae5", color: "#065f46" }}
              >
                SUPERADMIN
              </span>
            </div>
          </div>
        </div>

        <div className="admin-mobile-right">
          <div className="admin-mobile-status-badge">
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#059669",
                display: "inline-block",
              }}
            />
            <span>DLH Pusat</span>
          </div>
          <div
            className="admin-mobile-avatar"
            style={{ background: "#059669" }}
            title={
              currentUser?.nama_lengkap || currentUser?.nama || "Superadmin"
            }
          >
            {(currentUser?.nama_lengkap || currentUser?.nama || "S")
              .charAt(0)
              .toUpperCase()}
          </div>
        </div>
      </header>

      {/* Backdrop for Left Slide-over Drawer */}
      <div
        className={`admin-drawer-backdrop ${mobileDrawerOpen ? "open" : ""}`}
        onClick={() => setMobileDrawerOpen(false)}
        aria-hidden={!mobileDrawerOpen}
      />

      {/* Slide-over Left Drawer Menu for Superadmin */}
      <aside
        className={`admin-mobile-drawer ${mobileDrawerOpen ? "open" : ""}`}
        aria-label="Sidebar Menu Mobile Superadmin"
      >
        <div className="drawer-header">
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Tutup menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            className="drawer-brand-logo"
            onClick={() => {
              setActiveMenu("dashboard");
              setMobileDrawerOpen(false);
            }}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                background: "#059669",
                color: "#fff",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: "0.85rem",
              }}
            >
              SA
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "#0f172a",
                  lineHeight: 1.2,
                }}
              >
                SI-PETASAN
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                Superadmin Panel
              </span>
            </div>
          </div>
        </div>

        <div className="drawer-content-scroll">
          <div className="drawer-section-header">Menu Utama</div>
          <nav className="drawer-section">
            <button
              type="button"
              className={`drawer-item ${activeMenu === "dashboard" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("dashboard");
                setMobileDrawerOpen(false);
              }}
            >
              <span className="drawer-icon">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </span>
              <span className="drawer-label">Dashboard</span>
            </button>

            <button
              type="button"
              className={`drawer-item ${activeMenu === "users" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("users");
                setMobileDrawerOpen(false);
              }}
            >
              <span className="drawer-icon">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              <span className="drawer-label">Data Pengguna & Warga</span>
            </button>

            <button
              type="button"
              className={`drawer-item ${activeMenu === "petugas" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("petugas");
                setMobileDrawerOpen(false);
              }}
            >
              <span className="drawer-icon">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </span>
              <span className="drawer-label">Kelola Petugas / Admin</span>
            </button>

            <button
              type="button"
              className={`drawer-item ${activeMenu === "tps" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("tps");
                setMobileDrawerOpen(false);
              }}
            >
              <span className="drawer-icon">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </span>
              <span className="drawer-label">Kelola TPS</span>
            </button>

            <button
              type="button"
              className={`drawer-item ${activeMenu === "jadwal" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("jadwal");
                setMobileDrawerOpen(false);
              }}
            >
              <span className="drawer-icon">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <span className="drawer-label">Jadwal Pengambilan</span>
            </button>

            <button
              type="button"
              className={`drawer-item ${activeMenu === "settings" ? "active" : ""}`}
              onClick={() => {
                setActiveMenu("settings");
                setMobileDrawerOpen(false);
              }}
            >
              <span className="drawer-icon">
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span>
              <span className="drawer-label">Pengaturan</span>
            </button>
          </nav>
        </div>

        <div className="admin-drawer-footer">
          <div className="admin-drawer-user-card">
            <div
              className="admin-profile-avatar"
              style={{ background: "#059669" }}
            >
              {(currentUser?.nama_lengkap || currentUser?.nama || "S")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentUser?.nama_lengkap ||
                  currentUser?.nama ||
                  "Superadmin DLH"}
              </div>
              <div
                style={{
                  fontSize: "0.74rem",
                  color: "#64748b",
                  textTransform: "capitalize",
                }}
              >
                {currentUser?.role || "Superadmin"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="admin-drawer-logout-btn"
            onClick={onLogout}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Keluar dari Superadmin</span>
          </button>
        </div>
      </aside>

      {/* SIDEBAR */}
      <aside
        className={`admin-sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="admin-logo-badge">
          <div className="admin-logo-left">
            <div className="admin-logo-icon" title="SI-PETASAN">
              SA
            </div>
            {!isSidebarCollapsed && (
              <div className="admin-brand-info">
                <div className="admin-brand-name">SI-PETASAN</div>
                <div className="admin-brand-tag">Superadmin Panel</div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="admin-sidebar-toggle"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Buka Sidebar" : "Sembunyikan Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            )}
          </button>
        </div>

        <div className="admin-nav-section">
          {!isSidebarCollapsed && (
            <div className="admin-nav-label">MENU UTAMA</div>
          )}
          <nav className="admin-nav-menu">
            <button
              type="button"
              className={`admin-nav-item ${activeMenu === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveMenu("dashboard")}
              title="Dashboard"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              {!isSidebarCollapsed && <span>Dashboard</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === "pengguna" ? "active" : ""}`}
              onClick={() => setActiveMenu("pengguna")}
              title="Data Pengguna & Warga"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              {!isSidebarCollapsed && <span>Data Pengguna & Warga</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === "petugas" ? "active" : ""}`}
              onClick={() => setActiveMenu("petugas")}
              title="Kelola Petugas / Admin"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
              {!isSidebarCollapsed && <span>Kelola Petugas / Admin</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === "tps" ? "active" : ""}`}
              onClick={() => setActiveMenu("tps")}
              title="Kelola TPS"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {!isSidebarCollapsed && <span>Kelola TPS</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === "jadwal" ? "active" : ""}`}
              onClick={() => setActiveMenu("jadwal")}
              title="Jadwal Pengambilan"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {!isSidebarCollapsed && <span>Jadwal Pengambilan</span>}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeMenu === "pengaturan" ? "active" : ""}`}
              onClick={() => setActiveMenu("pengaturan")}
              title="Pengaturan"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              {!isSidebarCollapsed && <span>Pengaturan</span>}
            </button>
          </nav>
        </div>

        {/* Bottom profile */}
        <div className="admin-bottom-profile">
          <div
            className="admin-profile-card"
            title={`${currentUser?.nama_lengkap || currentUser?.nama || "Superadmin"} (${currentUser?.role || "Super Admin"})`}
          >
            <div className="admin-profile-avatar">
              {(currentUser?.nama_lengkap || currentUser?.nama || "SA")
                .charAt(0)
                .toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="admin-profile-info">
                <div className="admin-profile-name">
                  {currentUser?.nama_lengkap ||
                    currentUser?.nama ||
                    "Superadmin"}
                </div>
                <div
                  className="admin-profile-role"
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    textTransform: "capitalize",
                  }}
                >
                  {currentUser?.role || "Super Admin"}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={onLogout}
            title="Keluar"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ flexShrink: 0 }}
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!isSidebarCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="admin-top-header">
          <div>
            <h1 className="admin-page-title">
              {activeMenu === "dashboard" && "Dashboard Superadmin"}
              {activeMenu === "pengguna" && "Data Pengguna & Warga"}
              {activeMenu === "petugas" && "Kelola Petugas & Admin"}
              {activeMenu === "tps" && "Kelola TPS"}
              {activeMenu === "jadwal" && "Jadwal Pengambilan Sampah"}
              {activeMenu === "pengaturan" && "Pengaturan Website"}
            </h1>
            <div className="admin-page-date">{getCurrentDate()}</div>
          </div>
        </header>

        {success && (
          <div
            style={{
              padding: "12px 16px",
              background: "#dcfce7",
              color: "#166534",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            ✓ {success}
          </div>
        )}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "#fee2e2",
              color: "#b91c1c",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            ✕ {error}
          </div>
        )}

        {/* DASHBOARD EKSEKUTIF SUPERADMIN */}
        {activeMenu === "dashboard" &&
          (() => {
            // Use API data if available, fallback to static data
            const totalTpsCount = dashboardStats?.total_tps || tpsList.length;
            const pendingReports = laporanList.filter(
              (l) => l.status_tindak_lanjut !== "Selesai",
            );

            // No actual fill volume data available - criticalTpsList empty
            const criticalTpsList = [];

            // Mapping from database wilayah_kota to display names
            const wilayahMap = {
              "Surabaya Pusat": "Surabaya Pusat",
              "Surabaya Timur": "Surabaya Timur",
              "Surabaya Barat": "Surabaya Barat",
              "Surabaya Utara": "Surabaya Utara",
              "Surabaya Selatan": "Surabaya Selatan",
            };

            const REGIONS = [
              {
                name: "Surabaya Pusat",
                icon: IconBuilding,
                desc: "Tegalsari, Genteng, Bubutan, Simokerto",
              },
              {
                name: "Surabaya Timur",
                icon: IconGraduationCap,
                desc: "Gubeng, Sukolilo, Rungkut, Mulyorejo",
              },
              {
                name: "Surabaya Barat",
                icon: IconBuilding,
                desc: "Tandes, Sambikerep, Benowo, Sukomanunggal",
              },
              {
                name: "Surabaya Utara",
                icon: IconAnchor,
                desc: "Krembangan, Semampir, Pabean Cantian, Kenjeran",
              },
              {
                name: "Surabaya Selatan",
                icon: IconTree,
                desc: "Wonokromo, Wonocolo, Sawahan, Gayungan",
              },
            ];

            // Build region stats from API data
            const regionStats = REGIONS.map((reg) => {
              let regData = dashboardStats?.regions?.find(
                (r) => r.wilayah_kota === reg.name,
              );

              if (!regData) {
                // Fallback: use tpsList
                const list = tpsList.filter((t) => t.wilayah_kota === reg.name);
                regData = {
                  wilayah_kota: reg.name,
                  total_tps: list.length,
                  avg_capacity:
                    list.length > 0
                      ? Math.round(
                          list.reduce(
                            (acc, t) =>
                              acc + (parseFloat(t.daya_tampung_m3) || 0),
                            0,
                          ) / list.length,
                        )
                      : 0,
                  has_capacity_data: list.some((t) => t.daya_tampung_m3),
                };
              }

              // Calculate status based on avg_capacity (m3)
              // Display as percentage would need actual filled volume (not available)
              // For now: show avg capacity in m3 and capacity data availability
              const avgCapacityValue = regData.avg_capacity || 0;
              const statusText = regData.has_capacity_data
                ? "Data Tersedia"
                : "Data Kapasitas Belum Lengkap";
              const statusColor = regData.has_capacity_data
                ? "#10b981"
                : "#94a3b8";

              return {
                ...reg,
                totalTps: regData.total_tps || 0,
                avgCapacity: Math.round(avgCapacityValue * 10) / 10, // avg daya_tampung in m3
                criticalCount: 0, // Cannot determine without actual volume data
                statusText,
                statusColor,
                hasCapacityData: regData.has_capacity_data,
              };
            });

            // Average capacity across all TPS (in m3)
            const avgCapacityAll =
              dashboardStats?.avg_capacity_all ||
              (tpsList.length > 0
                ? Math.round(
                    (tpsList.reduce(
                      (acc, t) => acc + (parseFloat(t.daya_tampung_m3) || 0),
                      0,
                    ) /
                      tpsList.length) *
                      10,
                  ) / 10
                : 0);

            return (
              <div
                className="admin-content-view"
                style={{ paddingBottom: "40px" }}
              >
                {/* Executive Welcome Hero Banner */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)",
                    color: "#ffffff",
                    borderRadius: "16px",
                    padding: "24px 28px",
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                    boxShadow: "0 8px 24px rgba(4, 120, 87, 0.22)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        SUPERADMIN COMMAND CENTER DLH SURABAYA
                      </span>
                      <span
                        style={{
                          background: "#22c55e",
                          color: "#ffffff",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                        }}
                      >
                        ● LIVE MONITORING
                      </span>
                    </div>
                    <h2
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 900,
                        margin: "0 0 6px",
                        color: "#ffffff",
                      }}
                    >
                      Executive Waste Governance Control Center
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.86rem",
                        opacity: 0.9,
                        maxWidth: "680px",
                      }}
                    >
                      Akses kontrol eksekutif superadmin: pemantauan operasional{" "}
                      {totalTpsCount} TPS, neraca volume sampah 5 wilayah, radar
                      dump truck darurat, dan penanganan aduan warga kota.
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: "12px",
                      padding: "12px 20px",
                      textAlign: "center",
                      backdropFilter: "blur(8px)",
                      minWidth: "150px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        opacity: 0.85,
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      Indeks Kebersihan Kota
                    </div>
                    <div
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 900,
                        color: "#fef08a",
                        marginTop: "2px",
                      }}
                    >
                      94.8%
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#bbf7d0",
                        fontWeight: 700,
                      }}
                    >
                      Grade A &bull; Sangat Baik
                    </span>
                  </div>
                </div>

                {/* 4 Executive KPI Cards */}
                <div className="admin-stats-row">
                  {/* KPI 1 */}
                  <div className="admin-stat-card">
                    <div className="stat-card-header">
                      <div className="stat-icon-wrap icon-blue">
                        <IconUsers size={20} />
                      </div>
                      <span className="stat-badge-live">USERS</span>
                    </div>
                    <div className="stat-card-number">{users.length}</div>
                    <div className="stat-card-label">
                      Total Pengguna Terdaftar
                    </div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "#0284c7",
                        fontWeight: 700,
                        marginTop: "6px",
                      }}
                    >
                      Warga &bull; Petugas &bull; Admin
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div className="admin-stat-card">
                    <div className="stat-card-header">
                      <div className="stat-icon-wrap icon-gold">
                        <IconTrendingUp size={20} />
                      </div>
                      <span className="stat-badge-live">KOTA</span>
                    </div>
                    <div className="stat-card-number">
                      {avgCapacityAll.toFixed(1)} m³
                    </div>
                    <div className="stat-card-label">
                      Rata-rata Kapasitas TPS Kota
                    </div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "#059669",
                        fontWeight: 700,
                        marginTop: "6px",
                      }}
                    >
                      {totalTpsCount} TPS &bull; Daya Tampung
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div
                    className="admin-stat-card"
                    style={{ border: "1px solid #e2e8f0" }}
                  >
                    <div className="stat-card-header">
                      <div
                        className="stat-icon-wrap icon-orange"
                        style={{ background: "#fee2e2", color: "#dc2626" }}
                      >
                        ℹ️
                      </div>
                      <span
                        style={{
                          background: "#6366f1",
                          color: "#ffffff",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: "6px",
                        }}
                      >
                        INFO
                      </span>
                    </div>
                    <div
                      className="stat-card-number"
                      style={{ color: "#6366f1" }}
                    >
                      -
                    </div>
                    <div className="stat-card-label">Status Beban TPS</div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "#6366f1",
                        fontWeight: 700,
                        marginTop: "6px",
                      }}
                    >
                      Data Volume Belum Tersedia
                    </div>
                  </div>

                  {/* KPI 4 */}
                  <div className="admin-stat-card">
                    <div className="stat-card-header">
                      <div
                        className="stat-icon-wrap icon-sand"
                        style={{
                          background: "#fdf4ff",
                          color: "#c026d3",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconMegaphone size={20} />
                      </div>
                      <span
                        style={{
                          background: "#8b5cf6",
                          color: "#ffffff",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: "6px",
                        }}
                      >
                        ADUAN
                      </span>
                    </div>
                    <div className="stat-card-number">
                      {pendingReports.length} Aduan
                    </div>
                    <div className="stat-card-label">
                      Laporan Warga Menunggu
                    </div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "#7c3aed",
                        fontWeight: 700,
                        marginTop: "6px",
                      }}
                    >
                      Respon Tim Lapangan
                    </div>
                  </div>
                </div>

                {/* SEBARAN BEBAN 5 WILAYAH KOTA SURABAYA */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "22px 24px",
                    marginBottom: "28px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "18px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.1rem",
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <IconMap size={18} /> Sebaran Beban Kapasitas TPS per
                          Wilayah Surabaya
                        </span>
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "0.8rem",
                          color: "#64748b",
                        }}
                      >
                        Distribusi rata-rata tampungan kontainer sampah di 5
                        zona kota
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        background: "#f1f5f9",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      Total {totalTpsCount} TPS Aktif
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {regionStats.map((reg) => (
                      <div
                        key={reg.name}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.88rem",
                                fontWeight: 800,
                                color: "#0f172a",
                              }}
                            >
                              {(() => {
                                const RegIcon = reg.icon;
                                return (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                    }}
                                  >
                                    {typeof RegIcon === "function" ? (
                                      <RegIcon size={16} />
                                    ) : null}
                                    <span>{reg.name}</span>
                                  </span>
                                );
                              })()}
                            </span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background:
                                  reg.statusColor === "#10b981"
                                    ? "#f0fdf4"
                                    : "#f1f5f9",
                                color: reg.statusColor,
                              }}
                            >
                              {reg.statusText}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "#64748b",
                              marginBottom: "12px",
                            }}
                          >
                            {reg.desc}
                          </div>
                        </div>

                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-end",
                              marginBottom: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#475569",
                                fontWeight: 600,
                              }}
                            >
                              {reg.totalTps} TPS
                            </span>
                            <strong
                              style={{
                                fontSize: "1.1rem",
                                fontWeight: 900,
                                color: reg.statusColor,
                              }}
                            >
                              {reg.avgCapacity} m³
                            </strong>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "8px",
                              background: "#e2e8f0",
                              borderRadius: "999px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min((reg.avgCapacity / 20) * 100, 100)}%`,
                                height: "100%",
                                background: reg.statusColor,
                                borderRadius: "999px",
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "#64748b",
                              marginTop: "4px",
                            }}
                          >
                            {reg.statusText}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DUA GRID: RADAR TPS OVERLOAD & ADUAN WARGA */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
                    gap: "24px",
                    marginBottom: "28px",
                  }}
                >
                  {/* 1. RADAR TPS PRIORITAS PENGANGKUTAN */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "22px 24px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "1.05rem",
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <IconAlert size={18} /> Radar Prioritas Pengangkutan
                            (TPS Overload &ge; 80%)
                          </span>
                        </h3>
                        <p
                          style={{
                            margin: "3px 0 0",
                            fontSize: "0.78rem",
                            color: "#64748b",
                          }}
                        >
                          TPS membutuhkan penugasan armada dump truck DLH segera
                        </p>
                      </div>
                      <span
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        DARURAT
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {criticalTpsList.slice(0, 5).map((tps) => {
                        const isDispatched = dispatchedTpsList.includes(tps.id);
                        const pct = tps.kapasitasPersen || tps.capacity || 85;
                        return (
                          <div
                            key={tps.id}
                            style={{
                              border: "1px solid #fed7aa",
                              background: "#fffaf5",
                              borderRadius: "10px",
                              padding: "12px 14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: "0.88rem",
                                    color: "#0f172a",
                                  }}
                                >
                                  {tps.nama}
                                </strong>
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    background: "#ef4444",
                                    color: "#fff",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {pct}%
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                  marginTop: "2px",
                                }}
                              >
                                Kec. {tps.kecamatan} &bull; {tps.wilayahKota}{" "}
                                &bull; Kapasitas: {tps.dayaTampungM3 || 12} m³
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDispatchTruck(tps)}
                              disabled={isDispatched}
                              style={{
                                background: isDispatched
                                  ? "#059669"
                                  : "#ea580c",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                cursor: isDispatched ? "default" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span>
                                {isDispatched ? (
                                  <IconCheck size={14} />
                                ) : (
                                  <IconAlert size={14} />
                                )}
                              </span>
                              <span>
                                {isDispatched
                                  ? "Truk Ditugaskan"
                                  : "Disposisi Truk"}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. ADUAN & LAPORAN WARGA TERKINI */}
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "16px",
                      padding: "22px 24px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "1.05rem",
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <IconMegaphone size={18} /> Aduan &amp; Laporan
                            Warga Lapangan
                          </span>
                        </h3>
                        <p
                          style={{
                            margin: "3px 0 0",
                            fontSize: "0.78rem",
                            color: "#64748b",
                          }}
                        >
                          Umpan balik real-time dari aplikasi warga SI-PETASAN
                        </p>
                      </div>
                      <span
                        style={{
                          background: "#ede9fe",
                          color: "#6d28d9",
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {pendingReports.length} Menunggu
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {laporanList.slice(0, 4).map((lap) => {
                        const isDone = lap.status_tindak_lanjut === "Selesai";
                        return (
                          <div
                            key={lap.id}
                            style={{
                              border: `1px solid ${isDone ? "#e2e8f0" : "#fed7aa"}`,
                              background: isDone ? "#f8fafc" : "#ffffff",
                              borderRadius: "10px",
                              padding: "12px 14px",
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: "12px",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  marginBottom: "2px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    background:
                                      lap.jenis_laporan === "Penuh"
                                        ? "#fee2e2"
                                        : "#fef3c7",
                                    color:
                                      lap.jenis_laporan === "Penuh"
                                        ? "#b91c1c"
                                        : "#b45309",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {lap.jenis_laporan}
                                </span>
                                <strong
                                  style={{
                                    fontSize: "0.84rem",
                                    color: "#0f172a",
                                  }}
                                >
                                  {lap.tps_nama || "TPS Surabaya"}
                                </strong>
                              </div>
                              <p
                                style={{
                                  margin: "4px 0 2px",
                                  fontSize: "0.78rem",
                                  color: "#475569",
                                  lineHeight: 1.35,
                                }}
                              >
                                {lap.deskripsi}
                              </p>
                              <span
                                style={{ fontSize: "0.7rem", color: "#94a3b8" }}
                              >
                                Dilaporkan:{" "}
                                {lap.tanggal_lapor
                                  ? lap.tanggal_lapor.includes("lalu")
                                    ? lap.tanggal_lapor
                                    : new Date(
                                        lap.tanggal_lapor,
                                      ).toLocaleDateString("id-ID")
                                  : "Baru saja"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleResolveLaporan(lap.id)}
                              disabled={isDone}
                              style={{
                                background: isDone ? "#f1f5f9" : "#059669",
                                color: isDone ? "#64748b" : "#ffffff",
                                border: isDone ? "1px solid #cbd5e1" : "none",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                cursor: isDone ? "default" : "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isDone ? "✓ Selesai" : "Tindak Lanjuti"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* DUA GRID BAWAH: PENGGUNA TERBARU & JADWAL MINGGU INI */}
                <div className="admin-dashboard-grid">
                  <div className="admin-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <h3 className="admin-card-title" style={{ margin: 0 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <IconUsers size={18} /> Pengguna Terbaru Sistem
                        </span>
                      </h3>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#0284c7",
                          fontWeight: 700,
                        }}
                      >
                        Total: {users.length} Pengguna
                      </span>
                    </div>
                    <div className="recent-users-list">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="recent-user-item">
                          <div className="recent-user-avatar">
                            {user.nama_lengkap?.charAt(0) || "U"}
                          </div>
                          <div className="recent-user-info">
                            <div className="recent-user-name">
                              {user.nama_lengkap}
                            </div>
                            <div className="recent-user-email">
                              {user.email}
                            </div>
                          </div>
                          <span className={`status-pill role-${user.role}`}>
                            {user.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="admin-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <h3 className="admin-card-title" style={{ margin: 0 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <IconCalendar size={18} /> Jadwal Pengambilan Minggu
                          Ini
                        </span>
                      </h3>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#ea580c",
                          fontWeight: 700,
                        }}
                      >
                        {jadwals.length} Rute
                      </span>
                    </div>
                    <div className="tps-realtime-list">
                      {jadwals.slice(0, 5).map((j) => (
                        <div key={j.id} className="tps-realtime-row">
                          <div className="tps-name-col">
                            <span>{j.hari}</span>
                          </div>
                          <div
                            style={{
                              flex: 1,
                              fontSize: "0.85rem",
                              color: "#64748b",
                            }}
                          >
                            {j.area} &bull; {j.waktu_mulai}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* PENGGUNA */}
        {activeMenu === "pengguna" && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">Daftar Seluruh Pengguna</h3>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAMA</th>
                      <th>EMAIL</th>
                      <th>ROLE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.nama_lengkap}</strong>
                        </td>
                        <td className="text-muted">{u.email}</td>
                        <td>
                          <span className={`role-pill role-${u.role}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className="status-pill status-aktif">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PETUGAS & ADMIN CRUD */}
        {activeMenu === "petugas" && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">
                  Kelola Akun Petugas & Admin
                </h3>
                <button
                  type="button"
                  className="btn-add-primary"
                  onClick={() => setShowAddUserModal(true)}
                >
                  + Tambah Akun
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>FOTO</th>
                      <th>NAMA</th>
                      <th>EMAIL</th>
                      <th>ROLE</th>
                      <th>WILAYAH TUGAS</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {petugasList.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.foto_url ? (
                            <img
                              src={`${API_BASE}${p.foto_url}`}
                              alt={p.nama_lengkap}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "1px solid #e2e8f0",
                              }}
                            />
                          ) : (
                            <span
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#e2e8f0",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "#64748b",
                              }}
                            >
                              {p.nama_lengkap?.charAt(0)?.toUpperCase() || "P"}
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>{p.nama_lengkap}</strong>
                        </td>
                        <td className="text-muted">{p.email}</td>
                        <td>
                          <span className={`role-pill role-${p.role}`}>
                            {p.role}
                          </span>
                        </td>
                        <td
                          className="text-muted"
                          style={{ fontSize: "0.82rem" }}
                        >
                          {[p.wilayah_kecamatan, p.wilayah_kelurahan]
                            .filter(Boolean)
                            .join(" — ") || (
                            <span style={{ color: "#94a3b8" }}>
                              Belum diatur
                            </span>
                          )}
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              type="button"
                              title="Lihat (merah)"
                              onClick={() => openViewUser(p)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "6px",
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.78rem",
                              }}
                            >
                              👁 View
                            </button>
                            <button
                              type="button"
                              title="Edit (hijau)"
                              onClick={() => openEditUser(p)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "6px",
                                border: "1px solid #bbf7d0",
                                background: "#f0fdf4",
                                color: "#166534",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.78rem",
                              }}
                            >
                              ✎ Edit
                            </button>
                            <button
                              type="button"
                              className="btn-table-delete"
                              onClick={() => handleDeleteUser(p.id)}
                            >
                              × Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TPS CRUD */}
        {activeMenu === "tps" && (
          <div className="admin-content-view">
            {/* Peta Lokasi TPS */}
            <TpsMapSuperadmin
              tpsList={tpsList}
              onTpsClick={(tps) => {
                // Scroll ke tabel dan highlight TPS yang dipilih
                const tableCard = document.querySelector(".full-table-card");
                if (tableCard) {
                  tableCard.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }}
            />

            <div className="admin-card full-table-card">
              <div
                className="table-header-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <h3 className="admin-card-title" style={{ margin: 0 }}>
                  Kelola Data TPS
                </h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Search Input (Orange style) */}
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Cari TPS..."
                      value={tpsSearchQuery}
                      onChange={(e) => setTpsSearchQuery(e.target.value)}
                      style={{
                        padding: "8px 12px 8px 34px",
                        borderRadius: "6px",
                        border: "1.5px solid #f97316",
                        fontSize: "0.85rem",
                        outline: "none",
                        width: "200px",
                        color: "#1e293b",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        left: "10px",
                        color: "#f97316",
                        fontSize: "0.9rem",
                      }}
                    >
                      🔍
                    </span>
                    {tpsSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTpsSearchQuery("")}
                        style={{
                          position: "absolute",
                          right: "8px",
                          border: "none",
                          background: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Button (Red style with Popover) */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTpsFilterPopover(!showTpsFilterPopover);
                      }}
                      style={{
                        background:
                          tpsFilterKecamatan ||
                          tpsFilterKelurahan ||
                          tpsFilterStatus ||
                          tpsFilterCapacity.min ||
                          tpsFilterCapacity.max
                            ? "#dc2626"
                            : "#ef4444",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>🌪️ Filter</span>
                      {(tpsFilterKecamatan ||
                        tpsFilterKelurahan ||
                        tpsFilterStatus ||
                        tpsFilterCapacity.min ||
                        tpsFilterCapacity.max) && (
                        <span
                          style={{
                            background: "#ffffff",
                            color: "#dc2626",
                            borderRadius: "50%",
                            width: "18px",
                            height: "18px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                          }}
                        >
                          !
                        </span>
                      )}
                    </button>

                    {/* Filter Popover */}
                    {showTpsFilterPopover && (
                      <div
                        data-tps-filter-popover
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: "100%",
                          right: 0,
                          marginTop: "8px",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                          padding: "16px",
                          width: "280px",
                          zIndex: 100,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "12px",
                            borderBottom: "1px solid #f1f5f9",
                            paddingBottom: "8px",
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "0.9rem",
                              fontWeight: 700,
                              color: "#0f172a",
                            }}
                          >
                            Filter TPS
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowTpsFilterPopover(false)}
                            style={{
                              border: "none",
                              background: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              fontSize: "0.9rem",
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                color: "#475569",
                                marginBottom: "4px",
                              }}
                            >
                              Kecamatan
                            </label>
                            <select
                              value={tpsFilterKecamatan}
                              onChange={(e) => {
                                setTpsFilterKecamatan(e.target.value);
                                setTpsFilterKelurahan("");
                              }}
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.82rem",
                              }}
                            >
                              <option value="">Semua Kecamatan</option>
                              {kecamatanOptions.map((k) => (
                                <option key={k} value={k}>
                                  {k}
                                </option>
                              ))}
                            </select>
                          </div>

                          {tpsFilterKecamatan &&
                            availableKelurahan.length > 0 && (
                              <div>
                                <label
                                  style={{
                                    display: "block",
                                    fontSize: "0.78rem",
                                    fontWeight: 600,
                                    color: "#475569",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Kelurahan
                                </label>
                                <select
                                  value={tpsFilterKelurahan}
                                  onChange={(e) =>
                                    setTpsFilterKelurahan(e.target.value)
                                  }
                                  style={{
                                    width: "100%",
                                    padding: "6px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.82rem",
                                  }}
                                >
                                  <option value="">Semua Kelurahan</option>
                                  {availableKelurahan.map((k) => (
                                    <option key={k} value={k}>
                                      {k}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                color: "#475569",
                                marginBottom: "4px",
                              }}
                            >
                              Status
                            </label>
                            <select
                              value={tpsFilterStatus}
                              onChange={(e) =>
                                setTpsFilterStatus(e.target.value)
                              }
                              style={{
                                width: "100%",
                                padding: "6px 8px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.82rem",
                              }}
                            >
                              <option value="">Semua Status</option>
                              <option value="Aktif">Aktif</option>
                              <option value="Tidak Aktif">Tidak Aktif</option>
                            </select>
                          </div>

                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                color: "#475569",
                                marginBottom: "4px",
                              }}
                            >
                              Daya Tampung (m³)
                            </label>
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                alignItems: "center",
                              }}
                            >
                              <input
                                type="number"
                                placeholder="Min"
                                value={tpsFilterCapacity.min}
                                onChange={(e) =>
                                  setTpsFilterCapacity({
                                    ...tpsFilterCapacity,
                                    min: e.target.value,
                                  })
                                }
                                style={{
                                  width: "50%",
                                  padding: "6px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "0.82rem",
                                }}
                              />
                              <span
                                style={{ fontSize: "0.8rem", color: "#94a3b8" }}
                              >
                                -
                              </span>
                              <input
                                type="number"
                                placeholder="Max"
                                value={tpsFilterCapacity.max}
                                onChange={(e) =>
                                  setTpsFilterCapacity({
                                    ...tpsFilterCapacity,
                                    max: e.target.value,
                                  })
                                }
                                style={{
                                  width: "50%",
                                  padding: "6px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #cbd5e1",
                                  fontSize: "0.82rem",
                                }}
                              />
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              marginTop: "8px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setShowTpsFilterPopover(false);
                              }}
                              style={{
                                flex: 1,
                                background: "#dc2626",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Terapkan
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                resetTpsFilters();
                                setShowTpsFilterPopover(false);
                              }}
                              style={{
                                flex: 1,
                                background: "#f1f5f9",
                                color: "#475569",
                                border: "none",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tambah TPS Button (Green style) */}
                  <button
                    type="button"
                    className="btn-add-primary"
                    onClick={() => {
                      setEditingTpsId(null);
                      setNewTps({
                        nama: "",
                        kecamatan: "",
                        wilayah_kota: "Surabaya Pusat",
                        lokasi: "",
                        jenis_tps: "TPS Resmi",
                        latitude: "",
                        longitude: "",
                        jumlah_container: "",
                        daya_tampung_m3: "",
                        status: "Aktif",
                      });
                      setShowAddTpsModal(true);
                    }}
                  >
                    + Tambah TPS
                  </button>
                </div>
              </div>

              {/* Result Stats Bar */}
              <div
                style={{
                  padding: "8px 16px",
                  background: "#f8fafc",
                  borderBottom: "1px solid #e2e8f0",
                  fontSize: "0.8rem",
                  color: "#64748b",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  Menampilkan <strong>{tpsFilteredList.length}</strong> dari
                  total <strong>{tpsList.length}</strong> TPS
                </span>
                {(tpsSearchQuery ||
                  tpsFilterKecamatan ||
                  tpsFilterKelurahan ||
                  tpsFilterStatus ||
                  tpsFilterCapacity.min ||
                  tpsFilterCapacity.max) && (
                  <button
                    type="button"
                    onClick={resetTpsFilters}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>NAMA TPS</th>
                      <th>KECAMATAN</th>
                      <th>WILAYAH</th>
                      <th>LOKASI</th>
                      <th>LAT/LNG</th>
                      <th>CONTAINER</th>
                      <th>DAYA (m³)</th>
                      <th>STATUS</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tpsFilteredList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="9"
                          style={{
                            textAlign: "center",
                            padding: "32px 16px",
                            color: "#64748b",
                          }}
                        >
                          <div
                            style={{ fontSize: "1.2rem", marginBottom: "4px" }}
                          >
                            🔍
                          </div>
                          <div>
                            Tidak ada data TPS yang sesuai dengan
                            filter/pencarian.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tpsFilteredList.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <strong>{t.nama}</strong>
                          </td>
                          <td>{t.kecamatan}</td>
                          <td>{t.wilayah_kota}</td>
                          <td className="text-muted">{t.lokasi || "—"}</td>
                          <td
                            className="text-muted"
                            style={{ fontSize: "0.8rem" }}
                          >
                            {t.latitude && t.longitude
                              ? `${t.latitude}, ${t.longitude}`
                              : "—"}
                          </td>
                          <td>{t.jumlah_container || "—"}</td>
                          <td>{t.daya_tampung_m3 ?? "—"}</td>
                          <td>
                            <span
                              className={`status-pill ${t.status === "Aktif" ? "status-aktif" : ""}`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                className="btn-table-edit"
                                style={{
                                  background: "#0284c7",
                                  color: "#fff",
                                  border: "none",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                }}
                                onClick={() => handleEditTps(t)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-table-delete"
                                onClick={() => handleDeleteTps(t.id)}
                              >
                                &times; Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* JADWAL CRUD */}
        {activeMenu === "jadwal" && (
          <div className="admin-content-view">
            <div className="admin-card full-table-card">
              <div className="table-header-row">
                <h3 className="admin-card-title">
                  CRUD Jadwal Pengambilan Sampah
                </h3>
                <button
                  type="button"
                  className="btn-add-primary"
                  onClick={() => {
                    setEditingJadwal(null);
                    setShowAddJadwalModal(true);
                  }}
                >
                  + Tambah Jadwal
                </button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>HARI</th>
                      <th>AREA</th>
                      <th>WAKTU</th>
                      <th>PETUGAS</th>
                      <th>KECAMATAN</th>
                      <th>KELURAHAN</th>
                      <th>TIPE</th>
                      <th>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jadwals.map((j) => (
                      <tr key={j.id}>
                        <td><strong>{j.hari}</strong></td>
                        <td>{j.area}</td>
                        <td>
                          {j.waktu_mulai} - {j.waktu_selesai}
                        </td>
                        <td>{j.petugas || "—"}</td>
                        <td>{j.kecamatan || "—"}</td>
                        <td>{j.kelurahan || "—"}</td>
                        <td>
                          <span className={`status-pill ${j.tipe === "Libur" ? "status-nonaktif" : j.tipe === "Besar" ? "status-aktif" : ""}`}>
                            {j.tipe}
                          </span>
                        </td>
                        <td style={{display:"flex",gap:"6px"}}>
                          <button
                            type="button"
                            className="btn-table-edit"
                            style={{background:"#0284c7",color:"#fff",border:"none",padding:"4px 8px",borderRadius:"4px",cursor:"pointer"}}
                            onClick={() => {
                              setEditingJadwal({...j});
                              setJadwalFilterKec(j.kecamatan||"");
                              setJadwalFilterKel(j.kelurahan||"");
                              setShowEditJadwalModal(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-table-delete"
                            onClick={() => handleDeleteJadwal(j.id)}
                          >
                            &times; Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PENGATURAN */}
        {activeMenu === "pengaturan" && (
          <div className="admin-content-view">
            <div className="admin-card">
              <h3 className="admin-card-title">Pengaturan Website</h3>
              <form
                onSubmit={handleUpdateSettings}
                style={{ marginTop: "24px" }}
              >
                <div className="form-group">
                  <label className="form-label">Nama Website</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={settings.website_name}
                    onChange={(e) =>
                      setSettings({ ...settings, website_name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Website</label>
                  <input
                    type="email"
                    className="settings-input"
                    value={settings.website_email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        website_email: e.target.value,
                      })
                    }
                  />
                </div>

                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "20px",
                    marginTop: "20px",
                  }}
                >
                  <h4
                    style={{
                      marginBottom: "16px",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      color: "#1e293b",
                    }}
                  >
                    Ganti Password Superadmin
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Password Saat Ini</label>
                    <input
                      type="password"
                      className="settings-input"
                      placeholder="Masukkan password saat ini"
                      value={settings.current_password}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          current_password: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password Baru</label>
                    <input
                      type="password"
                      className="settings-input"
                      placeholder="Masukkan password baru (kosongkan jika tidak ingin mengubah)"
                      value={settings.new_password}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          new_password: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    marginTop: "24px",
                  }}
                >
                  <button
                    type="submit"
                    className="btn-add-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Tambah User + foto + dropdown kecamatan/kelurahan seperti register warga */}
      {showAddUserModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddUserModal(false)}
        >
          <div
            className="modal-dialog admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Tambah Akun Petugas / Admin</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddUserModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddUser} style={{ padding: "24px" }}>
              <div className="form-group">
                <label className="form-label">Foto Petugas</label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  {newUserFotoPreview ? (
                    <img
                      src={newUserFotoPreview}
                      alt="preview"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#e2e8f0",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      📷
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setNewUserFotoFile(f);
                      setNewUserFotoPreview(URL.createObjectURL(f));
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="settings-input"
                  value={newUser.nama_lengkap}
                  onChange={(e) =>
                    setNewUser({ ...newUser, nama_lengkap: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email (@sipetasan.com)</label>
                <input
                  type="email"
                  required
                  className="settings-input"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  className="settings-input"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <SearchableSelect
                  value={newUser.role}
                  onChange={(value) =>
                    setNewUser({
                      ...newUser,
                      role: value,
                      wilayah_kecamatan: "",
                      wilayah_kelurahan: "",
                    })
                  }
                  options={[
                    { id: "admin", nama: "Admin" },
                    { id: "superadmin", nama: "Superadmin" },
                    { id: "petugas_pengangkut", nama: "Petugas Pengangkut" },
                    { id: "driver", nama: "Driver" },
                    { id: "petugas_kelurahan", nama: "Petugas Kelurahan" },
                    { id: "petugas_tps", nama: "Petugas TPS" },
                  ]}
                  getOptionLabel={(opt) => opt.nama}
                  getOptionValue={(opt) => opt.id}
                  placeholder="— Pilih Role —"
                  searchPlaceholder="Cari role..."
                  required
                />
              </div>
              {(newUser.role === "driver" ||
                newUser.role === "petugas_kelurahan" ||
                newUser.role === "petugas_pengangkut" ||
                newUser.role === "petugas_tps") && (
                <>
                  <div className="form-group">
                    <label className="form-label">Kecamatan Tugas</label>
                    <SearchableSelect
                      value={newUser.wilayah_kecamatan}
                      onChange={(value) =>
                        setNewUser({
                          ...newUser,
                          wilayah_kecamatan: value,
                          wilayah_kelurahan: "",
                        })
                      }
                      options={kecamatanOptions}
                      getOptionLabel={(opt) => opt.nama}
                      getOptionValue={(opt) => opt.nama}
                      placeholder="— Pilih Kecamatan —"
                      searchPlaceholder="Cari kecamatan..."
                      disabled={!newUser.role}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kelurahan Tugas</label>
                    <SearchableSelect
                      value={newUser.wilayah_kelurahan}
                      onChange={(value) =>
                        setNewUser({
                          ...newUser,
                          wilayah_kelurahan: value,
                        })
                      }
                      options={kelurahanOptions}
                      getOptionLabel={(opt) => opt.nama}
                      getOptionValue={(opt) => opt.nama}
                      placeholder="— Pilih Kelurahan —"
                      searchPlaceholder="Cari kelurahan..."
                      disabled={!newUser.wilayah_kecamatan}
                    />
                  </div>
                </>
              )}
              {(newUser.role === "petugas_tps") && (
                <div className="form-group">
                  <label className="form-label">TPS Tanggung Jawab</label>
                  <SearchableSelect
                    value={newUser.tps_ids || []}
                    onChange={(value) =>
                      setNewUser({ ...newUser, tps_ids: value || [] })
                    }
                    options={tpsOptions.length > 0 ? tpsOptions : tpsList}
                    getOptionLabel={(opt) => `${opt.nama} (${opt.kecamatan}${opt.kelurahan ? `, ${opt.kelurahan}` : ''})`}
                    getOptionValue={(opt) => opt.id}
                    getOptionDescription={(opt) => opt.kecamatan}
                    placeholder="— Pilih TPS —"
                    searchPlaceholder="Cari TPS..."
                    multiple
                    disabled={!newUser.wilayah_kecamatan}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {newUser.wilayah_kecamatan ? "Pilih satu atau beberapa TPS" : "Pilih Kecamatan terlebih dahulu untuk menampilkan daftar TPS"}
                  </small>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-add-primary"
                  disabled={isLoading}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL Edit (hijau): form sama kayak tambah + ganti foto + dropdown wilayah */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div
            className="modal-dialog admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Edit Petugas / Admin</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditUser(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateUser} style={{ padding: "24px" }}>
              <div className="form-group">
                <label className="form-label">Foto Petugas</label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  {editFotoPreview ? (
                    <img
                      src={editFotoPreview}
                      alt="preview"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#e2e8f0",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      📷
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setEditFotoFile(f);
                      setEditFotoPreview(URL.createObjectURL(f));
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="settings-input"
                  value={editUser.nama_lengkap}
                  onChange={(e) =>
                    setEditUser({ ...editUser, nama_lengkap: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  disabled
                  className="settings-input"
                  value={editUser.email}
                  style={{ opacity: 0.6 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <SearchableSelect
                  value={editUser.role}
                  onChange={(value) =>
                    setEditUser({
                      ...editUser,
                      role: value,
                      wilayah_kecamatan: "",
                      wilayah_kelurahan: "",
                    })
                  }
                  options={[
                    { id: "admin", nama: "Admin" },
                    { id: "superadmin", nama: "Superadmin" },
                    { id: "driver", nama: "Driver" },
                    { id: "petugas_kelurahan", nama: "Petugas Kelurahan" },
                    { id: "petugas_pengangkut", nama: "Petugas Pengangkut" },
                    { id: "petugas_tps", nama: "Petugas TPS" },
                  ]}
                  getOptionLabel={(opt) => opt.nama}
                  getOptionValue={(opt) => opt.id}
                  placeholder="— Pilih Role —"
                  searchPlaceholder="Cari role..."
                />
              </div>
              {(editUser.role === "petugas_pengangkut" ||
                editUser.role === "driver" ||
                editUser.role === "petugas_kelurahan" ||
                editUser.role === "petugas_tps") && (
                <>
                  <div className="form-group">
                    <label className="form-label">Kecamatan Tugas</label>
                    <SearchableSelect
                      value={editUser.wilayah_kecamatan}
                      onChange={(value) =>
                        setEditUser({
                          ...editUser,
                          wilayah_kecamatan: value,
                          wilayah_kelurahan: "",
                        })
                      }
                      options={kecamatanOptions}
                      getOptionLabel={(opt) => opt.nama}
                      getOptionValue={(opt) => opt.nama}
                      placeholder="— Pilih Kecamatan —"
                      searchPlaceholder="Cari kecamatan..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kelurahan Tugas</label>
                    <SearchableSelect
                      value={editUser.wilayah_kelurahan}
                      onChange={(value) =>
                        setEditUser({
                          ...editUser,
                          wilayah_kelurahan: value,
                        })
                      }
                      options={kelurahanOptions}
                      getOptionLabel={(opt) => opt.nama}
                      getOptionValue={(opt) => opt.nama}
                      placeholder="— Pilih Kelurahan —"
                      searchPlaceholder="Cari kelurahan..."
                      disabled={!editUser.wilayah_kecamatan}
                    />
                  </div>
                </>
              )}
              {(editUser.role === "petugas_tps") && (
                <div className="form-group">
                  <label className="form-label">TPS Tanggung Jawab</label>
                  <SearchableSelect
                    value={editUser.tps_ids || []}
                    onChange={(value) =>
                      setEditUser({ ...editUser, tps_ids: value || [] })
                    }
                    options={tpsOptions.length > 0 ? tpsOptions : tpsList}
                    getOptionLabel={(opt) => `${opt.nama} (${opt.kecamatan}${opt.kelurahan ? `, ${opt.kelurahan}` : ''})`}
                    getOptionValue={(opt) => opt.id}
                    getOptionDescription={(opt) => opt.kecamatan}
                    placeholder="— Pilih TPS —"
                    searchPlaceholder="Cari TPS..."
                    multiple
                    disabled={!editUser.wilayah_kecamatan}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {editUser.wilayah_kecamatan ? "Pilih satu atau beberapa TPS" : "Pilih Kecamatan terlebih dahulu untuk menampilkan daftar TPS"}
                  </small>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-add-primary"
                  disabled={isLoading}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL View (merah): lihat data + foto */}
      {viewUser && (
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div
            className="modal-dialog admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Detail Petugas</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewUser(null)}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: "24px", display: "flex", gap: "16px" }}>
              {viewUser.foto_url ? (
                <img
                  src={`${API_BASE}${viewUser.foto_url}`}
                  alt={viewUser.nama_lengkap}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "12px",
                    objectFit: "cover",
                    border: "1px solid #e2e8f0",
                  }}
                />
              ) : (
                <span
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "12px",
                    background: "#e2e8f0",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#64748b",
                  }}
                >
                  {viewUser.nama_lengkap?.charAt(0)?.toUpperCase()}
                </span>
              )}
              <div style={{ fontSize: "0.88rem", lineHeight: 1.7 }}>
                <div>
                  <b>Nama:</b> {viewUser.nama_lengkap}
                </div>
                <div>
                  <b>Email:</b> {viewUser.email}
                </div>
                <div>
                  <b>Role:</b> {viewUser.role}
                </div>
                <div>
                  <b>Tugas:</b>{" "}
                  {[viewUser.wilayah_kecamatan, viewUser.wilayah_kelurahan]
                    .filter(Boolean)
                    .join(" — ") || "Belum diatur"}
                </div>
                <div>
                  <b>Status:</b> {viewUser.is_active ? "Aktif" : "Nonaktif"}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "0 24px 24px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setViewUser(null);
                  openEditUser(viewUser);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#166534",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Jadwal */}
      {showAddJadwalModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddJadwalModal(false)}
        >
          <div
            className="modal-dialog admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Tambah Jadwal Pengambilan</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddJadwalModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddJadwal} style={{ padding: "24px" }}>
              <div className="form-group">
                <label className="form-label">Hari</label>
                <select
                  required
                  className="settings-input"
                  value={newJadwal.hari}
                  onChange={(e) =>
                    setNewJadwal({ ...newJadwal, hari: e.target.value })
                  }
                >
                  <option value="">Pilih Hari</option>
                  {["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div style={{display:"flex",gap:"12px"}}>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Waktu Mulai</label>
                  <input
                    type="time"
                    required
                    className="settings-input"
                    value={newJadwal.waktu_mulai}
                    onChange={(e) =>
                      setNewJadwal({ ...newJadwal, waktu_mulai: e.target.value })
                    }
                  />
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Waktu Selesai</label>
                  <input
                    type="time"
                    required
                    className="settings-input"
                    value={newJadwal.waktu_selesai}
                    onChange={(e) =>
                      setNewJadwal({ ...newJadwal, waktu_selesai: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Area / Zona</label>
                <input
                  type="text"
                  required
                  className="settings-input"
                  value={newJadwal.area}
                  onChange={(e) =>
                    setNewJadwal({ ...newJadwal, area: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tipe Jadwal</label>
                <select
                  className="settings-input"
                  value={newJadwal.tipe}
                  onChange={(e) =>
                    setNewJadwal({ ...newJadwal, tipe: e.target.value })
                  }
                >
                  <option value="Rutin">Rutin</option>
                  <option value="Besar">Besar</option>
                  <option value="Libur">Libur</option>
                </select>
              </div>
              <div style={{display:"flex",gap:"12px"}}>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Kecamatan</label>
                  <select
                    required
                    className="settings-input"
                    value={newJadwal.kecamatan}
                    onChange={(e) => {
                      const kec = e.target.value;
                      setNewJadwal({ ...newJadwal, kecamatan: kec, kelurahan: "", petugas_id: null, petugas: "" });
                      setJadwalFilterKec(kec);
                      setJadwalFilterKel("");
                      if (kec) fetchPetugasList(kec, "");
                    }}
                  >
                    <option value="">Pilih Kecamatan</option>
                    {kecamatanOptions.map((k) => (
                      <option key={k.id || k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Kelurahan</label>
                  <select
                    required
                    className="settings-input"
                    value={newJadwal.kelurahan}
                    onChange={(e) => {
                      const kel = e.target.value;
                      setNewJadwal({ ...newJadwal, kelurahan: kel, petugas_id: null, petugas: "" });
                      setJadwalFilterKel(kel);
                      if (newJadwal.kecamatan && kel) fetchPetugasList(newJadwal.kecamatan, kel);
                    }}
                  >
                    <option value="">Pilih Kelurahan</option>
                    {kelurahanOptions.map((k) => (
                      <option key={k.id || k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Petugas Pengangkut</label>
                <SearchableSelect
                  value={newJadwal.petugas_id ? String(newJadwal.petugas_id) : ""}
                  onChange={(value) => {
                    const id = value ? parseInt(value) : null;
                    const p = petugasOptions.find((x) => x.id === id);
                    setNewJadwal({ ...newJadwal, petugas_id: id, petugas: p ? p.nama_lengkap : "" });
                  }}
                  options={petugasOptions.map((p) => ({
                    id: p.id,
                    nama: `${p.nama_lengkap} (${p.wilayah_kecamatan}/${p.wilayah_kelurahan})`,
                  }))}
                  getOptionLabel={(opt) => opt.nama}
                  getOptionValue={(opt) => String(opt.id)}
                  placeholder="Pilih Petugas..."
                  searchPlaceholder="Cari petugas..."
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddJadwalModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-add-primary"
                  disabled={isLoading}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Jadwal */}
      {showEditJadwalModal && editingJadwal && (
        <div
          className="modal-overlay"
          onClick={() => { setShowEditJadwalModal(false); setEditingJadwal(null); }}
        >
          <div
            className="modal-dialog admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Edit Jadwal Pengambilan</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => { setShowEditJadwalModal(false); setEditingJadwal(null); }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleEditJadwal} style={{ padding: "24px" }}>
              <div className="form-group">
                <label className="form-label">Hari</label>
                <select
                  required
                  className="settings-input"
                  value={editingJadwal.hari}
                  onChange={(e) => setEditingJadwal({ ...editingJadwal, hari: e.target.value })}
                >
                  <option value="">Pilih Hari</option>
                  {["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div style={{display:"flex",gap:"12px"}}>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Waktu Mulai</label>
                  <input
                    type="time"
                    required
                    className="settings-input"
                    value={editingJadwal.waktu_mulai || ""}
                    onChange={(e) => setEditingJadwal({ ...editingJadwal, waktu_mulai: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Waktu Selesai</label>
                  <input
                    type="time"
                    required
                    className="settings-input"
                    value={editingJadwal.waktu_selesai || ""}
                    onChange={(e) => setEditingJadwal({ ...editingJadwal, waktu_selesai: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Area / Zona</label>
                <input
                  type="text"
                  required
                  className="settings-input"
                  value={editingJadwal.area || ""}
                  onChange={(e) => setEditingJadwal({ ...editingJadwal, area: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tipe Jadwal</label>
                <select
                  className="settings-input"
                  value={editingJadwal.tipe || "Rutin"}
                  onChange={(e) => setEditingJadwal({ ...editingJadwal, tipe: e.target.value })}
                >
                  <option value="Rutin">Rutin</option>
                  <option value="Besar">Besar</option>
                  <option value="Libur">Libur</option>
                </select>
              </div>
              <div style={{display:"flex",gap:"12px"}}>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Kecamatan</label>
                  <select
                    className="settings-input"
                    value={editingJadwal.kecamatan || ""}
                    onChange={(e) => {
                      const kec = e.target.value;
                      setEditingJadwal({ ...editingJadwal, kecamatan: kec, kelurahan: "", petugas_id: null, petugas: "" });
                      setJadwalFilterKec(kec);
                      setJadwalFilterKel("");
                      if (kec) fetchPetugasList(kec, "");
                    }}
                  >
                    <option value="">Pilih Kecamatan</option>
                    {kecamatanOptions.map((k) => (
                      <option key={k.id || k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label className="form-label">Kelurahan</label>
                  <select
                    className="settings-input"
                    value={editingJadwal.kelurahan || ""}
                    onChange={(e) => {
                      const kel = e.target.value;
                      setEditingJadwal({ ...editingJadwal, kelurahan: kel, petugas_id: null, petugas: "" });
                      setJadwalFilterKel(kel);
                      if (editingJadwal.kecamatan && kel) fetchPetugasList(editingJadwal.kecamatan, kel);
                    }}
                  >
                    <option value="">Pilih Kelurahan</option>
                    {kelurahanOptions.map((k) => (
                      <option key={k.id || k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Petugas Pengangkut</label>
                <SearchableSelect
                  value={editingJadwal.petugas_id ? String(editingJadwal.petugas_id) : ""}
                  onChange={(value) => {
                    const id = value ? parseInt(value) : null;
                    const p = petugasOptions.find((x) => x.id === id);
                    setEditingJadwal({ ...editingJadwal, petugas_id: id, petugas: p ? p.nama_lengkap : "" });
                  }}
                  options={petugasOptions.map((p) => ({
                    id: p.id,
                    nama: `${p.nama_lengkap} ({p.wilayah_kecamatan}/{p.wilayah_kelurahan})`,
                  }))}
                  getOptionLabel={(opt) => opt.nama}
                  getOptionValue={(opt) => String(opt.id)}
                  placeholder="Pilih Petugas..."
                  searchPlaceholder="Cari petugas..."
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => { setShowEditJadwalModal(false); setEditingJadwal(null); }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-add-primary"
                  disabled={isLoading}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit TPS */}
      {showAddTpsModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddTpsModal(false);
            setEditingTpsId(null);
          }}
        >
          <div
            className="modal-dialog admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTpsId ? "Edit TPS" : "Tambah TPS Baru"}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowAddTpsModal(false);
                  setEditingTpsId(null);
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddTps} style={{ padding: "24px" }}>
              <div className="form-group">
                <label className="form-label">Nama TPS *</label>
                <input
                  type="text"
                  required
                  placeholder="TPS Keputih"
                  className="settings-input"
                  value={newTps.nama}
                  onChange={(e) =>
                    setNewTps({ ...newTps, nama: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kecamatan *</label>
                <input
                  type="text"
                  required
                  placeholder="Sukolilo"
                  className="settings-input"
                  value={newTps.kecamatan}
                  onChange={(e) =>
                    setNewTps({ ...newTps, kecamatan: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Wilayah Kota *</label>
                <select
                  required
                  className="settings-input"
                  value={newTps.wilayah_kota}
                  onChange={(e) =>
                    setNewTps({ ...newTps, wilayah_kota: e.target.value })
                  }
                >
                  <option value="Surabaya Pusat">Surabaya Pusat</option>
                  <option value="Surabaya Utara">Surabaya Utara</option>
                  <option value="Surabaya Selatan">Surabaya Selatan</option>
                  <option value="Surabaya Barat">Surabaya Barat</option>
                  <option value="Surabaya Timur">Surabaya Timur</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Lokasi / Alamat</label>
                <input
                  type="text"
                  placeholder="Jl. Keputih No. 10"
                  className="settings-input"
                  value={newTps.lokasi}
                  onChange={(e) =>
                    setNewTps({ ...newTps, lokasi: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jenis TPS</label>
                <select
                  className="settings-input"
                  value={newTps.jenis_tps}
                  onChange={(e) =>
                    setNewTps({ ...newTps, jenis_tps: e.target.value })
                  }
                >
                  <option value="TPS Resmi">TPS Resmi</option>
                  <option value="TPS Liar">TPS Liar</option>
                  <option value="TPS Sementara">TPS Sementara</option>
                  <option value="Depo">Depo</option>
                </select>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="-7.2575"
                    className="settings-input"
                    value={newTps.latitude}
                    onChange={(e) =>
                      setNewTps({ ...newTps, latitude: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="112.7521"
                    className="settings-input"
                    value={newTps.longitude}
                    onChange={(e) =>
                      setNewTps({ ...newTps, longitude: e.target.value })
                    }
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Jumlah Container</label>
                  <input
                    type="text"
                    placeholder="2 (contoh: 50)"
                    className="settings-input"
                    value={newTps.jumlah_container}
                    onChange={(e) =>
                      setNewTps({ ...newTps, jumlah_container: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Daya Tampung (m³)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="28.00"
                    className="settings-input"
                    value={newTps.daya_tampung_m3}
                    onChange={(e) =>
                      setNewTps({ ...newTps, daya_tampung_m3: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="settings-input"
                  value={newTps.status}
                  onChange={(e) =>
                    setNewTps({ ...newTps, status: e.target.value })
                  }
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTpsModal(false);
                    setEditingTpsId(null);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-add-primary"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Menyimpan..."
                    : editingTpsId
                      ? "Update"
                      : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
