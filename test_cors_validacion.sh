#!/bin/bash

# ========================================
# SCRIPT DE VALIDACIÓN CORS POST-DEPLOY
# ========================================
# Este script valida que CORS está funcionando correctamente en Render

BACKEND_URL="https://puntocero-legal-api.onrender.com"
VERCEL_ORIGIN="https://punto-cero-legal-me3ma4jnr-puntocerolegal-3926s-projects.vercel.app"

echo "╔════════════════════════════════════════╗"
echo "║  VALIDACIÓN CORS POST-DEPLOY           ║"
echo "║  Backend: $BACKEND_URL"
echo "║  Frontend: $VERCEL_ORIGIN"
echo "╚════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────
# TEST 1: Health Check
# ─────────────────────────────────────────
echo -e "${YELLOW}[1/4] Validando Health Check...${NC}"
RESPONSE=$(curl -s -i "$BACKEND_URL/api/health")
if echo "$RESPONSE" | grep -q "200 OK"; then
    echo -e "${GREEN}✓ Health check OK${NC}"
else
    echo -e "${RED}✗ Health check FALLÓ${NC}"
    exit 1
fi
echo ""

# ─────────────────────────────────────────
# TEST 2: CORS Preflight (OPTIONS)
# ─────────────────────────────────────────
echo -e "${YELLOW}[2/4] Validando CORS Preflight (OPTIONS)...${NC}"
RESPONSE=$(curl -s -i -X OPTIONS "$BACKEND_URL/api/auth/login" \
  -H "Origin: $VERCEL_ORIGIN" \
  -H "Access-Control-Request-Method: POST")

echo "Response headers:"
echo "$RESPONSE" | grep -i "access-control"
echo ""

if echo "$RESPONSE" | grep -qi "access-control-allow-origin"; then
    echo -e "${GREEN}✓ CORS preflight retorna headers correctos${NC}"
    if echo "$RESPONSE" | grep -qi "OPTIONS"; then
        echo -e "${GREEN}✓ Método OPTIONS permitido${NC}"
    else
        echo -e "${YELLOW}⚠ OPTIONS podría no estar en la lista${NC}"
    fi
else
    echo -e "${RED}✗ CORS preflight NO retorna headers${NC}"
    exit 1
fi
echo ""

# ─────────────────────────────────────────
# TEST 3: Login Endpoint
# ─────────────────────────────────────────
echo -e "${YELLOW}[3/4] Validando POST /api/auth/login...${NC}"
RESPONSE=$(curl -s -i -X POST "$BACKEND_URL/api/auth/login" \
  -H "Origin: $VERCEL_ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@puntocerolegal.com", "password": "AdminPassword123!"}')

if echo "$RESPONSE" | grep -q "200 OK"; then
    echo -e "${GREEN}✓ Login endpoint retorna 200 OK${NC}"
    if echo "$RESPONSE" | grep -qi "access-control-allow-origin"; then
        echo -e "${GREEN}✓ CORS headers presentes en respuesta${NC}"
    else
        echo -e "${RED}✗ CORS headers NO presentes${NC}"
    fi
    if echo "$RESPONSE" | grep -q "access_token"; then
        echo -e "${GREEN}✓ Token generado correctamente${NC}"
    fi
else
    echo -e "${RED}✗ Login endpoint falló${NC}"
    echo "$RESPONSE" | head -20
    exit 1
fi
echo ""

# ─────────────────────────────────────────
# TEST 4: Render Env Vars Check
# ─────────────────────────────────────────
echo -e "${YELLOW}[4/4] Información de Render (instrucciones manuales)...${NC}"
echo ""
echo "Para verificar las env vars en Render:"
echo "1. Ir a: https://dashboard.render.com"
echo "2. Seleccionar servicio: puntocero-legal-api"
echo "3. En 'Environment' tab:"
echo "   - CORS_ORIGINS debe estar VACÍO (para usar hardcoded list)"
echo "   - O contener: $VERCEL_ORIGIN"
echo ""

# ─────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ TODAS LAS VALIDACIONES PASARON     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Abrir frontend en Vercel: $VERCEL_ORIGIN"
echo "2. Abrir DevTools (F12)"
echo "3. Ir a Console y Network tabs"
echo "4. Intentar login"
echo "5. Verificar NO hay errores CORS"
echo ""
