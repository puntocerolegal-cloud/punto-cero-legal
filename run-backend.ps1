Write-Host "Iniciando Punto Cero Legal Backend" -ForegroundColor Cyan

Write-Host "Limpiando puerto 8000..." -ForegroundColor Yellow
$procesosEnPuerto = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($procesosEnPuerto) {
    $pid = $procesosEnPuerto.OwningProcess
    Write-Host "Eliminando proceso en puerto 8000 (PID: $pid)" -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
$venvPath = ".\backend\.venv\Scripts\Activate.ps1"
& $venvPath

Write-Host "Iniciando servidor..." -ForegroundColor Cyan
Write-Host "Backend en: http://127.0.0.1:8000" -ForegroundColor Green

cd backend
python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
