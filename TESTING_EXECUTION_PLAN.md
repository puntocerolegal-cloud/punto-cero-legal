# TESTING EXECUTION PLAN
## SecuritySeals Component Testing — Live in Browser

**Objetivo:** Validar todas las funcionalidades del componente SecuritySeals en el navegador  
**Tiempo estimado:** 90 minutos  
**Fecha:** Junio 2026

---

## PRE-TESTING CHECKLIST (5 MINUTOS)

### 1. Verificaciones Previas
```bash
# En terminal, dentro de frontend/
cd frontend

# Verifica que no hay archivos sin guardar
git status

# Output esperado:
# On branch main
# nothing to commit, working tree clean
```

- [ ] Working directory limpio (sin cambios pendientes)
- [ ] Rama: `main`
- [ ] Commit hash conocido

### 2. Instancia del Servidor
```bash
# Si ya corrió, detén con Ctrl+C
npm start
```

**Resultado esperado:**
- ✅ Compilación sin errores
- ✅ "Compiled successfully!" mensaje
- ✅ Browser abre automáticamente en http://localhost:3000
- ✅ No hay errores en DevTools Console

**Si hay errores:**
```bash
# Limpia cache y reinstala
rm -rf node_modules package-lock.json
npm install
npm start
```

- [ ] Servidor inició correctamente
- [ ] Landing page se carga
- [ ] Console sin errores críticos

---

## FASE 1: SMOKE TEST (10 MINUTOS)

### Paso 1: Navega a Sección de Sellos
1. Abre http://localhost:3000
2. **Scroll hacia abajo** hasta encontrar "Seguridad y Confianza"
3. Verifica visual:
   - [ ] Título: "Su información protegida con estándares premium"
   - [ ] 4 tarjetas/sellos visibles
   - [ ] Fondo oscuro (`#0a1226`)
   - [ ] Cada sello tiene icono, título, highlight, descripción

### Paso 2: Visual Quick Check
- [ ] Sello 1: Escudo (ShieldCheck) — Habeas Data
- [ ] Sello 2: Candado (Lock) — SSL 256
- [ ] Sello 3: Servidor (Server) — Cloud
- [ ] Sello 4: Llave (KeyRound) — SupportAccessGate

### Paso 3: Hover Test
Pasa el mouse sobre cada sello (desktop):
- [ ] Border cambia a naranja
- [ ] Background se ilumina
- [ ] Icono se escala
- [ ] Tooltip aparece arriba

### Paso 4: Click Test
Click en botón "Ver Políticas" (Habeas Data):
- [ ] Navega a /privacy
- [ ] PrivacyPolicy se carga
- [ ] URL: http://localhost:3000/privacy
- [ ] Browser back regresa a landing

### Paso 5: Console Check
DevTools → Console:
- [ ] Sin errores rojos
- [ ] Sin warnings críticos
- [ ] Eventos analytics en log (si está configurado)

**Status:** ✅ PASS / ❌ FAIL

---

## FASE 2: FUNCIONAL DETALLADO (45 MINUTOS)

### Test 2.1: Sello Habeas Data — Ley 1581 (10 min)

**Setup:**
- Abre LandingPage (si no estás ahí)
- Scroll a sección de sellos
- Abre DevTools (F12)

**Test Visual:**
1. Hover sobre sello Habeas Data
   - [ ] Border naranja: `#f97316`
   - [ ] Background: `white/[0.05]`
   - [ ] Icon scale: 105%

2. Tooltip aparece
   - [ ] Posición: arriba del sello
   - [ ] Fondo: `#1a2847`
   - [ ] Border: naranja claro
   - [ ] Texto: "Acceso a políticas de privacidad..."
   - [ ] Botón "Ver Políticas" en naranja
   - [ ] Botón X en esquina superior derecha

3. Click en "Ver Políticas"
   - [ ] Navega a `/privacy`
   - [ ] URL cambia a: `http://localhost:3000/privacy`
   - [ ] Página carga sin errores
   - [ ] Scroll funciona en página de privacy

4. Vuelve atrás (Browser back)
   - [ ] Regresa a landing page
   - [ ] Sección de sellos visible
   - [ ] Estado se mantiene

**Test Keyboard:**
1. Presiona Tab varias veces hasta llegar al sello Habeas Data
   - [ ] Focus visible en el sello (border o outline)

2. Presiona Enter
   - [ ] Tooltip se abre

3. Presiona Tab nuevamente
   - [ ] Focus llega al botón "Ver Políticas"

4. Presiona Enter
   - [ ] Navega a `/privacy`

5. Vuelve (browser back) y Tab+Escape
   - [ ] Tooltip se cierra

**Test Analytics:**
DevTools → Console:
```javascript
console.log(window.gtag);  // debe existir o ser callable
```

Interactúa:
1. Hover en sello
   - [ ] Evento `security_badge_view` dispara
   - [ ] Parámetro: `seal: "habeas-data"`

2. Click en "Ver Políticas"
   - [ ] Evento `security_badge_click` dispara
   - [ ] Parámetros: `seal: "habeas-data"`, `action: "navigate"`

**Status:** ✅ PASS / ❌ FAIL | Issues: _______________

---

### Test 2.2: Sello SSL 256 bits (10 min)

**Setup:**
- Landingpage visible
- Scroll a sellos
- DevTools abierto

**Test Visual HTTPS (Producción):**
Si estás en HTTPS:
1. Hover sobre sello SSL
   - [ ] Highlight: "Conexión Segura" (verde)
   - [ ] Badge: pequeño círculo verde con ✓
   - [ ] Tooltip: "Conexión Segura Verificada — Tu comunicación está protegida con cifrado TLS 1.3 (256-bit)."

**Test Visual HTTP (Desarrollo):**
Si estás en HTTP:
1. Hover sobre sello SSL
   - [ ] Highlight: "Extremo a extremo"
   - [ ] Sin badge
   - [ ] Tooltip: "Esta conexión no está cifrada. En producción, esta aplicación usa HTTPS."

**Test Dinámico:**
Este sello **NO debe ser clickeable**:
- [ ] No tiene botón de acción
- [ ] Solo muestra información
- [ ] Tooltip es solo lectura

**Test Analytics:**
1. Hover sobre sello
   - [ ] Evento `security_badge_view` dispara
   - [ ] Parámetro: `seal: "ssl-256"`

**Status:** ✅ PASS / ❌ FAIL | Issues: _______________

---

### Test 2.3: Sello Cloud Blindada (10 min)

**Setup:**
- Landingpage visible
- Scroll a sellos

**Test Visual:**
1. Hover sobre sello Cloud
   - [ ] Border naranja al hover
   - [ ] Icono servidor

2. Tooltip aparece
   - [ ] Fondo oscuro
   - [ ] Texto: "Infraestructura desplegada en entorno cloud con alta disponibilidad, respaldos automáticos continuos y redundancia permanente en múltiples zonas."
   - [ ] Sin botón de acción
   - [ ] Botón X para cerrar
   - [ ] Verifica que NO menciona:
     - [ ] AWS, Azure, GCP
     - [ ] Endpoints internos
     - [ ] Variables de entorno
     - [ ] Secretos

**Test No-Interactivo:**
- [ ] No es clickeable
- [ ] No navega
- [ ] Solo informativo

**Test Analytics:**
1. Hover sobre sello
   - [ ] Evento `security_badge_view` dispara
   - [ ] Parámetro: `seal: "cloud-infrastructure"`

**Status:** ✅ PASS / ❌ FAIL | Issues: _______________

---

### Test 2.4: Sello SupportAccessGate (10 min)

**Setup:**
- Landingpage visible
- Scroll a sellos
- DevTools Console abierto

**Test Caso Normal (sin token activo):**
1. Hover sobre sello SupportAccessGate
   - [ ] Highlight: "Acceso controlado"
   - [ ] Sin badge especial
   - [ ] Tooltip: "Acceso técnico controlado mediante autorización explícita y registro de auditoría. Sin token activo."
   - [ ] No es clickeable

2. Verifica localStorage (Console):
```javascript
localStorage.getItem("supportToken");  // null o undefined (normal)
```

**Test Caso Activo (con token):**
Si tienes acceso a `/admin/support-access`:
1. Ve a `/admin/support-access`
2. Genera un token de soporte
3. Vuelve a landing
4. Scroll a sellos
5. Sello debe cambiar dinámicamente:
   - [ ] Highlight: "Acceso Activo" (naranja)
   - [ ] Badge: pequeño círculo naranja pulsante
   - [ ] Tooltip: "...Token activo."

**Test Analytics:**
1. Hover sobre sello
   - [ ] Evento `security_badge_view` dispara
   - [ ] Parámetro: `seal: "support-access"`

**Status:** ✅ PASS / ❌ FAIL | Issues: _______________

---

## FASE 3: RESPONSIVENESS (15 MINUTOS)

### Test 3.1: Mobile (375px)

**Setup DevTools:**
1. F12 → Responsive Design Mode (Ctrl+Shift+M)
2. Selecciona: iPhone 12 (390x844)

**Verificar:**
- [ ] Grid: 1 columna (4 sellos apilados)
- [ ] Cada sello completo y clickeable
- [ ] Tooltips no salen de pantalla
- [ ] Botones tamaño touch (≥44px)
- [ ] Texto legible sin zoom
- [ ] Scroll funciona
- [ ] Sin horizontal scroll

**Test Interactividad:**
- [ ] Tap en sello → tooltip abre
- [ ] Tap en "Ver Políticas" → navega
- [ ] Tap X → tooltip cierra

**Status:** ✅ PASS / ❌ FAIL

---

### Test 3.2: Tablet (768px)

**Setup DevTools:**
1. Responsive Design Mode
2. Selecciona: iPad (768x1024)

**Verificar:**
- [ ] Grid: 2 columnas (2 filas de 2 sellos)
- [ ] Layout balanceado
- [ ] Tooltips posicionados correctamente
- [ ] Sin overflow

**Status:** ✅ PASS / ❌ FAIL

---

### Test 3.3: Desktop (1920px)

**Setup DevTools:**
1. Responsive Design Mode
2. Selecciona: Laptop (1440x900)
3. O redimensiona ventana browser

**Verificar:**
- [ ] Grid: 4 columnas (1 fila)
- [ ] Completo visible sin scroll horizontal
- [ ] Espaciado correcto
- [ ] Sin desbordamientos

**Status:** ✅ PASS / ❌ FAIL

---

## FASE 4: SEGURIDAD (10 MINUTOS)

### Test 4.1: Network Inspector

DevTools → Network:
1. Interactúa con todos los sellos (hover, click, tooltip)
2. Observa cada request
3. Para cada request verifica:
   - [ ] No hay token en URL
   - [ ] No hay credenciales en headers (Authorization, Cookie sensibles)
   - [ ] No hay solicitud a `/admin/support-access` sin permiso
   - [ ] Requests a `/privacy` son GET públicos

### Test 4.2: Storage Inspector

DevTools → Application/Storage:
1. LocalStorage:
   - [ ] supportToken puede existir, pero NO debe mostrarse en DOM
   - [ ] Otros datos sensibles: NO presentes

2. SessionStorage:
   - [ ] Sin tokens en claro
   - [ ] Sin credenciales

3. Cookies:
   - [ ] Sin tokens en claro
   - [ ] Información sensible: NO presente

### Test 4.3: HTML Inspection

DevTools → Elements:
1. Click derecho en un sello → Inspect
2. Mira el HTML:
   - [ ] No hay `process.env` visible
   - [ ] No hay endpoints internos mencionados
   - [ ] No hay secretos en data-* attributes
   - [ ] No hay comentarios con información sensible

**Status:** ✅ PASS / ❌ FAIL | Issues: _______________

---

## FASE 5: ACCESIBILIDAD (10 MINUTOS)

### Test 5.1: ARIA Attributes

DevTools → Accessibility Inspector:
1. Click en sello Habeas Data
2. En panel derecho verifica:
   - [ ] Name: "Sello de seguridad: Cumplimiento Ley 1581"
   - [ ] Role: "region" o "button"
   - [ ] Description: vinculado a seal-desc-habeas-data

Repite para otros sellos

### Test 5.2: Keyboard Navigation

1. Press Tab desde el inicio de página
2. Tab debe llegar a:
   - [ ] Sello Habeas Data (primer interactivo)
   - [ ] Los otros sellos NO tienen tabindex (son regiones, no botones)
   - [ ] Cuando tooltip está abierto, Tab llega a botón "Ver Políticas"

3. Cuando focus en sello:
   - [ ] Outline/border visible (focus state)
   - [ ] Press Enter → tooltip abre
   - [ ] Press Escape → tooltip cierra

### Test 5.3: Screen Reader (Spot Check)

Si tienes NVDA/JAWS/VoiceOver disponible:

1. Abre screen reader
2. Navega a sección de sellos
3. Screen reader debe leer:
   - [ ] "Sellos de Seguridad y Confianza" (región)
   - [ ] "Título: Su información protegida..." 
   - [ ] "Sello de seguridad: [Nombre sello]" (para cada uno)
   - [ ] Labels y descripciones en orden

**Status:** ✅ PASS / ❌ FAIL | Issues: _______________

---

## FASE 6: PERFORMANCE (5 MINUTOS)

### Test 6.1: Console Errors

DevTools → Console:
- [ ] Sin errores rojos críticos
- [ ] Sin "Cannot read property..." errors
- [ ] Sin "undefined is not a function" errors
- [ ] Sin Network errors (404, 500)

### Test 6.2: Component Render Time

DevTools → Performance:
1. Abre recording
2. Scroll a sección de sellos
3. Detén recording
4. Analiza timeline:
   - [ ] SecuritySeals renderiza en < 100ms
   - [ ] No hay re-renders múltiples
   - [ ] useEffect ejecuta una sola vez

### Test 6.3: Analytics Timing

1. Hover sobre sello
2. DevTools → Network
3. Filtra por analytics/gtag
4. Verifica:
   - [ ] Evento se envía sin demora visible
   - [ ] No bloquea UI
   - [ ] Respuesta rápida (< 500ms)

**Status:** ✅ PASS / ❌ FAIL

---

## RESUMEN DE RESULTADOS

### Tally Summary

| Fase | Tests | Pass | Fail | Status |
|------|-------|------|------|--------|
| 1. Smoke | 5 | _ | _ | ✅/❌ |
| 2.1 Habeas | 5 | _ | _ | ✅/❌ |
| 2.2 SSL | 3 | _ | _ | ✅/❌ |
| 2.3 Cloud | 3 | _ | _ | ✅/❌ |
| 2.4 Support | 3 | _ | _ | ✅/❌ |
| 3.1 Mobile | 6 | _ | _ | ✅/❌ |
| 3.2 Tablet | 3 | _ | _ | ✅/❌ |
| 3.3 Desktop | 3 | _ | _ | ✅/❌ |
| 4. Security | 8 | _ | _ | ✅/❌ |
| 5. A11y | 7 | _ | _ | ✅/❌ |
| 6. Perf | 5 | _ | _ | ✅/❌ |
| **TOTAL** | **60** | **_** | **_** | **✅/❌** |

---

## REPORTAR RESULTADOS

### Si TODO PASÓ ✅

1. Documenta:
   - Browser/OS: _______________
   - Testing date: _______________
   - Tester name: _______________

2. Status: **APROBADO PARA MERGE**

3. Acciones:
   - [ ] Crear PR en GitHub
   - [ ] Request code review
   - [ ] Merge a main
   - [ ] Deploy a staging
   - [ ] Monitor analytics

### Si FALLÓ ALGO ❌

1. Documenta:
   - Browser/OS: _______________
   - Issue #1: _______________
   - Issue #2: _______________
   - Issue #3: _______________

2. Status: **REQUIERE FIXES**

3. Acciones:
   - [ ] Crear GitHub issue
   - [ ] Asignar developer
   - [ ] Re-test después de fix
   - [ ] Pasar a aprobación

---

## CHECKLIST FINAL

- [ ] Pre-testing checks completado
- [ ] Fase 1 (Smoke): PASS
- [ ] Fase 2 (Funcional): PASS
- [ ] Fase 3 (Responsive): PASS
- [ ] Fase 4 (Security): PASS
- [ ] Fase 5 (A11y): PASS
- [ ] Fase 6 (Perf): PASS
- [ ] Resultados documentados
- [ ] Issues (si hay) reportados
- [ ] Recomendación final: APROBADO / REQUIERE FIXES

---

## TIMING

| Fase | Estimado | Real |
|------|----------|------|
| Pre-testing | 5 min | __ |
| Smoke Test | 10 min | __ |
| Funcional | 45 min | __ |
| Responsive | 15 min | __ |
| Security | 10 min | __ |
| A11y | 10 min | __ |
| Performance | 5 min | __ |
| **TOTAL** | **90 min** | **__** |

---

**Testing Execution Plan v1.0**  
**Listo para comenzar testing en vivo** ✅

