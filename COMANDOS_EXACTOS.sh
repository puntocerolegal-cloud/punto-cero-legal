#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
#                  COMANDOS EXACTOS PARA SOLUCIÓN CORS
#                    Copiar y pegar en tu terminal
# ═══════════════════════════════════════════════════════════════════════════

echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║          SOLUCIÓN CORS: COMANDOS LISTOS PARA EJECUTAR                ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  INSTRUCCIONES:"
echo "  1. Abre una terminal en la raíz del proyecto"
echo "  2. Copia y pega CADA SECCIÓN paso a paso"
echo "  3. Espera a que termine antes de pasar al siguiente"
echo "  4. Verifica que no hay errores"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 1: Verificar cambios
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 1: Verificar que backend/server.py está modificado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ejecuta esto:"
echo ""
echo "  git status"
echo ""
echo "Deberías ver:"
echo "  modified:   backend/server.py"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 2: Agregar el archivo
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 2: Agregar backend/server.py al staging"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ejecuta esto:"
echo ""
echo "  git add backend/server.py"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 3: Hacer commit
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 3: Hacer commit con mensaje descriptivo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ejecuta esto (COPIA EXACTAMENTE):"
echo ""
cat << 'EOF'
git commit -m "fix: Actualizar CORS middleware para soportar Vercel preview y producción

- Agregar URLs de Vercel (producción y preview)
- Métodos explícitos: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Cache preflight: 24 horas (max_age=86400)
- Soportar env var CORS_ORIGINS para flexibilidad en producción"
EOF
echo ""
echo "Deberías ver:"
echo "  [main abc1234] fix: Actualizar CORS middleware..."
echo "  1 file changed, XX insertions(+), YY deletions(-)"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 4: Push a GitHub
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 4: PUSH a GitHub (CRÍTICO)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ejecuta esto:"
echo ""
echo "  git push origin main"
echo ""
echo "Deberías ver:"
echo "  To github.com:puntocerolegal/punto-cero-legal.git"
echo "     abc1234..def5678  main -> main"
echo ""
echo "✅ SI VES ESO: El código fue enviado a GitHub exitosamente"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 5: Esperar redepliegue en Render
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 5: Esperar redepliegue automático en Render (2-3 minutos)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ve a: https://dashboard.render.com"
echo "2. Selecciona: puntocero-legal-api"
echo "3. Mira en: Deploys (al lado derecho)"
echo "4. Deberías ver un nuevo deploy que dice 'Building...' → 'Live'"
echo ""
echo "⏳ Espera a que el estado sea 'Live' (verde)"
echo ""
echo "TIP: Puedes actualizar la página (Ctrl+R) para ver progreso"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 6: Validación rápida
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 6: Validar que CORS funciona (en nueva terminal)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test 1 - Health Check:"
echo ""
echo "  curl https://puntocero-legal-api.onrender.com/api/health"
echo ""
echo "Esperado:"
echo "  {\"status\": \"healthy\", \"database\": \"connected\"}"
echo ""

echo "Test 2 - CORS Preflight:"
echo ""
cat << 'EOF'
curl -i -X OPTIONS https://puntocero-legal-api.onrender.com/api/auth/login \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST"
EOF
echo ""
echo "Esperado: Deberías ver encabezados como:"
echo "  Access-Control-Allow-Origin: https://punto-cero-legal-me3ma4jnr..."
echo "  Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS"
echo ""

echo "Test 3 - Login Real:"
echo ""
cat << 'EOF'
curl -X POST https://puntocero-legal-api.onrender.com/api/auth/login \
  -H "Origin: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@puntocerolegal.com", "password": "AdminPassword123!"}'
EOF
echo ""
echo "Esperado: Verás un token:"
echo "  {\"access_token\": \"eyJ0eXAi...\", \"token_type\": \"bearer\", ...}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PASO 7: Test en navegador
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PASO 7: Validar en Vercel Frontend (en navegador)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Abre: https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app"
echo ""
echo "2. Abre DevTools: Presiona F12 (Windows/Linux) o Cmd+Opt+I (Mac)"
echo ""
echo "3. Ve a pestaña Console y busca errores de CORS"
echo ""
echo "4. Ve a pestaña Network"
echo ""
echo "5. Intenta hacer Login:"
echo "   Email:    admin@puntocerolegal.com"
echo "   Password: AdminPassword123!"
echo "   Click 'Ingresar'"
echo ""
echo "6. En Network tab, busca POST /api/auth/login"
echo ""
echo "7. Verifica:"
echo "   ✓ Status: 200 OK (no CORS error)"
echo "   ✓ Response headers incluyen:"
echo "     access-control-allow-origin: https://punto-cero-legal-me3ma4jnr..."
echo "   ✓ Console: Sin errores CORS"
echo ""
echo "8. Si login fue exitoso:"
echo "   → Deberías ser redirigido a /admin o /dashboard"
echo "   → SIN errores en Console"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════════════════
echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                        RESUMEN FINAL                                  ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Si completaste todos los pasos y:"
echo "  ✅ git push fue exitoso"
echo "  ✅ Render redepliegue está en 'Live'"
echo "  ✅ Health check retorna 200 OK"
echo "  ✅ Login en frontend funciona sin errores CORS"
echo ""
echo "🎉 ¡FELICIDADES! El problema de CORS está RESUELTO"
echo ""
echo "Si algo falla, verifica el archivo INSTRUCCIONES_PASOS_A_PASOS.md"
echo "en la sección '🆘 SOLUCIÓN DE PROBLEMAS'"
echo ""
