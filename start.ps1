# Start Backend & Frontend Concurrent

Write-Host "Starting SampahPintar App..." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "Launching Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\python main.py"

# Wait 2 detik biar backend siap
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Launching Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers running. Close windows to stop." -ForegroundColor Green
