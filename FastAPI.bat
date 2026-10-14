
@echo off
title Cloudflare Tunnel - FastAPI
"D:\Download\cloudflared-windows-amd64.exe" tunnel --url http://localhost:8000
pause
