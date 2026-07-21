# A.F.I. - Auditor Funcional Inteligente

## 🎯 ¿Qué es A.F.I.?

**A.F.I.** es un sistema de **QA Automation Engineer Senior** que interactúa con el Dashboard Administrativo exactamente igual que lo haría un usuario humano real.

### Filosofía
```
NO analices el código → ANALIZA EL COMPORTAMIENTO
NO detectes patrones → INTERACTÚA CON EL SISTEMA
NO busques strings → NAVEGA COMO USUARIO
```

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
cd scripts/afi
npm install
npx playwright install chromium
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en `scripts/afi/.env`:

```env
BASE_URL=http://localhost:3000
ADMIN_PATH=/admin
HEADLESS=false
RECORD_VIDEO=true
SCREENSHOT_ON_ERROR=true
TIMEOUT=30000
SLOW_MO=500
```

### 3. Ejecutar Auditoría

```bash
# Auditoría completa (con navegador visible)
npm run audit

# Auditoría en modo headless (sin navegador visible)
npm run audit:headless

# Auditoría de módulo específico
npm run audit:module -- --modulo=usuarios
```

### 4. Ver Reporte

```bash
# Abrir reporte HTML
open evidencia/reporte/auditoria-afi.html

# O en Windows
start evidencia/reporte/auditoria-afi.html
```

---

## 📋 Requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Playwright** (se instala automáticamente)
- **Chromium** (se instala automáticamente)

---

## 🏗️ Arquitectura

```
scripts/afi/
├── core/
│   ├── AFIEngine.js           # Motor principal
│   ├── NavegadorAutonomo.js   # Navegación automática
│   ├── InteractorUniversal.js # Interacciones
│   └── ValidadorComportamiento.js # Validaciones
├── evidence/
│   └── MotorEvidencia.js      # Captura de evidencia
├── reporters/
│   └── HTMLReporter.js        # Generación de reportes
├── package.json
└── README.md
```

---

## 🎬 Flujo de Ejecución

### Fase 1: Inicialización
- Lanzar navegador Chromium
- Configurar interceptores de red
- Configurar captura de consola
- Iniciar grabación de video

### Fase 2: Login
- Navegar a `/login`
- Llenar credenciales
- Validar acceso al Dashboard

### Fase 3: Descubrimiento de Rutas
- Analizar sidebar de navegación
- Analizar contenido principal
- Extraer todas las rutas disponibles
- Construir grafo de navegación

### Fase 4: Auditoría de Rutas
Para cada ruta descubierta:
- Navegar a la ruta
- Capturar screenshot inicial
- Detectar errores visuales
- Detectar errores de consola
- Detectar errores de network
- Probar todos los botones
- Probar todos los formularios
- Probar todas las tablas
- Capturar screenshot final

### Fase 5: Generación de Reporte
- Calcular métricas
- Generar reporte HTML
- Generar reporte JSON
- Finalizar grabación de video

---

## 📊 Métricas que Genera

### Cobertura
- Rutas descubiertas
- Rutas probadas
- Porcentaje de cobertura
- Botones totales vs probados
- Formularios totales vs probados
- Tablas totales vs probadas

### Hallazgos
- P0: Impide producción
- P1: Error crítico
- P2: Error funcional
- P3: Error visual
- P4: Mejora

### Evidencia
- Video completo de la sesión
- Screenshots de cada paso
- Logs de consola
- Logs de network (HAR)
- Reporte HTML interactivo
- Reporte JSON estructurado

---

## 🔧 Configuración Avanzada

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `BASE_URL` | URL base del sistema | `http://localhost:3000` |
| `ADMIN_PATH` | Ruta del dashboard admin | `/admin` |
| `HEADLESS` | Modo sin navegador visible | `false` |
| `RECORD_VIDEO` | Grabar video de la sesión | `true` |
| `SCREENSHOT_ON_ERROR` | Capturar screenshot en errores | `true` |
| `TIMEOUT` | Timeout de navegación (ms) | `30000` |
| `SLOW_MO` | Delay entre acciones (ms) | `500` |

### Credenciales de Prueba

Editar en `AFIEngine.js`:

```javascript
// Fase 1: Login
await this.interactor.llenarCampo('input[name="email"]', 'admin@test.com');
await this.interactor.llenarCampo('input[name="password"]', 'password123');
```

---

## 📝 Ejemplo de Uso

### Ejecución Básica

```bash
cd scripts/afi
npm install
npm run audit
```

### Ejecución en CI/CD

```bash
# Modo headless para CI/CD
npm run audit:headless

# El reporte se genera en evidencia/reporte/auditoria-afi.html
```

### Ejecución de Módulo Específico

```bash
npm run audit:module -- --modulo=usuarios
```

---

## 🐛 Troubleshooting

### Error: "No se pudo lanzar el navegador"

```bash
# Instalar Chromium
npx playwright install chromium

# En Linux, instalar dependencias
npx playwright install-deps
```

### Error: "Timeout al navegar"

Aumentar el timeout en `.env`:

```env
TIMEOUT=60000
```

### Error: "Login fallido"

Verificar credenciales en `AFIEngine.js` o usar variables de entorno.

---

## 📈 Interpretación de Resultados

### Cobertura

- **100%**: Todas las rutas descubiertas fueron probadas
- **>80%**: Cobertura aceptable
- **<80%**: Requiere revisión

### Hallazgos

- **P0**: Bloquea producción inmediatamente
- **P1**: Debe corregirse antes de producción
- **P2**: Debe corregirse en el siguiente sprint
- **P3**: Mejora recomendada
- **P4**: Mejora opcional

### Criterios de Éxito

✅ **Aprobado para Producción:**
- Cobertura: 100%
- Errores P0: 0
- Errores P1: 0
- Errores P2: < 10

❌ **No Aprobado:**
- Cobertura: < 80%
- Errores P0: > 0
- Errores P1: > 5

---

## 🛠️ Personalización

### Agregar Nuevas Reglas de Validación

Editar `ValidadorComportamiento.js`:

```javascript
async detectarErroresVisuales() {
  const errores = [];
  
  // Tu regla personalizada
  const miValidacion = await this.miValidacionPersonalizada();
  if (miValidacion) {
    errores.push({
      tipo: 'MI_VALIDACION',
      severidad: 'P2',
      descripcion: 'Descripción del error'
    });
  }
  
  return errores;
}
```

### Agregar Nuevas Pruebas de Interacción

Editar `InteractorUniversal.js`:

```javascript
async probarMiComponente(selector) {
  // Tu lógica de prueba
  await this.page.locator(selector).click();
  // Validar resultado
}
```

---

## 📚 Documentación Adicional

- [Documentación de Playwright](https://playwright.dev/)
- [Guía de Testing](https://playwright.dev/docs/intro)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

---

## 🤝 Contribuir

Para mejorar A.F.I.:

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

## 📄 Licencia

MIT © Punto Cero Legal

---

## 📞 Soporte

Para reportar bugs o solicitar features, contactar al equipo de desarrollo.

---

**Generado por:** A.F.I. v1.0.0  
**Fecha:** 18 de Julio de 2026  
**Estado:** Listo para uso en producción