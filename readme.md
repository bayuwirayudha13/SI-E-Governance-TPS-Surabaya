struktur folder
project web/
├── backend/                # Backend API (FastAPI)
│   ├── auth/               # Autentikasi & Otorisasi
│   ├── core/               # Konfigurasi inti & Database
│   ├── models/             # SQLAlchemy Models
│   ├── routes/             # API Endpoints
│   ├── schemas/            # Pydantic Schemas
│   ├── services/           # Business Logic
│   ├── uploads/            # File penyimpanan (foto, dll)
│   ├── utils/              # Helper functions
│   ├── main.py             # Entry point backend
│   ├── requirements.txt    # Dependency Python
│   └── *.py                # Skrip migrasi & utility database
├── frontend/               # Frontend (React + Vite)
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── api/            # Konfigurasi API client
│   │   ├── assets/         # Image, icons, css
│   │   ├── components/     # UI Components
│   │   ├── data/           # Mock data / constants
│   │   ├── services/       # Service layer
│   │   ├── App.jsx         # Root component
│   │   └── main.jsx        # Entry point frontend
│   ├── index.html
│   ├── package.json        # Dependency & Scripts
│   └── vite.config.js      # Konfigurasi Vite
├── logs/                   # Log aplikasi
├── script-lokasi-tps/      # Skrip data lokasi TPS
├── uploads/                # Root upload directory
├── .gitignore
├── FastAPI.bat             # Runner backend (Windows)
├── React.bat               # Runner frontend (Windows)
├── main.py                 # Root entry point (opsional)
├── prd_si_petasan_surabaya.md # Dokumentasi PRD
├── readme.md               # Panduan utama
├── start.sh / start.ps1    # Skrip automasi jalan
└── stop.sh / stop.ps1      # Skrip automasi berhenti


struktur detail
project web/
├── backend/
│   ├── auth/
│   │   ├── dependencies.py
│   │   ├── otp.py
│   │   ├── routes.py
│   │   └── token_service.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── timezone.py
│   ├── models/
│   │   ├── chat.py
│   │   ├── jadwal.py
│   │   ├── laporan.py
│   │   ├── pengambilan.py
│   │   ├── scan_history.py
│   │   ├── setoran.py
│   │   ├── settings.py
│   │   ├── token.py
│   │   ├── tps.py
│   │   ├── tps_kelurahan.py
│   │   ├── tukar_reward.py
│   │   ├── users.py
│   │   ├── warga.py
│   │   └── wilayah.py
│   ├── routes/
│   │   ├── admin_routes.py
│   │   ├── chat_routes.py
│   │   ├── chat_ws.py
│   │   ├── dashboard_routes.py
│   │   ├── jadwal_routes.py
│   │   ├── laporan_routes.py
│   │   ├── pengambilan_routes.py
│   │   ├── petugas_integrated_routes.py
│   │   ├── qr_routes.py
│   │   ├── setoran_routes.py
│   │   ├── tps_routes.py
│   │   ├── tukar_reward_routes.py
│   │   └── wilayah_routes.py
│   ├── schemas/
│   │   ├── chat.py
│   │   ├── jadwal_schema.py
│   │   ├── laporan_schema.py
│   │   ├── otp.py
│   │   ├── setoran_schema.py
│   │   ├── settings_schema.py
│   │   ├── tps_schema.py
│   │   ├── tukar_reward_schema.py
│   │   ├── user_schema.py
│   │   └── wilayah_schema.py
│   ├── services/
│   │   ├── admin_service.py
│   │   ├── chat_auth.py
│   │   ├── chat_manager.py
│   │   ├── chatbot_service.py
│   │   ├── email_service.py
│   │   ├── jadwal_service.py
│   │   ├── laporan_service.py
│   │   ├── setoran_service.py
│   │   ├── tps_service.py
│   │   ├── tukar_reward_service.py
│   │   └── wilayah_service.py
│   ├── utils/
│   │   └── otp.py
│   ├── uploads/
│   ├── main.py
│   ├── requirements.txt
│   ├── sampapintar.db
│   └── [berbagai script migrasi & testing .py]
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── inactivity.js
│   │   │   ├── tps.js
│   │   │   └── useInactivityLogout.js
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   └── [berbagai file .svg & .png]
│   │   ├── components/
│   │   │   ├── About.jsx
│   │   │   ├── AdminChat.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── AuthPage.jsx
│   │   │   ├── ... (komponen UI lainnya)
│   │   │   └── WargaPanel.jsx
│   │   ├── data/
│   │   │   ├── mockData.js
│   │   │   └── tpsSurabayaData.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── [file konfigurasi frontend]
├── script-lokasi-tps/
│   ├── geocode_tps_sipetasan.py
│   └── [file excel data TPS hasil geocoding]
├── logs/
│   ├── backend.pid
│   └── frontend.pid
├── .venv/
├── .vscode/
├── node_modules/
├── FastAPI.bat
├── React.bat
├── main.py
├── package.json
├── readme.md
└── [dokumen Markdown .md lainnya]
