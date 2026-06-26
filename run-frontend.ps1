Write-Host "Compilando y iniciando Frontend" -ForegroundColor Cyan

cd frontend
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install

Write-Host "Compilando frontend..." -ForegroundColor Yellow
npm run build

Write-Host "Frontend listo para despliegue" -ForegroundColor Green
