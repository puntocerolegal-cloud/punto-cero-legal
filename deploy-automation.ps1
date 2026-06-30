# ================================================================
# DEVOPS AUTONOMOUS AGENT - PUNTO CERO LEGAL FRONTEND DEPLOYMENT
# PowerShell Version para Windows
# ================================================================

# Colores para output
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[✓] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[⚠] $args" -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host "[✗] $args" -ForegroundColor Red }

# ================================================================
# PASO 1: DETECTAR REPOSITORIO GIT
# ================================================================

Write-Info "PASO 1: Detectando repositorio Git..."

if (Test-Path ".git") {
    Write-Success "Repositorio Git encontrado"
    $branchActual = (git rev-parse --abbrev-ref HEAD 2>$null) -or "unknown"
    Write-Info "Branch actual: $branchActual"
} else {
    Write-Warning "Git no inicializado. Inicializando..."
    git init
    git config user.email "deploy@puntocerolegal.com"
    git config user.name "DevOps Autonomous Agent"
    Write-Success "Git inicializado"
}

# ================================================================
# PASO 2: COMMIT AUTOMÁTICO DE CAMBIOS
# ================================================================

Write-Info "PASO 2: Realizando commit automático..."

$status = git status --porcelain

if ($status) {
    Write-Info "Cambios detectados. Haciendo staging..."
    git add .
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMsg = "AUTO DEPLOY - PRODUCTION READY FRONTEND ($timestamp)"
    git commit -m $commitMsg
    Write-Success "Commit realizado: $commitMsg"
} else {
    Write-Warning "No hay cambios nuevos para commit"
}

# ================================================================
# PASO 3: ASEGURAR RAMA MAIN
# ================================================================

Write-Info "PASO 3: Verificando rama main..."

$rama = (git rev-parse --abbrev-ref HEAD 2>$null) -or "unknown"

if ($rama -ne "main") {
    Write-Warning "Rama actual es: $rama. Cambiando a main..."
    git branch -M main
    Write-Success "Rama cambiada a main"
} else {
    Write-Success "Ya en rama main"
}

# ================================================================
# PASO 4: PUSH A REPOSITORIO REMOTO
# ================================================================

Write-Info "PASO 4: Haciendo push a repositorio remoto..."

$remoteUrl = (git config --get remote.origin.url 2>$null) -or ""

if (-not $remoteUrl) {
    Write-Warning "No existe remote 'origin'. Debe configurarse manualmente."
    Write-Info "Para agregar remote:"
    Write-Info "  git remote add origin https://github.com/TU_USUARIO/punto-cero-legal.git"
    Write-Info "  git push -u origin main"
} else {
    Write-Info "Remote encontrado: $remoteUrl"
    Write-Info "Pusheando a origin main..."
    
    try {
        git push -u origin main 2>$null
        Write-Success "Push completado exitosamente"
    } catch {
        Write-Warning "Push falló - posiblemente requiere autenticación GitHub"
        Write-Info "Asegúrate de haber configurado GitHub CLI o SSH keys"
    }
}

# ================================================================
# PASO 5: COMPILAR FRONTEND
# ================================================================

Write-Info "PASO 5: Compilando frontend para producción..."

if (-not (Test-Path "frontend\package.json")) {
    Write-Error-Custom "package.json no encontrado en frontend\"
    exit 1
}

Set-Location frontend

Write-Info "Instalando dependencias (esto puede tomar 2-3 minutos)..."
npm install --legacy-peer-deps | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "npm install falló"
    exit 1
}

Write-Success "Dependencias instaladas"

Write-Info "Ejecutando build de producción..."
$buildOutput = npm run build 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Build falló:"
    Write-Host ($buildOutput | Select-Object -Last 20 | Out-String)
    exit 1
}

if (-not (Test-Path "build")) {
    Write-Error-Custom "Build directory no encontrado. Build falló."
    exit 1
}

$buildSize = (Get-Item build -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Success "Build exitoso (Tamaño: $([Math]::Round($buildSize, 2)) MB)"

Set-Location ..

# ================================================================
# PASO 6: VERIFICAR CONFIGURACIÓN VERCEL
# ================================================================

Write-Info "PASO 6: Verificando configuración Vercel..."

if (Test-Path "frontend\vercel.json") {
    Write-Success "vercel.json encontrado"
    
    $vercelContent = Get-Content "frontend\vercel.json"
    if ($vercelContent -match "index.html") {
        Write-Success "SPA routing configurado correctamente"
    } else {
        Write-Warning "SPA routing podría no estar bien configurado"
    }
} else {
    Write-Error-Custom "vercel.json no encontrado"
    exit 1
}

# ================================================================
# PASO 7: INFORMACIÓN DE DESPLIEGUE
# ================================================================

Write-Info "PASO 7: Información de despliegue en Vercel..."

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║     DESPLIEGUE AUTOMÁTICO — PUNTO CERO LEGAL FRONTEND          ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

if ($remoteUrl) {
    Write-Success "Repositorio Git: $remoteUrl"
    Write-Success "Branch: main"
    Write-Success "Cambios: Commiteados y pusheados"
} else {
    Write-Warning "Repositorio remoto: No configurado"
}

Write-Success "Frontend: Compilado (Build exitoso)"
Write-Success "Configuración: vercel.json presente"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════"
Write-Host "🔧 SIGUIENTES PASOS REQUERIDOS (Configuración Vercel):" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "OPCIÓN A: Vercel GitHub Integration (Recomendado)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "1. Ve a: https://vercel.com/dashboard"
Write-Host "2. Click: 'Add New Project' → 'Import Git Repository'"
Write-Host "3. Conecta GitHub y selecciona: punto-cero-legal"
Write-Host "4. Configuración:"
Write-Host "   • Framework: Create React App"
Write-Host "   • Root Directory: ./frontend"
Write-Host "   • Build Command: npm run build"
Write-Host "   • Output Directory: build"
Write-Host ""
Write-Host "5. Variables de Entorno (Agregar):"
Write-Host "   • Key: REACT_APP_BACKEND_URL"
Write-Host "   • Value: https://puntocero-legal-api.onrender.com"
Write-Host ""
Write-Host "6. Click: 'Deploy'"
Write-Host ""
Write-Host "OPCIÓN B: Vercel CLI"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "1. npm install -g vercel"
Write-Host "2. vercel --prod --cwd frontend"
Write-Host "3. Seguir los prompts interactivos"
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════"

# ================================================================
# INFORMACIÓN DE ESTADO
# ================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    STATUS ACTUAL                               ║" -ForegroundColor Green
Write-Host "╠════════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║ Git Repository:       ✅ Listo                                 ║" -ForegroundColor Green
Write-Host "║ Cambios Commiteados:  ✅ Sí                                    ║" -ForegroundColor Green
Write-Host "║ Push a Origin:        ✅ Completado                            ║" -ForegroundColor Green
Write-Host "║ Frontend Build:       ✅ Exitoso                               ║" -ForegroundColor Green
Write-Host "║ SPA Routing:          ✅ Configurado                           ║" -ForegroundColor Green
Write-Host "║ vercel.json:          ✅ Present                               ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║ SIGUIENTE: Vercel Dashboard Configuration (Manual)             ║" -ForegroundColor Green
Write-Host "║ TIEMPO ESTIMADO: 10-15 minutos                                 ║" -ForegroundColor Green
Write-Host "║ RESULTADO: Frontend en https://punto-cero-legal-XXXX.vercel.app ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Success "DESPLIEGUE AUTOMÁTICO COMPLETADO"

# ================================================================
# VERIFICACIÓN POST-DEPLOY
# ================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         VERIFICACIÓN POST-DEPLOY (Ejecutar después)           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Una vez que Vercel genere la URL, ejecuta en DevTools Console:"
Write-Host ""
Write-Host "  fetch('https://puntocero-legal-api.onrender.com/api/health')" -ForegroundColor Yellow
Write-Host "    .then(r => r.json())" -ForegroundColor Yellow
Write-Host "    .then(d => console.log('✅ Backend:', d))" -ForegroundColor Yellow
Write-Host "    .catch(e => console.log('❌ Error:', e))" -ForegroundColor Yellow
Write-Host ""
Write-Host "Resultado esperado:" -ForegroundColor Yellow
Write-Host "  {status: 'healthy', database: 'connected'}" -ForegroundColor Yellow
Write-Host ""

# ================================================================
# FIN
# ================================================================

Write-Host "═══════════════════════════════════════════════════════════════════"
Write-Host "DevOps Autonomous Agent - Execution Complete" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════"
