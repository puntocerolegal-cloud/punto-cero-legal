# Fase 4: Especificación de UI - Solicitudes de Firmas

**Ruta**: `/admin/firms-solicitudes`  
**Componente**: `FirmSolicitudesModule.jsx`  
**Layout**: `AdminOSLayout`

---

## Estructura General

```
┌──────────────────────────────────────────────────────┐
│  HEADER                                              │
│  Título: "Solicitudes de Firmas"                     │
│  Subtítulo: "Gestiona y aprueba solicitudes..."      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  DASHBOARD DE ESTADÍSTICAS                           │
│  [Pendientes]  [Aprobadas]  [Rechazadas]             │
│  [Total]       [Trials Activos]                      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  FILTROS Y BÚSQUEDA                                  │
│  [Buscar...] [Plan ▼] [País ▼] [Limpiar Filtros]    │
│  Mostrando X de Y solicitudes                        │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  TABLA DE SOLICITUDES                                │
│  [ Firma | Resp | Email | Telf | País | ... ]       │
│  [ row 1                                             │
│  [ row 2                                             │
│  [ row 3 ...                                         │
└──────────────────────────────────────────────────────┘
```

---

## 1. HEADER

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  Solicitudes de Firmas                                   ║
║  Gestiona y aprueba las solicitudes de registro de nuevas║
║  firmas                                                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

**Estilos**:
- Título: `text-4xl font-bold text-white`
- Subtítulo: `text-gray-400`
- Margen inferior: `mb-8`

---

## 2. DASHBOARD DE ESTADÍSTICAS

### Layout de Tarjetas

```
desktop (5 columnas):
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Pend... │ Aprob.. │ Rech... │ Total   │ Trials  │
└─────────┴─────────┴─────────┴─────────┴─────────┘

tablet (3 columnas):
┌─────────┬─────────┬─────────┐
│ Pend... │ Aprob.. │ Rech... │
├─────────┼─────────┼─────────┤
│ Total   │ Trials  │         │
└─────────┴─────────┴─────────┘

mobile (1 columna):
┌─────────┐
│ Pend... │
├─────────┤
│ Aprob.. │
├─────────┤
│ Rech... │
├─────────┤
│ Total   │
├─────────┤
│ Trials  │
└─────────┘
```

### Card: Solicitudes Pendientes

```
╔════════════════════════════════════════╗
║                                        ║
║  📄 Solicitudes Pendientes             ║
║                                        ║
║  5                                     ║
║  Aguardando revisión                   ║
║                                        ║
╚════════════════════════════════════════╝
```

**Estilos**:
- Fondo: `bg-gradient-to-br from-yellow-900/30 to-yellow-900/10`
- Borde: `border border-yellow-700/50`
- Texto label: `text-yellow-200 text-sm uppercase`
- Número: `text-4xl font-bold text-yellow-300`
- Hover: `hover:border-yellow-600`

**Ícono**:
- FileText (amarillo)
- Fondo: `bg-yellow-600/30`
- Padding: `p-2`

### Card: Firmas Aprobadas

```
╔════════════════════════════════════════╗
║                                        ║
║  ✓ Aprobadas                           ║
║                                        ║
║  3                                     ║
║  Firmas activas                        ║
║                                        ║
╚════════════════════════════════════════╝
```

**Estilos**:
- Fondo: `bg-gradient-to-br from-green-900/30 to-green-900/10`
- Borde: `border border-green-700/50`
- Texto label: `text-green-200`
- Número: `text-4xl font-bold text-green-300`

### Card: Rechazadas

```
╔════════════════════════════════════════╗
║                                        ║
║  ✗ Rechazadas                          ║
║                                        ║
║  1                                     ║
║  No aprobadas                          ║
║                                        ║
╚════════════════════════════════════════╝
```

**Estilos**: Rojo (similar a Pendientes pero con colores rojo)

### Card: Total

```
╔════════════════════════════════════════╗
║                                        ║
║  🏢 Total                              ║
║                                        ║
║  9                                     ║
║  Solicitudes registradas               ║
║                                        ║
╚════════════════════════════════════════╝
```

**Estilos**: Azul

### Card: Trials Activos

```
╔════════════════════════════════════════╗
║                                        ║
║  📈 Trials Activos                     ║
║                                        ║
║  3                                     ║
║  En período de prueba                  ║
║                                        ║
╚════════════════════════════════════════╝
```

**Estilos**: Púrpura

---

## 3. FILTROS Y BÚSQUEDA

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  🔍 Filtros                                              ║
║                                                          ║
║  ┌─────────────────┬──────────────┬──────────────┐      ║
║  │ Buscar firma... │ Plan ▼       │ País ▼       │      ║
║  ├─────────────────┼──────────────┼──────────────┤      ║
║  │ [Limpiar Filtros]                             │      ║
║  └─────────────────────────────────────────────────┘      ║
║                                                          ║
║  Mostrando 5 de 9 solicitudes                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Campo de Búsqueda

```
┌─────────────────────────────────────────┐
│ 🔍 Buscar firma, email, NIT...          │
└─────────────────────────────────────────┘
```

**Estilos**:
- Fondo: `bg-gray-900 border border-gray-700`
- Focus: `border-blue-500`
- Placeholder: `text-gray-500`
- Icono: `text-gray-500`
- Ícono position: `absolute left-3 top-1/2 -translate-y-1/2`

### Select: Plan

```
┌──────────────────────────┐
│ Todos los Planes       ▼ │
├──────────────────────────┤
│ Crecimiento (5)         │
│ Enterprise (10)         │
└──────────────────────────┘
```

**Estilos**:
- Fondo: `bg-gray-900`
- Borde: `border border-gray-700`
- Texto: `text-white text-sm`

### Select: País

Similar a Plan, con lista dinámica de países.

### Botón: Limpiar Filtros

```
┌──────────────────────┐
│ Limpiar Filtros      │
└──────────────────────┘
```

**Estilos**:
- Fondo: `bg-gray-700 hover:bg-gray-600`
- Texto: `text-white font-medium text-sm`
- Transition: `transition-colors`

---

## 4. TABLA DE SOLICITUDES

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Firma          │ Responsable    │ Email              │ Telf         │ País  │
├────────────────────────────────────────────────────────────────────────────┤
│ Firma ABC      │ Juan Pérez     │ contact@abc.com    │ +573001234   │ Col.. │
│ NIT: 900123456 │                │                    │              │       │
├────────────────────────────────────────────────────────────────────────────┤
│ Despacho XYZ   │ María García   │ info@xyz.com       │ +573007654   │ Col.. │
│ NIT: 900789012 │                │                    │              │       │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Columnas**:
1. **Firma**: Nombre + NIT (dos líneas)
2. **Responsable**: owner_name
3. **Email**: email corporativo
4. **Teléfono**: phone
5. **País**: country
6. **Plan**: Badge (Crecimiento/Enterprise)
7. **Fecha**: created_at (formato es-CO: dd/mm/yyyy)
8. **Estado**: Badge "Pendiente"
9. **Acciones**: Botón Ver Detalles (ícono ojo)

### Estilos de Tabla

**Container**:
- Fondo: `bg-gray-800/30`
- Borde: `border border-gray-700/30`
- Overflow: `overflow-x-auto`

**Header**:
- Fondo: `bg-gray-900/60`
- Borde inferior: `border-b border-gray-700/50`
- Texto: `text-white text-sm font-semibold`
- Padding: `px-6 py-4`

**Filas**:
- Borde inferior: `border-b border-gray-700/30`
- Hover: `hover:bg-gray-700/30`
- Transition: `transition-colors`

**Datos**:
- Nombre firma: `font-semibold text-white text-sm`
- NIT: `text-xs text-gray-400 mt-1`
- Email/Teléfono/País: `text-sm text-gray-300/400`

### Badge: Plan

```
┌────────────────────┐
│ Crecimiento (5)   │
└────────────────────┘
```

**Estilos**:
- Fondo: `bg-blue-900/50`
- Texto: `text-blue-300`
- Badge: `px-3 py-1 rounded-full text-xs font-semibold`

### Badge: Estado

```
┌────────────────────┐
│ Pendiente         │
└────────────────────┘
```

**Estilos**:
- Fondo: `bg-yellow-900/50`
- Texto: `text-yellow-300`

### Botón: Ver Detalles

```
┌──┐
│👁 │
└──┘
```

**Estilos**:
- Icono: `Eye` (lucide-react)
- Fondo hover: `hover:bg-blue-600/30`
- Padding: `p-2`
- Color: `text-blue-400 hover:text-blue-300`
- Transition: `transition-colors`
- Cursor: `cursor-pointer`

---

## 5. MODAL DE DETALLES

```
╔═════════════════════════════════════════════════════════════════╗
║  Detalles de la Solicitud            ✕                          ║
║  Firma ABC                                                       ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  🏢 Información de la Firma                                     ║
║                                                                 ║
║  ┌────────────────────────┬─────────────────────────┐          ║
║  │ Nombre                 │ Plan                    │          ║
║  │ Firma ABC              │ Crecimiento (5 abogados)│          ║
║  ├────────────────────────┼─────────────────────────┤          ║
║  │ NIT                    │ Teléfono                │          ║
║  │ 900123456              │ +573001234567           │          ║
║  └────────────────────────┴─────────────────────────┘          ║
║                                                                 ║
║  📄 Socio Fundador                                              ║
║                                                                 ║
║  ┌────────────────────────┬─────────────────────────┐          ║
║  │ Nombre                 │ Email                   │          ║
║  │ Juan Pérez             │ juan@abc.com            │          ║
║  └────────────────────────┴─────────────────────────┘          ║
║                                                                 ║
║  📅 Información de Registro                                     ║
║                                                                 ║
║  ┌────────────────────────┬─────────────────────────┐          ║
║  │ Fecha de Registro      │ Última Actualización    │          ║
║  │ 28/06/2025 14:30:00    │ 28/06/2025 14:30:00     │          ║
║  └────────────────────────┴─────────────────────────┘          ║
║                                                                 ║
║  ┌──────────────────────────────────────────────────────┐      ║
║  │ [APROBAR FIRMA]  [RECHAZAR]  [Cerrar]              │      ║
║  └──────────────────────────────────────────────────────┘      ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝
```

### Estilos Modal General

**Overlay**:
- Fondo: `fixed inset-0 bg-black/60`
- Z-index: `z-50`
- Centrado: `flex items-center justify-center`

**Container**:
- Fondo: `bg-gray-900`
- Borde: `border border-gray-700`
- Redondeado: `rounded-2xl`
- Max-width: `max-w-3xl`
- Altura: `max-h-[90vh] overflow-y-auto`

**Header**:
- Sticky: `sticky top-0`
- Fondo: `bg-gray-900`
- Borde: `border-b border-gray-700`
- Padding: `p-6`
- Z-index: `z-10`
- Flex: `flex items-center justify-between`

**Título Header**:
- Texto: `text-2xl font-bold text-white`
- Subtítulo: `text-gray-400 text-sm mt-1`

**Botón Cerrar**:
- Icono: `X`
- Fondo hover: `hover:bg-gray-800`
- Padding: `p-2`
- Redondeado: `rounded-lg`
- Color: `text-gray-400`

**Content**:
- Padding: `p-6`
- Space: `space-y-6`

### Secciones de Contenido

**Título Sección**:
- Texto: `text-lg font-semibold text-white mb-4`
- Icono: `w-5 h-5 text-{color}-400` (colores diferentes por sección)

**Grid de Datos**:
```
bg-gray-800/30 rounded-lg p-4
grid md:grid-cols-2 gap-6
```

**Etiqueta de Campo**:
```
text-gray-400 text-xs uppercase tracking-wider mb-1
```

**Valor de Campo**:
```
text-white font-medium text-lg (o text-sm para datos pequeños)
```

### Botones del Modal

**Botón: APROBAR FIRMA**
```
┌──────────────────────────────┐
│ ✓ APROBAR FIRMA              │
└──────────────────────────────┘
```
- Fondo: `bg-green-600 hover:bg-green-700`
- Flex: `flex-1`
- Padding: `px-4 py-3`
- Redondeado: `rounded-lg`
- Texto: `text-white font-semibold`

**Botón: RECHAZAR**
```
┌──────────────────────────────┐
│ ✕ RECHAZAR                   │
└──────────────────────────────┘
```
- Fondo: `bg-red-600 hover:bg-red-700`
- Similar a APROBAR FIRMA

**Botón: Cerrar**
```
┌──────────────────────────────┐
│ Cerrar                       │
└──────────────────────────────┘
```
- Fondo: `bg-gray-700 hover:bg-gray-600`

---

## 6. MODAL DE RECHAZO

```
╔═════════════════════════════════════════════════════════╗
║  Rechazar Solicitud                  ✕                  ║
╠═════════════════════════════════════════════════════════╣
║                                                         ║
║  Está a punto de RECHAZAR la solicitud de               ║
║  "Firma ABC"                                            ║
║                                                         ║
║  El propietario recibirá notificación por email.        ║
║                                                         ║
║  Motivo del Rechazo *                                   ║
║  ┌─────────────────────────────────────────────┐       ║
║  │                                             │       ║
║  │ Información incompleta o documentación...  │       ║
║  │                                             │       ║
║  │ (6 filas de textarea)                      │       ║
║  │                                             │       ║
║  │                                             │       ║
║  └─────────────────────────────────────────────┘       ║
║  42 / 500 caracteres                                    ║
║                                                         ║
║  ┌──────────────────────────────────────┐              ║
║  │ [Cancelar] [Confirmar Rechazo]      │              ║
║  └──────────────────────────────────────┘              ║
║                                                         ║
╚═════════════════════════════════════════════════════════╝
```

### Textarea: Motivo del Rechazo

```
┌─────────────────────────────────────────────┐
│ Explica detalladamente el motivo del...     │
│                                             │
│                                             │
│ (6 filas)                                   │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
42 / 500 caracteres
```

**Estilos**:
- Fondo: `bg-gray-800`
- Borde: `border border-gray-700`
- Focus: `focus:border-blue-500`
- Padding: `px-4 py-3`
- Redondeado: `rounded-lg`
- Texto: `text-white`
- Placeholder: `text-gray-500`
- Resize: `resize-none`
- Rows: `rows={6}`
- MaxLength: `maxLength={500}`

**Contador**:
```
text-xs text-gray-400 mt-2 text-right
```

---

## 7. MODAL DE APROBACIÓN - CREDENCIALES

```
╔═════════════════════════════════════════════════════════════════╗
║  ✓ ¡Firma Aprobada!                  ✕                         ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Los datos de acceso se muestran a continuación. Cópialos y    ║
║  entrégalos manualmente al propietario.                        ║
║                                                                 ║
║  ⚠️ Importante: Estas credenciales se muestran una sola vez.   ║
║  Asegúrate de copiarlas antes de cerrar esta ventana.          ║
║                                                                 ║
║  Email (Usuario)                                               ║
║  ┌──────────────────────────────────┬──────────┐              ║
║  │ juan@abc.com                     │ [Copiar] │              ║
║  └──────────────────────────────────┴──────────┘              ║
║  ✓ Copiado                                                     ║
║                                                                 ║
║  Contraseña Temporal                                           ║
║  ┌──────────────────────────────────┬──────────┐              ║
║  │ abcd1234EfGhIjKlMn_-             │ [Copiar] │              ║
║  └──────────────────────────────────┴──────────┘              ║
║                                                                 ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ [Copiar Email y Contraseña]                             │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║  Nota: Contraseña temporal válida para primer acceso...       ║
║  El propietario deberá cambiarla al ingresar por primera vez. ║
║                                                                 ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ [Entendido, Cerrar]                                     │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                                 ║
╚═════════════════════════════════════════════════════════════════╝
```

### Header Modal Aprobación

```
┌─────────────────────────────────────┐
│ ✓ ¡Firma Aprobada!                  │
│ (color fondo: verde)                │
└─────────────────────────────────────┘
```

**Estilos**:
- Fondo: `bg-gradient-to-r from-green-900 to-green-800`
- Borde: `border-b border-green-700`
- Padding: `px-6 py-8`

**Mensaje**:
```
text-green-200 text-sm
```

### Campo de Credencial

```
┌──────────────────────────────────┬──────────┐
│ juan@abc.com                     │ [Copiar] │
└──────────────────────────────────┴──────────┘
```

**Input**:
- Flex: `flex-1`
- Fondo: `bg-gray-800`
- Borde: `border border-gray-700`
- Padding: `px-4 py-3`
- Redondeado: `rounded-lg`
- Texto: `text-white font-mono text-sm`
- ReadOnly: `readOnly`

**Botón Copiar**:
- Padding: `p-3`
- Redondeado: `rounded-lg`
- Default: `bg-gray-700 hover:bg-gray-600`
- Copiado: `bg-green-600 text-white`
- Transition: `transition-colors`

### Botón Copiar Ambas

```
┌─────────────────────────────────────────┐
│ Copiar Email y Contraseña              │
└─────────────────────────────────────────┘
```

**Estilos**:
- Width: `w-full`
- Fondo default: `bg-blue-600 hover:bg-blue-700`
- Fondo copiado: `bg-green-600`
- Padding: `px-4 py-3`

### Alerta Importante

```
┌───────────────────────────────────────────┐
│ ⚠️ Importante: Estas credenciales...     │
└───────────────────────────────────────────┘
```

**Estilos**:
- Fondo: `bg-yellow-900/30`
- Borde: `border border-yellow-700/50`
- Padding: `p-4`
- Redondeado: `rounded-lg`
- Texto: `text-yellow-200 text-sm`

---

## 8. ESTADO VACÍO - SIN SOLICITUDES

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║                    ✓                                   ║
║            (icono grande, verde)                       ║
║                                                        ║
║   No hay solicitudes pendientes                        ║
║                                                        ║
║   Todas las solicitudes han sido procesadas            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

**Estilos**:
- Container: `text-center py-16 bg-gray-800/30 rounded-lg`
- Icono: `w-16 h-16 text-green-500 mx-auto mb-4`
- Título: `text-gray-300 text-lg font-semibold`
- Subtítulo: `text-gray-400 text-sm mt-2`

---

## 9. ESTADO VACÍO - SIN RESULTADOS EN FILTROS

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║                    !                                   ║
║            (icono grande, gris)                        ║
║                                                        ║
║   No hay solicitudes que coincidan con los filtros     ║
║                                                        ║
║   Intenta ajustar los criterios de búsqueda            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

**Similar al anterior pero**:
- Icono: `AlertCircle w-16 h-16 text-gray-600`

---

## 10. ESTADO DE CARGA

```
┌──────────────────────────┐
│        ⟳ (spinner)       │
│  Cargando solicitudes... │
└──────────────────────────┘
```

**Estilos**:
- Centrado: `flex items-center justify-center py-20`
- Spinner: `Loader2 w-12 h-12 animate-spin text-blue-500`
- Texto: `text-gray-400`

---

## Paleta de Colores

```
┌─────────────────────────────────────────────────────┐
│ PRIMARY (Pendientes)      │ #EAB308 (amarillo)      │
│ SUCCESS (Aprobadas)       │ #10B981 (verde)         │
│ DANGER (Rechazadas)       │ #EF4444 (rojo)          │
│ INFO (Total)              │ #3B82F6 (azul)          │
│ SECONDARY (Trials)        │ #A855F7 (púrpura)       │
│                           │                         │
│ DARK BG                   │ #0F172A                 │
│ CARD BG                   │ #1E293B                 │
│ LIGHTER BG                │ #374151                 │
│ BORDER                    │ #4B5563 (30% opacity)  │
│ TEXT PRIMARY              │ #FFFFFF                 │
│ TEXT SECONDARY            │ #9CA3AF                 │
└─────────────────────────────────────────────────────┘
```

---

## Iconografía (Lucide React)

```
📄 FileText      - Pendientes
✓  Check         - Aprobadas
✕  X             - Rechazadas
🏢 Building2     - Total
📈 TrendingUp    - Trials Activos
👁  Eye          - Ver Detalles
🔍 Search        - Búsqueda
⬇️ Filter        - Filtros
📋 FileText      - Información
📅 Calendar      - Registro
📍 MapPin        - País
✉️ Mail          - Email
☎️ Phone         - Teléfono
🏭 Building2     - Firma
📋 FileText      - Detalles
✓  CheckCircle   - Estado exitoso
⚠️ AlertCircle   - Advertencia
⟳ Loader2        - Carga
```

---

## Tipografía

```
Familia: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif

Tamaños:
- Título principal: 2.25rem (36px) → font-bold
- Título sección: 1.125rem (18px) → font-semibold
- Label: 0.875rem (14px) → font-normal
- Valor: 1rem (16px) → font-medium
- Pequeño: 0.75rem (12px) → font-normal
- Contador: 0.75rem (12px) → text-gray-400
```

---

## Animaciones

```
Hover (tarjetas):
- border-color: cambio a color más claro
- transition: transition-colors duration-200

Buttons:
- click: opacity 0.8
- hover: color más oscuro
- spinner: animate-spin (infinite)

Modal:
- entrada: fade-in + slide-down
- salida: fade-out

Copiar:
- click: cambio de color a verde
- después 2s: vuelve a color original
```

---

## Responsive Breakpoints

```
Mobile (< 640px):
- Grid de tarjetas: 1 columna
- Filtros: 1 columna
- Modal: w-full, max-h-[90vh]
- Tabla: scrolleable horizontalmente
- Botones: min 44px (touchable)

Tablet (640px - 1024px):
- Grid de tarjetas: 2-3 columnas
- Filtros: 2 columnas
- Modal: max-w-lg
- Tabla: scrolleable

Desktop (> 1024px):
- Grid de tarjetas: 5 columnas
- Filtros: 4 columnas
- Modal: max-w-3xl
- Tabla: sin scroll
```

---

## Validaciones Visuales

**Campo búsqueda**:
- Focus: `border-blue-500`

**Textarea motivo**:
- Focus: `border-blue-500`
- Si < 5 chars: Botón "Confirmar" deshabilitado (opacity-50)
- Si > 500 chars: No acepta más caracteres
- Contador: actualiza en tiempo real

**Botón Copiar**:
- Click: Cambio de color + "✓ Copiado"
- Después 2s: Vuelve al estado original

**Botón APROBAR/RECHAZAR**:
- Click: Spinner + texto "Aprobando..." / "Rechazando..."
- Deshabilitado: `disabled:opacity-50 disabled:cursor-not-allowed`

---

## Accessibility

```
✅ Botones: min 44px
✅ Contraste: WCAG AA
✅ Alt text en iconos (via título)
✅ Focus visible en inputs
✅ Labels asociados
✅ ARIA roles en modales
✅ Keyboard navigation
✅ Pantalla de carga indica estado
✅ Errores con color + texto
✅ Fechas en formato local (es-CO)
```

---

## Performance

```
✅ Tabla con scroll en mobile
✅ Carga lazy (estadísticas + datos por separado)
✅ Estados de carga con spinners
✅ Errores mostrados sin recargar
✅ Debounce en búsqueda (500ms)
✅ Copiar al clipboard sin reload
✅ Modales sin scroll excesivo (max-h-[90vh])
✅ Grid responsive sin reflows
```
