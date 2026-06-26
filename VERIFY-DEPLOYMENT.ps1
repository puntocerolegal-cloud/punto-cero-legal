Write-Host "Verificando estado..." -ForegroundColor Cyan

Write-Host "`nGIT STATUS:" -ForegroundColor Yellow
git status

Write-Host "`nULTIMO COMMIT:" -ForegroundColor Yellow
git log -1 --oneline

Write-Host "`nCOMMIT HASH:" -ForegroundColor Yellow
git rev-parse HEAD

Write-Host "`nRAMA ACTUAL:" -ForegroundColor Yellow
git branch

Write-Host "`nOK - Verificacion completada" -ForegroundColor Green
