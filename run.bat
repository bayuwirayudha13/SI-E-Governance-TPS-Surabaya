
@echo off
title SI-PETASAN Launcher

set "ROOT=D:\Tugas\Semester 3\Workshop Pemograman Framework\project web"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
set "CLOUDFLARED=D:\Download\cloudflared-windows-amd64.exe"

echo ==========================================
echo       SI-PETASAN AUTOMATIC LAUNCHER
echo ==========================================
echo.

:: 1. Jalankan Backend FastAPI
echo [1/4] Menjalankan Backend FastAPI...

start "SI-PETASAN Backend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%BACKEND%'; .\venv\Scripts\Activate.ps1; python -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: Tunggu backend mulai
timeout /t 3 /nobreak >nul

:: 2. Build Frontend Production
echo [2/4] Build Frontend Production...

cd /d "%FRONTEND%"
call npm run build

if errorlevel 1 (
    echo.
    echo ERROR: Frontend build gagal!
    pause
    exit /b 1
)

:: 3. Jalankan Frontend Preview
echo [3/4] Menjalankan Frontend Production...

start "SI-PETASAN Frontend" powershell -NoExit -ExecutionPolicy Bypass -Command "Set-Location -LiteralPath '%FRONTEND%'; npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 3 /nobreak >nul

:: 4. Jalankan Cloudflare Tunnel
echo [4/4] Menjalankan Cloudflare Tunnel...

start "SI-PETASAN Cloudflare" powershell -NoExit -ExecutionPolicy Bypass -Command "& '%CLOUDFLARED%' tunnel --url http://127.0.0.1:5173"

echo.
echo ==========================================
echo       SI-PETASAN BERHASIL DIMULAI
echo ==========================================
echo.
echo Frontend : http://localhost:5173
echo Backend  : http://localhost:8000/docs
echo.
echo URL Cloudflare tersedia di terminal Cloudflare.
echo Jangan tutup terminal yang sedang berjalan.
echo.
pause
