Write-Host "Iniciando despliegue..." -ForegroundColor Cyan

cd frontend
Write-Host "Compilando frontend..." -ForegroundColor Yellow
npm run build

cd ../backend
Write-Host "Validando backend..." -ForegroundColor Yellow
python -c "from server import app; print('OK')"

cd ..
Write-Host "Haciendo commit..." -ForegroundColor Yellow
git add -A
git commit -m "fix: Auditoria y correccion de errores criticos"

Write-Host "Haciendo push..." -ForegroundColor Yellow
git push origin main

Write-Host "Despliegue completado" -ForegroundColor Green
