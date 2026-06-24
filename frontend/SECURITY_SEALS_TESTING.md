# TESTING GUIDE — Security Seals Binding
## FASE 2 Validation Checklist

---

## 1. SETUP REQUERIDO

### Prerrequisitos:
```bash
cd frontend
npm install
npm start
```

### Navegación:
- URL: `http://localhost:3000` o `https://localhost:3000` (dependiendo del entorno)
- Scroll a la sección "Sellos de Seguridad y Confianza"

---

## 2. PRUEBAS VISUALES

### 2.1 Renderizado Correcto

- [ ] **Los 4 sellos aparecen** en grid responsive:
  - 1 columna en móvil
  - 2 columnas en tablet
  - 4 columnas en desktop

- [ ] **Estilos originales preservados:**
  - Fondo oscuro: `#0a1226`
  - Borde naranja: `#f97316` en hover
  - Íconos correctos: ShieldCheck, Lock, Server, KeyRound
  - Hover effect: border y background cambian
  - Animaciones suaves (transition-all duration-300)

- [ ] **Responsive design:**
  - Tablet (768px): 2 columnas ✓
  - Desktop (1024px): 4 columnas ✓
  - Mobile (375px): 1 columna ✓

### 2.2 Colores y Tipografía

- [ ] **Título principal:**
  - Color: blanco
  - Tamaño: responsive (text-2xl → text-3xl)
  - Palabra "estándares premium" en naranja

- [ ] **Subtítulo:**
  - Color: blanco/50
  - Tamaño: text-sm

- [ ] **Títulos de sellos:**
  - Color: blanco
  - Font-weight: semibold
  - Font-size: text-sm

- [ ] **Highlights:**
  - Color: `#f97316` naranja
  - Font-size: text-[11px]
  - Uppercase

---

## 3. PRUEBAS FUNCIONALES

### 3.1 Sello Habeas Data (Ley 1581)

#### Desktop - Mouse Hover:
1. Sitúate en el sello "Cumplimiento Ley 1581"
2. Verifica:
   - [ ] Tooltip aparece arriba del sello
   - [ ] Texto: "Acceso a políticas de privacidad..."
   - [ ] Botón "Ver Políticas" visible
   - [ ] Botón X de cierre visible
   - [ ] Border naranja activo
   - [ ] Icono se escala (scale-105)

#### Click / Navegación:
1. Click en el botón "Ver Políticas" dentro del tooltip
2. Verifica:
   - [ ] Navega a `/privacy` (PrivacyPolicy.jsx)
   - [ ] Página carga correctamente
   - [ ] Vuelve atrás (browser back) regresa a landing

#### Keyboard Navigation:
1. Tab hasta el sello Habeas Data
2. Verifica:
   - [ ] Focus visible (outline o border change)
   - [ ] Enter abre tooltip
   - [ ] Tab nuevamente accede al botón "Ver Políticas"
   - [ ] Enter en botón navega a `/privacy`
   - [ ] Escape cierra tooltip (via botón X accesible)

### 3.2 Sello SSL 256 Bits

#### Detección HTTPS:
**Si está en HTTPS (producción):**
- [ ] Highlight muestra: "Conexión Segura"
- [ ] Tooltip: "Conexión Segura Verificada — Tu comunicación está protegida con cifrado TLS 1.3 (256-bit)."
- [ ] Badge verde con checkmark (✓) visible
- [ ] Color del badge: `#10b981` (verde)

**Si está en HTTP (desarrollo):**
- [ ] Highlight muestra: "Extremo a extremo"
- [ ] Tooltip: "Esta conexión no está cifrada. En producción, esta aplicación usa HTTPS."
- [ ] Sin badge de verificación
- [ ] Estado visual neutro

#### Hover/Focus:
1. Sitúate sobre el sello SSL
2. Verifica:
   - [ ] Tooltip aparece
   - [ ] Contenido es diferente según protocolo
   - [ ] Pero el sello NO es clickeable (sin interacción)
   - [ ] Focus state visible (keyboard)

### 3.3 Sello Cloud Blindada

#### Tooltip:
1. Hover sobre sello "Cloud Blindada"
2. Verifica:
   - [ ] Tooltip aparece
   - [ ] Texto: "Infraestructura desplegada en entorno cloud..."
   - [ ] No expone detalles internos
   - [ ] No menciona AWS/Azure/GCP
   - [ ] Mensaje genérico y seguro

#### Seguridad:
- [ ] Inspecciona el componente (DevTools)
- [ ] NO hay `process.env` visible
- [ ] NO hay endpoints internos
- [ ] NO hay secretos

### 3.4 Sello SupportAccessGate

#### Sin Token Activo (Caso Normal):
1. Hover sobre sello "SupportAccessGate"
2. Verifica:
   - [ ] Highlight muestra: "Acceso controlado"
   - [ ] Tooltip: "...Sin token activo."
   - [ ] Sin badge de "activo"
   - [ ] Estado visual indica "cerrado"

#### Con Token Activo (Si está disponible):
1. Activa un token en `/admin/support-access`
2. Vuelve a landing, hover sobre sello
3. Verifica:
   - [ ] Highlight cambia a: "Acceso Activo"
   - [ ] Tooltip: "...Token activo."
   - [ ] Badge naranja pulsante visible (animate-pulse)
   - [ ] Estado visual indica "activo"

#### Integración con Sistema Real:
- [ ] Función `isSupportAccessActive()` se ejecuta correctamente
- [ ] Refleja el estado real de `localStorage` (token)
- [ ] Cambios en `/admin/support-access` se reflejan dinámicamente

---

## 4. PRUEBAS DE ACCESIBILIDAD

### 4.1 ARIA Labels y Roles

Abre DevTools → Accessibility Inspector:

- [ ] Sección tiene `aria-labelledby="trust-seals-title"`
- [ ] Cada sello tiene:
  - `aria-label="Sello de seguridad: [Title]"`
  - `aria-describedby="seal-desc-[key]"`
  - `role="region"` o `role="button"` (para interactivos)
- [ ] Tooltips asociados con descripción

### 4.2 Keyboard Navigation

1. Presiona **Tab** varias veces desde arriba
2. Verifica:
   - [ ] El foco entra en el sello Habeas Data
   - [ ] El foco se mueve entre sellos
   - [ ] Focus visible en cada elemento
   - [ ] Order: Habeas → SSL → Cloud → SupportAccessGate

3. Presiona **Enter** en Habeas Data
   - [ ] Tooltip se abre
   - [ ] Tab nuevamente llega al botón "Ver Políticas"
   - [ ] Enter navega a `/privacy`

4. Presiona **Escape** (via botón X)
   - [ ] Tooltip se cierra

### 4.3 Screen Reader (NVDA / JAWS / VoiceOver)

**NVDA (Windows):**
1. Abre NVDA
2. Navega a sección de sellos
3. Verifica:
   - [ ] Lee "Sellos de Seguridad y Confianza" como región
   - [ ] Lee título: "Su información protegida con estándares premium"
   - [ ] Lee cada sello: "Sello de seguridad: [Title]"
   - [ ] Lee descripción al navigar

**VoiceOver (macOS/iOS):**
1. Activa VoiceOver (Cmd+F5)
2. Navega con VO (Control+Option+Arrows)
3. Verifica mismos puntos que NVDA

---

## 5. PRUEBAS DE ANALYTICS

### 5.1 Eventos `security_badge_view`

Abre **DevTools → Console** y ejecuta:
```javascript
window.dataLayer = window.dataLayer || [];
console.log(window.dataLayer);
```

1. Hover sobre cada sello
2. Verifica en console/Network:
   - [ ] Evento `security_badge_view` disparado
   - [ ] Parámetro `seal: "habeas-data"` (u otro)
   - [ ] Se envía a Google Analytics

### 5.2 Eventos `security_badge_click`

1. Click en botón "Ver Políticas" (Habeas Data)
2. Verifica en console/Network:
   - [ ] Evento `security_badge_click` disparado
   - [ ] Parámetros: `seal: "habeas-data"`, `action: "navigate"`
   - [ ] Google Analytics recibe evento

### 5.3 Verificar en Google Analytics

1. Abre Google Analytics dashboard
2. Navega a: **Eventos → Selecciona evento personalizado**
3. Busca: `security_badge_view` y `security_badge_click`
4. Verifica:
   - [ ] Eventos aparecen en dashboard
   - [ ] Conteos son correctos
   - [ ] Parámetros se visualizan

---

## 6. PRUEBAS DE SEGURIDAD

### 6.1 No Credenciales Expuestas

Abre DevTools → Network:
1. Interactúa con los sellos (click, hover)
2. Verifica:
   - [ ] NO hay request a `/admin/support-access` para obtener tokens
   - [ ] NO hay envío de credenciales en headers
   - [ ] NO hay tokens en URL/body de requests

### 6.2 No Tokens Expuestos

En DevTools → Console:
```javascript
localStorage.getItem("supportToken");  // Debe existir, pero...
```
1. Verifica:
   - [ ] Token NO aparece en texto del componente
   - [ ] Token NO aparece en tooltips
   - [ ] Token NO aparece en analytics

### 6.3 No Variables de Entorno Expuestas

Inspecciona HTML del componente:
```html
<div class="...">
  {/* Debe ser genérico, sin detalles de config */}
</div>
```

- [ ] NO hay `process.env` visible
- [ ] NO hay nombres de servicios (AWS, Firebase, etc.)
- [ ] NO hay IP/dominios internos
- [ ] NO hay rutas administrativas mencionadas

### 6.4 No Endpoints Internos Expuestos

En tooltips y texto:
- [ ] NO menciona `/admin/support-access`
- [ ] NO menciona `/api/security/status`
- [ ] NO menciona `/security/token`
- [ ] Mensajes son genéricos y seguros

---

## 7. PRUEBAS DE RESPONSIVENESS

### Mobile (iPhone 12 - 390px):
- [ ] Grid: 1 columna
- [ ] Sellos apilados verticalmente
- [ ] Tooltips no salen de pantalla
- [ ] Botones clickeables (touch-friendly)
- [ ] Texto legible sin zoom

### Tablet (iPad - 768px):
- [ ] Grid: 2 columnas
- [ ] Layout equilibrado
- [ ] Tooltips posicionados correctamente
- [ ] No hay desbordamiento horizontal

### Desktop (1920px):
- [ ] Grid: 4 columnas
- [ ] Layout completo visible
- [ ] Tooltips aparecen correctamente
- [ ] Hover states funcionan

---

## 8. PRUEBAS DE RENDIMIENTO

### 8.1 Component Mount Time

En DevTools → Performance:
1. Graba el navegador durante carga de landing
2. Verifica:
   - [ ] SecuritySeals renderiza en < 100ms
   - [ ] No hay re-renders innecesarios
   - [ ] useEffect se ejecuta una sola vez

### 8.2 Analytics No Bloquea

1. En Network → XHR/Fetch
2. Verifica:
   - [ ] Google Analytics se carga async
   - [ ] trackEvent() no bloquea UI
   - [ ] Sin errores en console

### 8.3 Memory Leaks

1. DevTools → Memory
2. Toma snapshot inicial
3. Interactúa con sellos 50 veces
4. Toma snapshot final
5. Verifica:
   - [ ] Memoria no aumenta significativamente
   - [ ] No hay listeners sin limpiar

---

## 9. PRUEBAS DE INTEGRACIÓN

### 9.1 LandingPage importa SecuritySeals

Abre `frontend/src/pages/LandingPage.jsx`:
```javascript
import { SecuritySeals } from '@/components/security/SecuritySeals';
```
- [ ] Importación existe
- [ ] Ruta correcta (`@/components/security/SecuritySeals`)

### 9.2 SecuritySeals reemplaza sección antigua

En LandingPage:
```jsx
<SecuritySeals />
```
- [ ] Component se usa correctamente
- [ ] Sección HTML antigua fue removida
- [ ] No hay duplicados

### 9.3 Dependencias Disponibles

Verifica que existen:
- [ ] `frontend/src/pages/legal/PrivacyPolicy.jsx`
- [ ] `frontend/src/pages/legal/CookiePolicy.jsx`
- [ ] `frontend/src/pages/legal/TermsConditions.jsx`
- [ ] `frontend/src/core/security/supportToken.js`
- [ ] `frontend/src/lib/analytics.js`
- [ ] `lucide-react` (iconos)
- [ ] `react-router-dom` (useNavigate)

---

## 10. EDGE CASES

### 10.1 SupportAccessGate Token Expirado

1. Activa token normal
2. Espera a que expire (o elimínalo de localStorage)
3. Vuelve a landing
4. Verifica:
   - [ ] Sello cambia a "Acceso controlado"
   - [ ] Badge desaparece
   - [ ] Tooltip actualiza

### 10.2 Cambio de Protocolo HTTPS ↔ HTTP

En producción HTTPS, accede vía HTTP (si disponible):
- [ ] Sello SSL muestra estado correcto por protocolo actual
- [ ] Tooltip actualiza

### 10.3 Tooltips en Bordes de Pantalla

En dispositivo pequeño, hover sobre último sello:
- [ ] Tooltip no sale de pantalla
- [ ] Posicionamiento correcto (bottom: 100%, translate-x)

### 10.4 Rápido Hover In/Out

Pasa el mouse rápidamente sobre varios sellos:
- [ ] Tooltips abren/cierran suavemente
- [ ] Sin lag o flicker
- [ ] Estado se sincroniza correctamente

---

## 11. VALIDACIÓN FINAL

### Checklist de Completitud:

- [ ] Componente creado: `SecuritySeals.jsx`
- [ ] LandingPage importa y usa componente
- [ ] 4 sellos vinculados a funcionalidades reales
- [ ] HTTPS detectado dinámicamente
- [ ] Ley 1581 navega a políticas
- [ ] SupportAccessGate refleja estado real
- [ ] Cloud muestra tooltip sin secretos
- [ ] ARIA labels completos
- [ ] Keyboard navigation funciona
- [ ] Analytics dispara eventos correctos
- [ ] Sin credenciales/tokens/endpoints expuestos
- [ ] Estilos originales preservados
- [ ] Responsive en todas resoluciones
- [ ] Sin errores en console
- [ ] Sin memory leaks

---

## 12. REPORTE DE BUGS

Si encuentras un issue, reporta:

**Formato:**
```
### Issue: [Breve descripción]
- Browser: [Chrome/Firefox/Safari/Edge]
- OS: [Windows/macOS/Linux]
- Resolution: [1920x1080/768x1024/375x812]
- Pasos para reproducir:
  1. ...
  2. ...
  3. ...
- Resultado esperado:
- Resultado actual:
- Screenshot:
```

---

**Testing completado:** ___/___/______  
**Tester:** ___________________  
**Resultado:** ✅ PASS / ❌ FAIL  

