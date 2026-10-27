Write-Host "Stopping SampahPintar servers..." -ForegroundColor Yellow

# Kill port 8000 (Backend)
$backendConns = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
foreach ($conn in $backendConns) {
    if ($conn.OwningProcess -gt 0) {
        Write-Host "Stopping Backend process (PID $($conn.OwningProcess))..." -ForegroundColor Cyan
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Kill port 5173 (Frontend Vite)
$frontendConns = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
foreach ($conn in $frontendConns) {
    if ($conn.OwningProcess -gt 0) {
        Write-Host "Stopping Frontend process (PID $($conn.OwningProcess))..." -ForegroundColor Cyan
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "All servers stopped." -ForegroundColor Green
