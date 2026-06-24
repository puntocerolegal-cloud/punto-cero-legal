# LIVE TESTING GUIDE
## Cómo Visualizar y Testear SecuritySeals en el Navegador

---

## 1. STARTUP DEL PROYECTO

### Requisitos:
- Node.js 16+
- npm o yarn instalado
- Frontend en `frontend/` directory

### Pasos:
```bash
# Navega al directorio del frontend
cd frontend

# Instala dependencias (si no lo has hecho)
npm install

# Inicia el servidor de desarrollo
npm start
```

### Resultado esperado:
- Compilación sin errores
- Landing page se abre en `http://localhost:3000`
- DevTools muestra contenido sin errores críticos

---

## 2. LOCALIZANDO LOS SELLOS

### En LandingPage:
1. Abre `http://localhost:3000` en el navegador
2. **Scroll hacia abajo** hasta encontrar la sección "Seguridad y Confianza"
3. Debe estar **antes del footer** (al final de la página)

### Indicadores visuales:
- **Badge naranja:** "Seguridad y Confianza" (pequeño badge superior)
- **Título blanco:** "Su información protegida con estándares premium"
- **4 tarjetas:** Una para cada sello

```
┌─────────────────────────────────────────┐
│ 🛡️ Seguridad y Confianza               │
│                                         │
│ Su información protegida con           │
│ estándares premium                      │
│                                         │
│ [Sello 1] [Sello 2] [Sello 3] [Sello 4]│
└─────────────────────────────────────────┘
```

---

## 3. TESTING VISUAL — Cada Sello

### Sello 1: Cumplimiento Ley 1581 (Habeas Data)

**Visual:**
- Icono: escudo con checkmark
- Título: "Cumplimiento Ley 1581"
- Highlight: "Habeas Data" (naranja)
- Descripción: "Datos jurídicos protegidos..."

**Interacción:**
1. **Hover sobre el sello** (desktop)
   - Border cambia a naranja: `#f97316`
   - Background se ilumina ligeramente
   - Icono se escala hacia arriba (110%)
2. **Tooltip aparece arriba:**
   - Fondo oscuro: `#1a2847`
   - Texto: "Acceso a políticas de privacidad..."
   - Botón "Ver Políticas" en naranja
   - Botón X en esquina superior derecha
3. **Click en "Ver Políticas"**
   - Navega a `/privacy`
   - Se abre página de Privacy Policy
   - URL: `http://localhost:3000/privacy`

**Keyboard Test:**
1. Presiona **Tab** varias veces hasta llegar al sello
2. Focus se aplica al sello
3. Presiona **Enter**
4. Tooltip se abre
5. Presiona **Tab** nuevamente
6. Focus llega al botón "Ver Políticas"
7. Presiona **Enter**
8. Navega a `/privacy`
9. Presiona **Escape** (o click en X)
10. Tooltip se cierra

---

### Sello 2: Cifrado SSL 256 bits

**Visual:**
- Icono: candado cerrado
- Título: "Cifrado SSL 256 bits"
- Highlight: Cambia según protocolo

**Detección automática:**

**Si está en HTTPS (producción):**
- Highlight: "Conexión Segura" (verde)
- Badge: Pequeño círculo verde con ✓
- Tooltip: "Conexión Segura Verificada — Tu comunicación está protegida con cifrado TLS 1.3 (256-bit)."

**Si está en HTTP (desarrollo local):**
- Highlight: "Extremo a extremo" (naranja)
- Sin badge
- Tooltip: "Esta conexión no está cifrada. En producción, esta aplicación usa HTTPS."

**Test en Desarrollo (HTTP):**
1. Hover sobre el sello SSL
2. Tooltip debe mostrar mensaje de "no cifrada"
3. Badge no debe estar presente
4. Highlight: "Extremo a extremo"

---

### Sello 3: Cloud Blindada

**Visual:**
- Icono: servidor/cloud
- Título: "Cloud Blindada"
- Highlight: "Alta disponibilidad"
- Descripción: "Servidores con respaldos..."

**Test:**
1. Hover sobre el sello
2. Tooltip aparece con texto:
   > "Infraestructura desplegada en entorno cloud con alta disponibilidad, respaldos automáticos continuos y redundancia permanente en múltiples zonas."
3. Verifica que **NO menciona:**
   - AWS, Azure, GCP, u otro proveedor
   - Endpoints internos
   - Variables de entorno
   - Secretos de configuración
4. Este sello **NO es clickeable** (solo informativo)

---

### Sello 4: SupportAccessGate

**Visual (sin token activo):**
- Icono: llave
- Título: "SupportAccessGate"
- Highlight: "Acceso controlado" (rojo/naranja)
- Descripción: "Acceso técnico restringido..."

**Test sin token:**
1. Hover sobre el sello
2. Tooltip: "...Sin token activo."
3. No hay badge especial
4. Este sello **NO es clickeable**

**Visual (con token activo - OPCIONAL):**
- Highlight: "Acceso Activo" (naranja)
- Badge: Pequeño círculo naranja pulsante (animate-pulse)
- Tooltip: "...Token activo."

**Para activar token (si tienes acceso admin):**
1. Ve a `/admin/support-access`
2. Sigue el proceso para generar un token
3. Vuelve a landing
4. Sello cambia dinámicamente

---

## 4. TESTING DE RESPONSIVENESS

### Mobile (iPhone 12 - 390px)

**Procedimiento:**
1. Abre DevTools: `F12` o `Ctrl+Shift+I`
2. Haz click en icono de responsive design (o `Ctrl+Shift+M`)
3. Selecciona **iPhone 12** (390x844)
4. Scroll a sección de sellos

**Verificar:**
- [ ] Los 4 sellos se apilan en **1 columna**
- [ ] Cada sello es clickeable/hoverable
- [ ] Tooltips no salen de pantalla
- [ ] Botones son tamaño touch-friendly (min 44px)
- [ ] Texto es legible sin zoom

### Tablet (iPad - 768px)

**Procedimiento:**
1. En DevTools, selecciona **iPad** (768x1024)
2. O redimensiona ventana a 768px ancho

**Verificar:**
- [ ] Los sellos se muestran en **2 columnas**
- [ ] Layout está balanceado
- [ ] Tooltips posicionados correctamente

### Desktop (1920px)

**Procedimiento:**
1. En DevTools, selecciona **Laptop** (1440x900)
2. O redimensiona ventana a 1920px ancho

**Verificar:**
- [ ] Los sellos se muestran en **4 columnas**
- [ ] Layout completo visible
- [ ] Sin necesidad de scroll horizontal

---

## 5. TESTING DE ANALYTICS

### En DevTools — Console

**Método 1: Ver eventos directos**

1. Abre DevTools → Console
2. Ejecuta:
```javascript
window.gtag = window.gtag || function(...args) { 
  console.log('gtag called with:', args); 
};
```
3. Interactúa con sellos (hover, click)
4. Verifica que se loguean eventos en console

**Método 2: Inspeccionar dataLayer**

1. Abre Console
2. Ejecuta:
```javascript
console.log(window.dataLayer);
```
3. Debe contener array de eventos

**Método 3: Network Inspector**

1. Abre DevTools → Network
2. Filtra por "analytics" o "gtag"
3. Interactúa con sellos
4. Verifica que se envía request a Google Analytics

### Eventos que debes ver:

**security_badge_view**
```javascript
{
  event: "security_badge_view",
  seal: "habeas-data" // o ssl-256, cloud-infrastructure, support-access
}
```

**security_badge_click**
```javascript
{
  event: "security_badge_click",
  seal: "habeas-data",
  action: "navigate"
}
```

---

## 6. TESTING DE ACCESIBILIDAD

### Con NVDA (Windows)

1. Descarga NVDA: https://www.nvaccess.org/
2. Instala y abre
3. Navega a landing page
4. Presiona **Control+Home** para ir al inicio
5. Presiona **Flecha Abajo** para navegar por elementos
6. NVDA debe leer:
   - Título de sección
   - Cada sello con su label
   - Tooltips al focus

### Con JAWS (Windows)

Similar a NVDA:
1. Abre JAWS
2. Navega con flechas
3. Presiona **Numpad Plus** en sellos para más información

### Con VoiceOver (macOS/iOS)

1. Abre **Preferencias del Sistema** → **Accesibilidad** → **VoiceOver**
2. Activa VoiceOver (Cmd+F5)
3. Usa **Control+Option+Arrows** para navegar
4. VoiceOver debe leer labels y descripciones

### Con Chrome DevTools Accessibility Inspector

1. DevTools → Accessibility Inspector
2. Click en sello
3. En panel derecho, verifica:
   - **Name:** "Sello de seguridad: [Title]"
   - **Role:** "region" o "button"
   - **Attributes:** aria-describedby está presente

---

## 7. TESTING DE SEGURIDAD

### Verificar No Credenciales

**En DevTools → Network:**
1. Interactúa con todos los sellos
2. Mira cada request
3. Verifica que:
   - [ ] No hay token en URL
   - [ ] No hay credenciales en headers
   - [ ] No hay solicitud a `/admin/support-access`

### Verificar No Tokens Expuestos

**En DevTools → Console:**
1. Abre Console
2. Ejecuta:
```javascript
localStorage.getItem("supportToken")
```
3. Puede haber un token, pero:
   - [ ] NO debe estar en el HTML del sello
   - [ ] NO debe estar en los tooltips
   - [ ] NO debe estar en los eventos analytics

### Inspeccionar HTML

**En DevTools → Elements:**
1. Click derecho en un sello
2. "Inspect" o "Inspeccionar elemento"
3. Mira el HTML
4. Verifica que:
   - [ ] No hay `process.env` visible
   - [ ] No hay endpoints internos mencionados
   - [ ] No hay secretos en data attributes

### Verificar Storage

**En DevTools → Storage/Application:**
1. Mira `localStorage`
2. Mira `sessionStorage`
3. Mira `Cookies`
4. Verifica que:
   - [ ] No hay tokens en claro
   - [ ] No hay credenciales
   - [ ] No hay información sensible

---

## 8. TESTING DE ERRORES

### Buscar Errores en Console

1. DevTools → Console
2. Filtra por: `errors`
3. Verifica que:
   - [ ] No hay errores rojos críticos
   - [ ] No hay warnings sobre componentes React
   - [ ] No hay errores de imports

### Errores Esperados vs No Esperados

**ESPERAR:**
- Warnings de development (React.StrictMode)
- Warnings de deprecation (si alguno)

**NO ESPERAR:**
- Errores de "Cannot read property..."
- Errores de "undefined is not a function"
- Errores de imports missing
- Errores de navigation failed

---

## 9. TESTING FUNCIONAL COMPLETO

### Checklist de Sello en Sello

#### Habeas Data
- [ ] Hover muestra tooltip
- [ ] Tooltip tiene botón "Ver Políticas"
- [ ] Click en botón navega a `/privacy`
- [ ] `/privacy` carga correctamente
- [ ] Volver atrás regresa a landing
- [ ] Tab/Enter funciona
- [ ] Evento analytics disparado

#### SSL 256
- [ ] Hover muestra tooltip
- [ ] Tooltip muestra estado correcto (HTTPS/HTTP)
- [ ] Badge visible en HTTPS
- [ ] No es clickeable
- [ ] Evento analytics disparado

#### Cloud Blindada
- [ ] Hover muestra tooltip
- [ ] Tooltip es informativo
- [ ] No expone secretos
- [ ] No es clickeable
- [ ] Evento analytics disparado

#### SupportAccessGate
- [ ] Hover muestra tooltip
- [ ] Tooltip muestra estado (activo/inactivo)
- [ ] Badge visible si activo (pulsante)
- [ ] No es clickeable
- [ ] Evento analytics disparado

---

## 10. TESTING DE RENDIMIENTO

### Medir Load Time

1. DevTools → Performance
2. Presiona **Record**
3. Scroll a sección de sellos
4. Presiona **Stop**
5. Analiza:
   - [ ] SecuritySeals renderiza en < 100ms
   - [ ] No hay re-renders innecesarios
   - [ ] No hay layout thrashing

### Medir Memory

1. DevTools → Memory
2. Toma **heap snapshot** inicial
3. Interactúa con sellos 100 veces
4. Toma **heap snapshot** final
5. Compara:
   - [ ] Aumento de memoria < 1MB
   - [ ] No hay memory leaks

---

## 11. QUICK SMOKE TEST (5 MINUTOS)

Si no tienes mucho tiempo, haz este test rápido:

```
1. npm start
2. Scroll a sellos ✓
3. Hover sobre cada sello ✓
4. Click en "Ver Políticas" → navega a /privacy ✓
5. Volver atrás ✓
6. Tab en sello → tooltip ✓
7. DevTools Console → sin errores ✓
8. DevTools Network → sin credenciales ✓

✅ SMOKE TEST PASADO
```

---

## 12. TROUBLESHOOTING

### Problema: Sellos no aparecen
**Solución:**
1. Verifica que `SecuritySeals` está importado en LandingPage
2. Verifica que `<SecuritySeals />` está en el render
3. Abre Console → mira errores
4. Recarga página (Ctrl+Shift+R hard refresh)

### Problema: Tooltip no aparece
**Solución:**
1. Verifica que estás en desktop (no en mobile)
2. Intenta click en lugar de hover
3. Intenta Tab + Enter
4. Abre DevTools → Elements → inspecciona tooltip HTML

### Problema: Click en "Ver Políticas" no navega
**Solución:**
1. Verifica que `/privacy` existe
2. Verifica que `useNavigate()` está importado
3. Abre Console → mira errores de navigation
4. Verifica que Router está configurado correctamente

### Problema: Analytics no se ve
**Solución:**
1. Verifica que `trackEvent()` está importado
2. Verifica que Google Analytics está cargado (busca `gtag` en window)
3. Abre Console → ejecuta `console.log(window.gtag)`
4. Verifica que eventos se loguean

### Problema: Errores en Console
**Solución:**
1. Lee el error completamente
2. Busca la línea de código mencionada
3. Verifica imports y rutas
4. Recarga página
5. Si persiste, revisa git diff para cambios recientes

---

## 13. DOCUMENTACIÓN Y REPORTES

**Si todo funciona correctamente:**
- ✅ Completa el checklist en `SECURITY_SEALS_TESTING.md`
- ✅ Reporta resultados positivos
- ✅ El componente está **LISTO PARA MERGE**

**Si encuentras problemas:**
- ❌ Documenta el issue con:
  - Browser y OS
  - Pasos para reproducir
  - Error message exacto
  - Screenshot si aplica
- ❌ Reporta en pull request o issue

---

**Happy Testing! 🚀**

