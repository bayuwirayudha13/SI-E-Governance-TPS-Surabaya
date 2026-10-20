#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="$HOME/Documents/SI-E-Governance-TPS-Surabaya"
cd "$PROJECT_DIR"

LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

BACKEND_PID="$LOG_DIR/backend.pid"
FRONTEND_PID="$LOG_DIR/frontend.pid"

# Pastikan dependensi Python tersedia
if [ ! -x backend/venv/bin/python ]; then
    echo "Membuat virtual environment backend..."
    python3 -m venv backend/venv
fi

# Install dependensi backend jika belum terpasang
if ! backend/venv/bin/python -c "import uvicorn, fastapi" 2>/dev/null; then
    echo "Menginstall dependensi FastAPI..."
    backend/venv/bin/python -m pip install -r backend/requirements.txt
fi

# Install dependensi frontend jika belum lengkap
if [ ! -x frontend/node_modules/.bin/vite ]; then
    echo "Menginstall dependensi React..."
    (cd frontend && npm install)
fi

# Cegah menjalankan dua instance sekaligus
if [ -f "$BACKEND_PID" ] && kill -0 "$(cat "$BACKEND_PID")" 2>/dev/null; then
    echo "Backend sudah berjalan. Hentikan dulu dengan stop.sh."
    exit 1
fi

if [ -f "$FRONTEND_PID" ] && kill -0 "$(cat "$FRONTEND_PID")" 2>/dev/null; then
    echo "Frontend sudah berjalan. Hentikan dulu dengan stop.sh."
    exit 1
fi

cleanup() {
    echo
    echo "Menghentikan server..."
    for file in "$BACKEND_PID" "$FRONTEND_PID"; do
        if [ -f "$file" ]; then
            pid="$(cat "$file")"
            kill "$pid" 2>/dev/null || true
            rm -f "$file"
        fi
    done
    wait 2>/dev/null || true
    echo "Server dihentikan."
}

trap cleanup EXIT INT TERM

echo "Menjalankan FastAPI..."
(
    cd backend
    exec ../backend/venv/bin/python -m uvicorn main:app \
        --reload --host 127.0.0.1 --port 8000
) > "$LOG_DIR/backend.log" 2>&1 &
echo $! > "$BACKEND_PID"

echo "Menjalankan React..."
(
    cd frontend
    exec npm run dev -- --host 127.0.0.1
) > "$LOG_DIR/frontend.log" 2>&1 &
echo $! > "$FRONTEND_PID"

echo "Menunggu server siap..."
ready=0
for i in $(seq 1 40); do
    if ! kill -0 "$(cat "$BACKEND_PID")" 2>/dev/null; then
        echo "Backend gagal berjalan. Periksa logs/backend.log"
        exit 1
    fi

    if ! kill -0 "$(cat "$FRONTEND_PID")" 2>/dev/null; then
        echo "Frontend gagal berjalan. Periksa logs/frontend.log"
        exit 1
    fi

    if curl -fsS http://127.0.0.1:8000/docs >/dev/null 2>&1 &&
       curl -fsS http://127.0.0.1:5173/ >/dev/null 2>&1; then
        ready=1
        break
    fi
    sleep 1
done

if [ "$ready" -eq 1 ]; then
    echo "Aplikasi siap!"
    echo "Frontend: http://localhost:5173"
    echo "Backend:  http://localhost:8000/docs"
    xdg-open http://localhost:5173 >/dev/null 2>&1 || true
else
    echo "Server belum siap. Periksa file log di folder logs/"
fi

echo "Terminal ini harus tetap terbuka selama aplikasi digunakan."
echo "Tekan Ctrl+C untuk menghentikan server."
wait
