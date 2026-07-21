# INVENTARIO COMPLETO A.F.I.
## Certificación Técnica - Fase 1: Inventario

---

## 📋 INFORMACIÓN GENERAL

**Componente:** A.F.I. (Auditor Funcional Inteligente)  
**Versión:** 1.0.0  
**Fecha de Certificación:** 18 de Julio de 2026  
**Laboratorio:** Certificación Independiente de Software  
**Estado:** En Proceso de Certificación

---

## 1. COMPONENTES DEL SISTEMA

### 1.1 Componentes Principales

| Componente | Archivo | Líneas | Descripción |
|------------|---------|--------|-------------|
| **Motor Principal** | `scripts/afi/core/AFIEngine.js` | 450 | Orquesta toda la auditoría |
| **Navegador Autónomo** | `scripts/afi/core/NavegadorAutonomo.js` | 380 | Descubre y navega rutas |
| **Interactor Universal** | `scripts/afi/core/InteractorUniversal.js` | 420 | Interactúa con UI |
| **Validador Comportamiento** | `scripts/afi/core/ValidadorComportamiento.js` | 350 | Detecta errores |
| **Motor Evidencia** | `scripts/afi/evidence/MotorEvidencia.js` | 280 | Captura evidencia |
| **Reporter HTML** | `scripts/afi/reporters/HTMLReporter.js` | 320 | Genera reportes |

**Total:** 6 componentes principales  
**Total líneas de código:** ~2,200 líneas

---

## 2. MÓDULOS DEL SISTEMA

### 2.1 Estructura Modular

```
scripts/afi/
├── core/                    # Núcleo del sistema
│   ├── AFIEngine.js         # Motor principal
│   ├── NavegadorAutonomo.js # Navegación
│   ├── InteractorUniversal.js # Interacciones
│   └── ValidadorComportamiento.js # Validaciones
├── evidence/                # Sistema de evidencia
│   └── MotorEvidencia.js    # Captura multimedia
├── reporters/               # Generación de reportes
│   └── HTMLReporter.js      # Reportes HTML/JSON
└── package.json             # Dependencias
```

### 2.2 Dependencias

| Dependencia | Versión | Propósito |
|-------------|---------|-----------|
| **playwright** | ^1.40.0 | Control de navegador automatizado |

**Dependencias nativas Node.js:**
- `fs.promises` - Manejo de archivos
- `path` - Rutas de sistema
- `console` - Logging

---

## 3. ARCHIVOS DEL SISTEMA

### 3.1 Archivos de Código Fuente

| Archivo | Tipo | Tamaño | Descripción |
|---------|------|--------|-------------|
| `core/AFIEngine.js` | JavaScript | 12 KB | Motor principal |
| `core/NavegadorAutonomo.js` | JavaScript | 10 KB | Navegación autónoma |
| `core/InteractorUniversal.js` | JavaScript | 11 KB | Interacciones UI |
| `core/ValidadorComportamiento.js` | JavaScript | 9 KB | Validaciones |
| `evidence/MotorEvidencia.js` | JavaScript | 8 KB | Sistema de evidencia |
| `reporters/HTMLReporter.js` | JavaScript | 10 KB | Generador de reportes |
| `package.json` | JSON | 1 KB | Configuración |
| **Total** | - | **61 KB** | **7 archivos** |

### 3.2 Archivos de Documentación

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `README.md` | Markdown | Documentación de uso |
| `docs/AUDITOR_FUNCIONAL_INTELIGENTE_AFI.md` | Markdown | Diseño arquitectónico |
| `docs/IMPLEMENTACION_AFI_COMPLETA.md` | Markdown | Resumen de implementación |

---

## 4. MOTORES INTERNOS

### 4.1 Motor de Navegación (NavegadorAutonomo)

**Capacidades:**
- ✅ Descubrimiento de rutas desde sidebar
- ✅ Descubrimiento de rutas desde contenido principal
- ✅ Detección de módulos por palabras clave
- ✅ Navegación BFS (Breadth-First Search)
- ✅ Deduplicación de rutas
- ✅ Validación de errores HTTP 404/500

**Algoritmos:**
- BFS para recorrido de grafo de rutas
- Detección de módulos por keywords
- Normalización de rutas

### 4.2 Motor de Interacción (InteractorUniversal)

**Capacidades:**
- ✅ Prueba de botones con validación de efecto
- ✅ Llenado automático de formularios
- ✅ Validación de envío vacío
- ✅ Prueba de tablas (ordenamiento, paginación, búsqueda)
- ✅ Apertura y cierre de modales
- ✅ Generación contextual de datos de prueba
- ✅ Detección de cambios de estado

**Estrategias:**
- Captura de estado antes/después
- Detección de cambios visuales
- Validación de efectos (navegación, modal, toast)

### 4.3 Motor de Validación (ValidadorComportamiento)

**Capacidades:**
- ✅ Detección de pantallas en blanco
- ✅ Detección de elementos superpuestos
- ✅ Detección de texto cortado
- ✅ Detección de overflow horizontal
- ✅ Detección de spinners eternos
- ✅ Detección de modales congelados
- ✅ Captura de errores de consola
- ✅ Captura de errores de network
- ✅ Validación de tiempo de carga
- ✅ Validación de responsive
- ✅ Validación de navegación con teclado
- ✅ Validación de accesibilidad básica

**Técnicas:**
- JavaScript injection para análisis DOM
- Evaluación de estilos CSS
- Análisis de rendimiento (Performance API)
- Detección de eventos de consola

### 4.4 Motor de Evidencia (MotorEvidencia)

**Capacidades:**
- ✅ Captura de screenshots automática
- ✅ Grabación de video completa (Playwright)
- ✅ Logs de consola estructurados
- ✅ Logs de network (requests/responses)
- ✅ Metadata de eventos
- ✅ Organización en directorios

**Formatos:**
- Imágenes: PNG (full page)
- Video: WebM (codec H.264)
- Logs: JSON
- Reportes: HTML, JSON

---

## 5. REPORTES QUE GENERA

### 5.1 Reporte HTML

**Nombre:** `evidencia/reporte/auditoria-afi.html`  
**Contenido:**
- Metadata de la auditoría (fecha, duración, cobertura)
- Métricas de cobertura (rutas, botones, formularios, tablas)
- Hallazgos por severidad (P0-P4)
- Detalle de cada hallazgo con:
  - ID, tipo, severidad
  - Ruta, módulo, componente
  - Acción realizada
  - Resultado esperado vs obtenido
  - Evidencia (screenshots, logs)
- Sección de evidencia completa

**Características:**
- Diseño responsive con CSS moderno
- Colores por severidad
- Interactivo (scroll, links)
- Profesional y ejecutivo

### 5.2 Reporte JSON

**Nombre:** `evidencia/reporte/auditoria-afi.json`  
**Estructura:**
```json
{
  "metadata": {
    "fecha": "ISO timestamp",
    "duracionMinutos": float,
    "urlBase": string,
    "navegador": string,
    "headless": boolean
  },
  "metricas": {
    "rutasDescubiertas": int,
    "rutasProbadas": int,
    "cobertura": string,
    "totalBotones": int,
    "botonesProbados": int,
    "totalFormularios": int,
    "formulariosProbados": int,
    "totalTablas": int,
    "tablasProbadas": int
  },
  "hallazgos": [...],
  "resumen": {
    "P0": {"cantidad": int, "descripcion": string},
    "P1": {...},
    "P2": {...},
    "P3": {...},
    "P4": {...}
  },
  "evidencia": {
    "video": string,
    "screenshots": string,
    "logs": string,
    "network": string
  }
}
```

---

## 6. EVIDENCIA QUE GENERA

### 6.1 Tipos de Evidencia

| Tipo | Formato | Cantidad | Descripción |
|------|---------|----------|-------------|
| **Screenshots** | PNG | Variables | Capturas de cada paso |
| **Video** | WebM | 1 por sesión | Grabación completa |
| **Logs Consola** | JSON | Variables | Errores y warnings |
| **Logs Network** | JSON | Variables | Requests y responses |
| **Metadata** | JSON | Variables | Eventos importantes |

### 6.2 Organización de Archivos

```
evidencia/
├── capturas/                    # Screenshots
│   ├── 001_login-inicial_TIMESTAMP.png
│   ├── 002_boton-antes_TIMESTAMP.png
│   └── ...
├── logs/                        # Logs de consola
│   ├── evento-FASE_1_LOGIN_TIMESTAMP.json
│   ├── consola-final_TIMESTAMP.json
│   └── ...
├── network/                     # Logs de red
│   ├── error-network_TIMESTAMP.json
│   ├── network-final_TIMESTAMP.json
│   └── ...
├── video/                       # Video de sesión
│   └── sesion.webm
└── reporte/                     # Reportes
    ├── auditoria-afi.html
    └── auditoria-afi.json
```

---

## 7. LIMITACIONES DOCUMENTADAS

### 7.1 Limitaciones Técnicas

| Limitación | Impacto | Prioridad | Descripción |
|-------------|---------|-----------|-------------|
| **2FA** | P1 | Alta | Requiere token de prueba en staging |
| **CAPTCHA** | P1 | Alta | No se puede automatizar |
| **Upload de archivos** | P2 | Media | Requiere archivos de prueba preparados |
| **Firma digital** | P2 | Media | Requiere certificado de prueba |
| **Email** | P3 | Baja | No se puede validar automáticamente |

### 7.2 Limitaciones de Cobertura

| Limitación | Impacto | Prioridad | Descripción |
|-------------|---------|-----------|-------------|
| **Profundidad de rutas** | P2 | Media | Máximo 3 niveles de profundidad |
| **Selectores dinámicos** | P2 | Media | Requiere inspección manual en algunos casos |
| **Validaciones complejas** | P3 | Baja | Validaciones business-specific requieren código custom |
| **Gráficos/Charts** | P3 | Baja | No valida contenido de gráficos |

### 7.3 Limitaciones de Rendimiento

| Limitación | Impacto | Prioridad | Descripción |
|-------------|---------|-----------|-------------|
| **Tiempo de ejecución** | P2 | Media | 30-60 minutos para auditoría completa |
| **Consumo de memoria** | P3 | Baja | ~500MB-1GB durante ejecución |
| **CPU** | P3 | Baja | Alto durante grabación de video |

---

## 8. CONFIGURACIÓN

### 8.1 Variables de Entorno

| Variable | Tipo | Default | Descripción |
|----------|------|---------|-------------|
| `BASE_URL` | string | `http://localhost:3000` | URL base del sistema |
| `ADMIN_PATH` | string | `/admin` | Ruta del dashboard admin |
| `HEADLESS` | boolean | `false` | Modo sin navegador visible |
| `RECORD_VIDEO` | boolean | `true` | Grabar video de sesión |
| `SCREENSHOT_ON_ERROR` | boolean | `true` | Capturar screenshot en errores |
| `TIMEOUT` | number | `30000` | Timeout de navegación (ms) |
| `SLOW_MO` | number | `500` | Delay entre acciones (ms) |

### 8.2 Credenciales de Prueba

**Ubicación:** `scripts/afi/core/AFIEngine.js` (línea 180-185)  
**Valores hardcodeados:**
- Email: `admin@test.com`
- Password: `password123`

**Recomendación:** Mover a variables de entorno

---

## 9. ARQUITECTURA TÉCNICA

### 9.1 Patrones de Diseño

| Patrón | Uso | Implementación |
|--------|-----|----------------|
| **Singleton** | Motor de evidencia | Una instancia por auditoría |
| **Strategy** | Validaciones | Múltiples estrategias de detección |
| **Observer** | Captura de eventos | Eventos de consola y network |
| **Template Method** | Flujo de auditoría | Fases predefinidas |
| **Factory** | Generación de datos | Datos de prueba contextuales |

### 9.2 Flujo de Ejecución

```
1. AFIEngine.inicializar()
   ├─ Lanzar browser (Chromium)
   ├─ Crear contexto con video
   ├─ Inicializar componentes
   └─ Configurar interceptores

2. AFIEngine.ejecutarAuditoriaCompleta()
   ├─ faseLogin()
   ├─ faseDescubrimientoRutas()
   ├─ faseAuditoriaRutas()
   ├─ fasePruebasEspecificas()
   └─ faseGeneracionReporte()

3. Por cada ruta:
   ├─ Navegador.navegar()
   ├─ Capturar evidencia inicial
   ├─ Validador.detectarErroresVisuales()
   ├─ Validador.detectarErroresConsola()
   ├─ Validador.detectarErroresNetwork()
   ├─ probarBotonesEnRuta()
   ├─ probarFormulariosEnRuta()
   ├─ probarTablasEnRuta()
   └─ Capturar evidencia final

4. Finalizar
   ├─ Generar reporte HTML
   ├─ Generar reporte JSON
   ├─ Finalizar video
   └─ Cerrar browser
```

---

## 10. ESPECIFICACIONES TÉCNICAS

### 10.1 Requisitos del Sistema

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| **Node.js** | 18.0.0 | 20.x LTS |
| **RAM** | 4 GB | 8 GB |
| **CPU** | 2 cores | 4 cores |
| **Disco** | 1 GB libre | 5 GB libre |
| **OS** | Windows 10+, macOS 12+, Linux | Windows 11, macOS 14, Ubuntu 22.04 |

### 10.2 Navegadores Soportados

| Navegador | Soportado | Notas |
|-----------|-----------|-------|
| **Chromium** | ✅ Sí | Principal (recomendado) |
| **Chrome** | ✅ Sí | Compatible |
| **Firefox** | ⚠️ Parcial | Requiere ajustes |
| **Safari** | ❌ No | No soportado por Playwright |
| **Edge** | ✅ Sí | Compatible |

### 10.3 Timeouts y Delays

| Parámetro | Valor | Razón |
|-----------|-------|-------|
| **Timeout navegación** | 30s | Espera carga de página |
| **Delay entre acciones** | 500ms | Simular humano |
| **Espera post-clic** | 1000ms | Esperar efecto |
| **Espera spinners** | 3000ms | Detectar spinners eternos |
| **Timeout formularios** | 30s | Operaciones CRUD |

---

## 11. MÉTRICAS DE CALIDAD

### 11.1 Métricas de Código

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Líneas de código** | ~2,200 | ✅ Aceptable |
| **Complejidad ciclomática** | ~15 por función | ✅ Aceptable |
| **Cobertura de comentarios** | ~25% | ⚠️ Mejorable |
| **Funciones por módulo** | 8-12 | ✅ Aceptable |

### 11.2 Métricas de Arquitectura

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Acoplamiento** | Bajo | ✅ Bueno |
| **Cohesión** | Alta | ✅ Bueno |
| **Separación de responsabilidades** | Clara | ✅ Bueno |
| **Extensibilidad** | Alta | ✅ Bueno |

---

## 12. SEGURIDAD

### 12.1 Medidas Implementadas

| Medida | Estado | Descripción |
|--------|--------|-------------|
| **Credenciales hardcodeadas** | ⚠️ Advertencia | En código fuente |
| **Sin secrets en código** | ✅ Cumple | No hay API keys hardcodeadas |
| **Interceptores HTTPS** | ✅ Cumple | Captura todo el tráfico |
| **Aislamiento de contexto** | ✅ Cumple | Browser context separado |

### 12.2 Recomendaciones de Seguridad

1. Mover credenciales a variables de entorno
2. Implementar rotación de credenciales
3. No commitear archivos `.env` a git
4. Usar credenciales de prueba (no producción)

---

## 13. MANTENIBILIDAD

### 13.1 Puntos Fuertes

✅ Código modular y organizado  
✅ Separación clara de responsabilidades  
✅ Documentación inline  
✅ Nombres de variables descriptivos  
✅ Fácil de extender  

### 13.2 Puntos de Mejora

⚠️ Comentarios insuficientes en funciones complejas  
⚠️ Falta de tests unitarios  
⚠️ Manejo de errores básico  
⚠️ Sin logging estructurado  

---

## 14. CONCLUSIÓN DEL INVENTARIO

### Resumen Ejecutivo

El A.F.I. es un sistema **bien estructurado** con:

- **6 componentes principales** especializados
- **~2,200 líneas de código** organizadas en módulos
- **Arquitectura limpia** con separación de responsabilidades
- **Sistema de evidencia completo** (video, screenshots, logs)
- **Reportes profesionales** (HTML y JSON)
- **Limitaciones documentadas** y conocidas

### Estado: ✅ APROBADO EN INVENTARIO

El sistema está **completo** y **listo** para la fase de validación funcional.

---

**Documento generado:** 18 de Julio de 2026  
**Fase:** 1 de 10 - Inventario  
**Próxima fase:** Validación Funcional