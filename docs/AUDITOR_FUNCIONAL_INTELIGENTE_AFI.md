# AUDITOR FUNCIONAL INTELIGENTE (A.F.I.)
## Sistema de Certificación Automática para Dashboard Administrativo

---

## 📋 DEFINICIÓN

**A.F.I.** es un agente de QA Automation Engineer Senior que interactúa con el Dashboard Administrativo exactamente igual que lo haría un usuario humano real.

### Filosofía Central
```
NO analices el código → ANALIZA EL COMPORTAMIENTO
NO detectes patrones → INTERACTÚA CON EL SISTEMA
NO busques strings → NAVEGA COMO USUARIO
```

---

## 🎯 OBJETIVO

Certificar automáticamente que el Dashboard Administrativo está listo para producción mediante:

1. **Navegación autónoma** - Descubre y recorre todas las rutas
2. **Interacción real** - Clic, escribe, guarda, cancela, edita, elimina
3. **Validación funcional** - Prueba cada botón, formulario, tabla, filtro
4. **Detección de errores** - Captura errores de consola, network, visuales
5. **Generación de evidencia** - Video, capturas, logs, reportes

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────┐
│                    A.F.I. - CORE ENGINE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   NAVEGADOR  │  │  INTERACTOR  │  │  VALIDADOR   │      │
│  │  AUTÓNOMO    │  │   UNIVERSAL  │  │  COMPORTAM.  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼─────────────────▼─────────────────▼───────┐       │
│  │              MOTOR DE EVIDENCIA                   │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │       │
│  │  │  VIDEO   │  │CAPTURAS  │  │  LOGS    │       │       │
│  │  │RECORDER  │  │AUTO      │  │CONSOLA   │       │       │
│  │  └──────────┘  └──────────┘  └──────────┘       │       │
│  └──────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 STACK TECNOLÓGICO

### Navegación y Control
- **Playwright** o **Puppeteer** - Control de navegador headless
- **Chromium** - Motor de renderizado
- **Node.js** - Runtime

### Análisis y Validación
- **Playwright Inspector** - Selectores inteligentes
- **Custom Assertions** - Validaciones específicas de negocio
- **Network Interceptor** - Captura de requests/responses

### Evidencia
- **Playwright Video** - Grabación de sesión completa
- **Screenshots** - Capturas automáticas en eventos clave
- **Console Capture** - Logs de consola estructurados
- **HAR Files** - Registro completo de network

### Reportes
- **Allure Report** - Reportes interactivos
- **Custom HTML** - Reporte ejecutivo con evidencia
- **JSON Export** - Datos estructurados para análisis

---

## 🚀 CAPACIDADES DEL AUDITOR

### 1. NAVEGACIÓN AUTÓNOMA

```javascript
// Descubrimiento automático de rutas
class NavegadorAutonomo {
  async descubrirRutas() {
    // 1. Obtener ruta base /admin
    // 2. Extraer todos los links del sidebar
    // 3. Extraer todos los links del contenido
    // 4. Extraer todos los botones de navegación
    // 5. Construir grafo de rutas
    // 6. Ejecutar BFS/DFS para recorrer todas
  }
  
  async navegar(ruta) {
    // 1. Esperar a que la página cargue
    // 2. Verificar errores 404/500
    // 3. Verificar título de página
    // 4. Esperar a que los elementos estén visibles
    // 5. Capturar screenshot inicial
  }
}
```

### 2. INTERACTOR UNIVERSAL

```javascript
class InteractorUniversal {
  // BOTONES
  async probarBoton(selector) {
    // 1. Verificar que existe
    // 2. Verificar que está visible
    // 3. Verificar que está habilitado
    // 4. Capturar screenshot antes
    // 5. Hacer clic
    // 6. Esperar 500ms
    // 7. Capturar screenshot después
    // 8. Verificar cambio visual
    // 9. Verificar network request
    // 10. Verificar consola (sin errores)
    // 11. Retornar evidencia
  }
  
  // FORMULARIOS
  async probarFormulario(selector, datos) {
    // 1. Llenar cada campo
    // 2. Verificar validación en tiempo real
    // 3. Intentar enviar vacío
    // 4. Verificar mensajes de error
    // 5. Llenar con datos válidos
    // 6. Enviar formulario
    // 7. Verificar éxito
    // 8. Verificar persistencia
  }
  
  // TABLAS
  async probarTabla(selector) {
    // 1. Verificar carga inicial
    // 2. Probar paginación (si existe)
    // 3. Probar ordenamiento (si existe)
    // 4. Probar cada filtro
    // 5. Probar búsqueda
    // 6. Probar acciones de fila
    // 7. Probar exportación (si existe)
  }
  
  // MODALES
  async probarModal(selector) {
    // 1. Abrir modal
    // 2. Verificar visibilidad
    // 3. Probar botón cancelar
    // 4. Probar botón guardar
    // 5. Probar validaciones
    // 6. Cerrar con X
    // 7. Cerrar con Escape
    // 8. Verificar que no queda abierto
  }
}
```

### 3. VALIDADOR DE COMPORTAMIENTO

```javascript
class ValidadorComportamiento {
  // ERRORES VISUALES
  async detectarErroresVisuales() {
    // 1. Pantallas en blanco
    // 2. Elementos superpuestos
    // 3. Texto cortado
    // 4. Overflow horizontal
    // 5. Scroll roto
    // 6. Spinners eternos
    // 7. Modales congelados
  }
  
  // ERRORES DE CONSOLA
  async detectarErroresConsola() {
    // 1. console.error
    // 2. console.warn
    // 3. Unhandled Promise Rejection
    // 4. React Error Boundaries
    // 5. Hydration mismatches
    // 6. Stack traces
  }
  
  // ERRORES DE NETWORK
  async detectarErroresNetwork() {
    // 1. 404 Not Found
    // 2. 401 Unauthorized
    // 3. 403 Forbidden
    // 4. 500 Internal Server Error
    // 5. 502 Bad Gateway
    // 6. 503 Service Unavailable
    // 7. Timeouts
    // 8. Requests duplicados
  }
  
  // EXPERIENCIA DE USUARIO
  async validarUX() {
    // 1. Tiempo de carga < 3s
    // 2. Responsive en móvil/tablet/desktop
    // 3. Navegación con teclado
    // 4. Accesibilidad básica
    // 5. Estados de carga
    // 6. Mensajes de error amigables
  }
}
```

### 4. MOTOR DE EVIDENCIA

```javascript
class MotorEvidencia {
  constructor() {
    this.videoRecorder = new VideoRecorder();
    this.screenshotManager = new ScreenshotManager();
    this.consoleCapture = new ConsoleCapture();
    this.networkLogger = new NetworkLogger();
  }
  
  async iniciarGrabacion() {
    // Iniciar grabación de video
    // Iniciar captura de consola
    // Iniciar log de network
  }
  
  async capturarEvento(nombre, datos) {
    // Tomar screenshot
    // Guardar logs de consola
    // Guardar requests de network
    // Guardar estado actual
  }
  
  async finalizarGrabacion() {
    // Detener grabación de video
    // Generar reporte HAR
    // Exportar logs de consola
    // Generar reporte HTML
  }
}
```

---

## 📋 PLAN DE EJECUCIÓN

### Fase 1: Setup Inicial (30 min)

```javascript
// 1. Inicializar navegador
await browser.launch({
  headless: false, // Ver en tiempo real
  recordVideo: {
    dir: 'evidencia/video/'
  }
});

// 2. Configurar interceptores
await context.route('**/*', async (route) => {
  // Loggear todas las requests
  await networkLogger.log(route.request());
  await route.continue();
});

// 3. Configurar captura de consola
page.on('console', (msg) => {
  consoleCapture.add(msg);
});

// 4. Iniciar grabación de video
await videoRecorder.start();
```

### Fase 2: Login (5 min)

```javascript
// 1. Navegar a /login
await page.goto('/login');

// 2. Capturar screenshot inicial
await screenshot('login-inicial');

// 3. Llenar credenciales
await page.fill('[name="email"]', 'admin@test.com');
await page.fill('[name="password"]', 'password123');

// 4. Capturar screenshot con credenciales
await screenshot('login-credenciales');

// 5. Hacer clic en login
await page.click('button[type="submit"]');

// 6. Esperar navegación
await page.waitForURL('/admin');

// 7. Verificar login exitoso
await expect(page.locator('h1')).toContainText('Dashboard');

// 8. Capturar screenshot post-login
await screenshot('login-exitoso');
```

### Fase 3: Descubrimiento de Rutas (10 min)

```javascript
// 1. Obtener sidebar
const sidebar = await page.locator('nav, aside, [role="navigation"]');

// 2. Extraer todos los links
const links = await sidebar.locator('a').all();

// 3. Para cada link
for (const link of links) {
  const href = await link.getAttribute('href');
  const texto = await link.textContent();
  
  // Agregar a cola de navegación
  colaNavegacion.push({
    ruta: href,
    nombre: texto,
    probado: false
  });
}

// 4. También buscar en contenido principal
const contenido = await page.locator('main, .content, #content');
const linksContenido = await contenido.locator('a').all();
// ... mismo proceso

// 5. Ejecutar BFS
while (colaNavegacion.length > 0) {
  const siguiente = colaNavegacion.shift();
  await this.navegarYProbar(siguiente);
}
```

### Fase 4: Prueba de Cada Ruta (5-10 min por ruta)

```javascript
async navegarYProbar(ruta) {
  console.log(`🧪 Probando: ${ruta.nombre} (${ruta.ruta})`);
  
  try {
    // 1. NAVEGAR
    await page.goto(ruta.ruta);
    await page.waitForLoadState('networkidle');
    
    // 2. CAPTURAR EVIDENCIA INICIAL
    await screenshot(`${ruta.nombre}-inicial`);
    
    // 3. VERIFICAR ERRORES VISUALES
    const erroresVisuales = await validador.detectarErroresVisuales();
    if (erroresVisuales.length > 0) {
      await this.reportarHallazgo({
        tipo: 'ERROR VISUAL',
        ruta: ruta.ruta,
        detalles: erroresVisuales
      });
    }
    
    // 4. VERIFICAR ERRORES DE CONSOLA
    const erroresConsola = consoleCapture.getErrores();
    if (erroresConsola.length > 0) {
      await this.reportarHallazgo({
        tipo: 'ERROR CONSOLA',
        ruta: ruta.ruta,
        detalles: erroresConsola
      });
    }
    
    // 5. VERIFICAR ERRORES DE NETWORK
    const erroresNetwork = networkLogger.getErrores();
    if (erroresNetwork.length > 0) {
      await this.reportarHallazgo({
        tipo: 'ERROR NETWORK',
        ruta: ruta.ruta,
        detalles: erroresNetwork
      });
    }
    
    // 6. PROBAR BOTONES
    const botones = await page.locator('button, [role="button"]').all();
    for (const boton of botones) {
      await interactor.probarBoton(boton);
    }
    
    // 7. PROBAR FORMULARIOS
    const formularios = await page.locator('form').all();
    for (const form of formularios) {
      await interactor.probarFormulario(form, datosPrueba);
    }
    
    // 8. PROBAR TABLAS
    const tablas = await page.locator('table, [role="table"]').all();
    for (const tabla of tablas) {
      await interactor.probarTabla(tabla);
    }
    
    // 9. PROBAR MODALES
    // ... (si hay botones que abren modales)
    
    // 10. CAPTURAR EVIDENCIA FINAL
    await screenshot(`${ruta.nombre}-final`);
    
  } catch (error) {
    // CAPTURAR ERROR
    await screenshot(`${ruta.nombre}-error`);
    await this.reportarHallazgo({
      tipo: 'ERROR NAVEGACIÓN',
      ruta: ruta.ruta,
      error: error.message
    });
  }
}
```

### Fase 5: Pruebas Específicas por Módulo

```javascript
// DASHBOARD
await probarDashboard() {
  // - Verificar KPIs cargados
  // - Verificar gráficos
  // - Verificar filtros de fecha
  // - Verificar actualización automática
}

// USUARIOS
await probarUsuarios() {
  // - Verificar lista de usuarios
  // - Probar búsqueda
  // - Probar filtros
  // - Probar crear usuario
  // - Probar editar usuario
  // - Probar eliminar usuario
  // - Probar asignación de roles
}

// EMPRESAS
await probarEmpresas() {
  // - Verificar lista de empresas
  // - Probar aprobación
  // - Probar rechazo
  // - Probar ver detalles
}

// FACTURACIÓN
await probarFacturacion() {
  // - Verificar transacciones
  // - Probar filtros de fecha
  // - Probar exportación
  // - Verificar integración Mercado Pago
}

// CONFIGURACIÓN
await probarConfiguracion() {
  // - Probar cada setting
  // - Verificar persistencia
  // - Verificar validaciones
}
```

### Fase 6: Generación de Reporte (10 min)

```javascript
async generarReporte() {
  const reporte = {
    metadata: {
      fecha: new Date(),
      duracion: await calcularDuracion(),
      rutasProbadas: rutasProbadas.length,
      totalBotones: totalBotones,
      totalFormularios: totalFormularios,
      totalTablas: totalTablas
    },
    metricas: {
      cobertura: `${(rutasProbadas / totalRutas) * 100}%`,
      erroresCriticos: hallazgos.filter(h => h.severidad === 'P0').length,
      erroresAltos: hallazgos.filter(h => h.severidad === 'P1').length,
      erroresMedios: hallazgos.filter(h => h.severidad === 'P2').length,
      erroresBajos: hallazgos.filter(h => h.severidad === 'P3').length
    },
    hallazgos: hallazgos,
    evidencia: {
      video: 'evidencia/video/sesion.webm',
      screenshots: 'evidencia/capturas/',
      logs: 'evidencia/logs/',
      network: 'evidencia/network/'
    }
  };
  
  // Generar HTML
  await generarHTML(reporte);
  
  // Generar JSON
  await generarJSON(reporte);
  
  // Generar video resumen
  await generarVideoResumen();
}
```

---

## 📊 FORMATO DE HALLAZGOS

Cada hallazgo debe incluir:

```json
{
  "id": "HALL-001",
  "fecha": "2026-07-18T18:30:00Z",
  "ruta": "/admin/users",
  "modulo": "Usuarios",
  "componente": "UserTable",
  "tipo": "BOTÓN SIN FUNCIÓN",
  "severidad": "P1",
  "accion": "CLICK",
  "selector": "button[data-testid='export-users']",
  "resultado_esperado": "Descargar archivo CSV con usuarios",
  "resultado_obtenido": "No ocurrió ninguna acción",
  "evidencia": {
    "screenshot_antes": "evidencia/HALL-001-antes.png",
    "screenshot_despues": "evidencia/HALL-001-despues.png",
    "video_timestamp": "00:05:23",
    "consola": [],
    "network": []
  },
  "archivo_probable": "frontend/src/modules/admin/pages/Users.jsx",
  "hipotesis": "El botón tiene onClick pero la función está vacía",
  "recomendacion": "Implementar lógica de exportación en el manejador onClick"
}
```

---

## 🎬 GRABACIÓN DE VIDEO

### Configuración

```javascript
const videoConfig = {
  dir: 'evidencia/video/',
  size: { width: 1920, height: 1080 },
  fps: 30,
  codec: 'h264'
};
```

### Timeline del Video

```
00:00 - Inicio de sesión
00:05 - Login exitoso
00:12 - Dashboard cargado
00:35 - Navegación a Usuarios
01:10 - Prueba de crear usuario
01:42 - Error detectado (HALL-001)
02:00 - Navegación a Empresas
02:30 - Prueba de aprobación
...
```

---

## 🎯 CRITERIOS DE ÉXITO

### Mínimo Aceptable
- [ ] Cobertura de rutas: 100%
- [ ] Cobertura de botones: 100%
- [ ] Cobertura de formularios: 100%
- [ ] Errores P0: 0
- [ ] Errores P1: < 5
- [ ] Falsos positivos: < 5%

### Objetivo Ideal
- [ ] Cobertura de rutas: 100%
- [ ] Cobertura de botones: 100%
- [ ] Cobertura de formularios: 100%
- [ ] Errores P0: 0
- [ ] Errores P1: 0
- [ ] Errores P2: < 10
- [ ] Falsos positivos: 0%

---

## 🛠️ IMPLEMENTACIÓN

### Estructura de Archivos

```
scripts/
├── afi/
│   ├── core/
│   │   ├── AFIEngine.js          # Motor principal
│   │   ├── NavegadorAutonomo.js  # Navegación automática
│   │   ├── InteractorUniversal.js # Interacciones
│   │   └── ValidadorComportamiento.js # Validaciones
│   ├── evidence/
│   │   ├── VideoRecorder.js      # Grabación de video
│   │   ├── ScreenshotManager.js  # Capturas de pantalla
│   │   ├── ConsoleCapture.js     # Logs de consola
│   │   └── NetworkLogger.js      # Logs de network
│   ├── reporters/
│   │   ├── HTMLReporter.js       # Reporte HTML
│   │   ├── JSONReporter.js       # Reporte JSON
│   │   └── VideoResumen.js       # Video resumen
│   └── config/
│       ├── rutas.js              # Configuración de rutas
│       ├── datosPrueba.js        # Datos de prueba
│       └── timeouts.js           # Timeouts y delays
```

### Ejecución

```bash
# Instalar dependencias
npm install -g playwright
npm install puppeteer

# Ejecutar auditoría completa
node scripts/afi/core/AFIEngine.js

# Ejecutar módulo específico
node scripts/afi/core/AFIEngine.js --modulo=usuarios

# Generar solo reporte
node scripts/afi/reporters/HTMLReporter.js
```

---

## 📝 NOTAS TÉCNICAS

### Limitaciones Conocidas

1. **Autenticación 2FA** - Requiere intervención manual o token hardcodeado
2. **CAPTCHA** - No se puede automatizar, requiere servicio externo
3. **Upload de archivos** - Requiere archivos de prueba preparados
4. **Firma digital** - Requiere certificado de prueba
5. **Email** - No se puede validar automáticamente (requiere API de email)

### Estrategias de Mitigación

1. **2FA:** Usar token de prueba en ambiente de staging
2. **CAPTCHA:** Deshabilitar en ambiente de testing
3. **Uploads:** Preparar archivos de prueba en `/test-files/`
4. **Firma:** Usar certificado de prueba
5. **Email:** Implementar mailhog o similar para testing

---

## 🚀 ROADMAP

### Versión 1.0 (Actual)
- [x] Diseño arquitectónico
- [ ] Navegación básica
- [ ] Detección de botones
- [ ] Captura de errores básica

### Versión 2.0
- [ ] Formularios inteligentes
- [ ] Tablas con paginación
- [ ] Modales automáticos
- [ ] Video recording

### Versión 3.0
- [ ] IA para detección de anomalías visuales
- [ ] Auto-reparación de selectores
- [ ] Pruebas de carga integradas
- [ ] Integración CI/CD

---

## 📚 REFERENCIAS

- **Playwright:** https://playwright.dev/
- **Puppeteer:** https://pptr.dev/
- **Allure Report:** https://docs.qameta.io/allure/
- **Testing Library:** https://testing-library.com/

---

**Documento creado:** 18 de Julio de 2026  
**Autor:** Sistema de Diseño AFI  
**Estado:** Diseño completo, pendiente implementación