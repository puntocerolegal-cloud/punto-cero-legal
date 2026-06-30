#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT DE DESPLIEGUE AUTOMÁTICO — PUNTO CERO LEGAL
# ═══════════════════════════════════════════════════════════════
# Este script prepara y despliega el frontend en Vercel de forma automática

set -e  # Exit si hay error

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 DESPLIEGUE AUTOMÁTICO — PUNTO CERO LEGAL FRONTEND"
echo "═══════════════════════════════════════════════════════════════"

# PASO 1: Verificar que Git está inicializado
echo ""
echo "✓ PASO 1: Verificando Git..."

if [ ! -d ".git" ]; then
    echo "❌ Git no inicializado. Inicializando..."
    git init
    git config user.email "admin@puntocerolegal.com"
    git config user.name "Punto Cero Legal Deploy"
fi

echo "✅ Git está listo"

# PASO 2: Verificar que tenemos cambios
echo ""
echo "✓ PASO 2: Preparando cambios..."

if [ -z "$(git status --porcelain)" ]; then
    echo "⚠️  No hay cambios nuevos"
else
    echo "📝 Hay cambios detectados. Haciendo commit..."
    git add .
    git commit -m "Deployment: Punto Cero Legal $(date '+%Y-%m-%d %H:%M:%S')" || true
fi

echo "✅ Cambios preparados"

# PASO 3: Verificar rama main
echo ""
echo "✓ PASO 3: Verificando rama..."

RAMA_ACTUAL=$(git rev-parse --abbrev-ref HEAD)
if [ "$RAMA_ACTUAL" != "main" ]; then
    echo "⚠️  Rama actual: $RAMA_ACTUAL (esperado: main)"
    echo "📝 Cambiando a rama main..."
    git branch -M main
fi

echo "✅ Rama main activa"

# PASO 4: Verificar Build
echo ""
echo "✓ PASO 4: Compilando frontend..."

cd frontend

if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json no encontrado en frontend/"
    exit 1
fi

echo "📦 Instalando dependencias..."
npm install --legacy-peer-deps 2>&1 | tail -5

echo "🔨 Compilando..."
npm run build 2>&1 | tail -10

if [ ! -d "build" ]; then
    echo "❌ ERROR: Build fallido. No se generó directorio build/"
    exit 1
fi

echo "✅ Build exitoso ($(du -sh build | cut -f1))"

cd ..

# PASO 5: Información para desplegar en Vercel
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ FRONTEND LISTO PARA DESPLIEGUE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo ""
echo "OPCIÓN A: Despliegue manual en Vercel Dashboard"
echo "  1. Ve a https://vercel.com/dashboard"
echo "  2. Click 'Add New Project' → 'Import Git Repository'"
echo "  3. Conecta GitHub y selecciona 'punto-cero-legal'"
echo "  4. Root Directory: ./frontend"
echo "  5. Agregar variable: REACT_APP_BACKEND_URL=https://puntocero-legal-api.onrender.com"
echo "  6. Click 'Deploy'"
echo ""
echo "OPCIÓN B: Despliegue con Vercel CLI"
echo "  1. npm install -g vercel"
echo "  2. vercel --prod --cwd frontend"
echo "  3. Seguir los prompts"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STATUS: ✅ COMPLETADO"
echo "═══════════════════════════════════════════════════════════════"
