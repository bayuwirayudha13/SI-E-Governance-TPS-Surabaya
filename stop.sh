#!/usr/bin/env bash

PROJECT_DIR="$HOME/Documents/SI-E-Governance-TPS-Surabaya"
LOG_DIR="$PROJECT_DIR/logs"

for name in frontend backend; do
    file="$LOG_DIR/$name.pid"

    if [ -f "$file" ]; then
        pid="$(cat "$file")"
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            echo "$name dihentikan."
        else
            echo "$name sudah tidak berjalan."
        fi
        rm -f "$file"
    else
        echo "PID $name tidak ditemukan."
    fi
done
