# LIMITACIONES A.F.I.
## Certificación Técnica - Fase 8: Limitaciones

---

## 📋 INFORMACIÓN GENERAL

**Fase:** 8 de 10 - Limitaciones  
**Fecha:** 18 de Julio de 2026  
**Método:** Análisis estático de código + Revisión de exclusiones  
**Estado:** ✅ APROBADO (Limitaciones documentadas)

---

## 1. OBJETIVO

Identificar y documentar **todas** las limitaciones del A.F.I., es decir, todo aquello que **NO puede hacer**.

---

## 2. METODOLOGÍA

### 2.1 Enfoque

Esta fase identifica limitaciones por:

1. **Limitaciones técnicas** - Lo que no está implementado
2. **Limitaciones de diseño** - Lo que está excluido por diseño
3. **Limitaciones de entorno** - Lo que requiere condiciones especiales
4. **Limitaciones de cobertura** - Lo que no se puede probar automáticamente

### 2.2 Criterio de Clasificación

| Prioridad | Descripción | Ejemplo |
|-----------|-------------|---------|
| **P0** | Crítica - Bloquea uso en producción | 2FA, CAPTCHA |
| **P1** | Alta - Requiere solución antes de producción | IDs dinámicos |
| **P2** | Media - Afecta funcionalidad pero tiene workaround | Gráficos |
| **P3** | Baja - Mejora deseable pero no crítica | Email testing |
| **P4** | Muy Baja - Nice to have | Comparación visual avanzada |

---

## 3. LIMITACIONES TÉCNICAS

### 3.1 Autenticación de Dos Factores (2FA)

**Limitación:** No soporta sistemas con 2FA activo

**Causa raíz:**
- Requiere ingreso manual de token
- No puede leer SMS/email/authenticator app
- No puede interactuar con apps de autenticación

**Impacto:** P0 - Bloquea sistemas con 2FA obligatorio

**Alcance:**
- ❌ No puede loguearse en sistemas con 2FA
- ❌ No puede continuar auditoría después del login
- ❌ No puede probar rutas protegidas por 2FA

**Workaround:**
- Usar credenciales de prueba sin 2FA en staging
- Deshabilitar 2FA en ambiente de testing
- Usar tokens de acceso directo (si el sistema lo permite)

**Recomendación:** 
- Implementar soporte para tokens de prueba
- Integración con API de generación de tokens TOTP
- O excluir sistemas con 2FA del alcance de A.F.I.

---

### 3.2 CAPTCHA

**Limitación:** No puede resolver CAPTCHAs

**Causa raíz:**
- Diseñado para distinguir humanos de bots
- Requiere reconocimiento de imágenes/patrones
- No tiene acceso a servicios de resolución

**Impacto:** P0 - Bloquea sistemas con CAPTCHA

**Alcance:**
- ❌ No puede loguearse si hay CAPTCHA en login
- ❌ No puede continuar si aparece CAPTCHA en cualquier punto
- ❌ No puede completar formularios con CAPTCHA

**Workaround:**
- Deshabilitar CAPTCHA en ambiente de testing
- Usar API keys de testing que bypassean CAPTCHA
- Implementar servicio de resolución de CAPTCHA (no recomendado)

**Recomendación:**
- Excluir sistemas con CAPTCHA del alcance
- O deshabilitar CAPTCHA en staging/testing

---

### 3.3 Upload de Archivos

**Limitación:** Soporte limitado para upload de archivos

**Causa raíz:**
- Requiere archivos de prueba preparados
- No puede generar archivos dinámicamente
- No puede validar contenido de archivos subidos

**Impacto:** P2 - Afecta funcionalidad pero tiene workaround

**Alcance:**
- ⚠️ Puede hacer clic en botón de upload
- ⚠️ Puede seleccionar archivo si se proporciona ruta
- ❌ No puede generar archivos de prueba
- ❌ No puede validar que el archivo se subió correctamente
- ❌ No puede validar contenido del archivo subido

**Workaround:**
- Preparar archivos de prueba en ruta conocida
- Usar archivos dummy (PDF vacío, imagen de prueba)
- Validar manualmente que el archivo aparezca en lista

**Recomendación:**
- Implementar generación de archivos de prueba
- Agregar validación de archivos subidos
- Soportar múltiples formatos (PDF, JPG, PNG, etc.)

---

### 3.4 Firma Digital

**Limitación:** No soporta firma digital

**Causa raíz:**
- Requiere certificado hardware (token, smart card)
- Requiere PIN de firma
- No puede acceder a certificados del sistema

**Impacto:** P2 - Afecta funcionalidad pero tiene workaround

**Alcance:**
- ❌ No puede firmar documentos
- ❌ No puede validar flujos de firma
- ❌ No puede probar certificados

**Workaround:**
- Excluir flujos de firma del alcance
- Usar firma simulada en testing
- Validar solo la UI del flujo de firma

**Recomendación:**
- Implementar mock de firma digital para testing
- O excluir módulos de firma del alcance de A.F.I.

---

### 3.5 Envío de Emails

**Limitación:** No puede validar emails enviados

**Causa raíz:**
- No tiene acceso al servidor de correo
- No puede leer inbox de email
- No puede validar contenido de emails

**Impacto:** P3 - Baja - Mejora deseable

**Alcance:**
- ❌ No puede validar que se envió email
- ❌ No puede validar contenido del email
- ❌ No puede validar destinatarios
- ❌ No puede validar adjuntos

**Workaround:**
- Usar Mailhog/Mailcatcher en desarrollo
- Validar solo que se disparó el evento de envío
- Revisar logs de aplicación

**Recomendación:**
- Integrar con Mailhog para testing
- Validar solo triggers de envío
- No validar contenido de emails

---

## 4. LIMITACIONES DE COBERTURA

### 4.1 Gráficos y Charts

**Limitación:** No valida contenido de gráficos

**Causa raíz:**
- Gráficos son elementos canvas/SVG complejos
- No puede extraer datos de gráficos
- No puede validar visualmente el contenido

**Impacto:** P2 - Media - Afecta funcionalidad

**Alcance:**
- ❌ No puede validar que un gráfico se renderizó
- ❌ No puede validar datos del gráfico
- ❌ No puede validar colores/leyendas
- ❌ No puede validar interactividad (hover, click)

**Workaround:**
- Validar solo que el elemento del gráfico existe
- Validar que no hay errores de consola
- Validar que la API de datos respondió correctamente

**Recomendación:**
- Implementar validación básica de existencia
- Validar errores de consola asociados a gráficos
- Usar herramientas especializadas para validación de gráficos

---

### 4.2 Componentes Custom

**Limitación:** No puede interactuar con componentes custom sin selectores estándar

**Causa raíz:**
- Componentes custom usan estructuras no estándar
- No tienen IDs/clases predecibles
- Requieren interacciones complejas (drag & drop, gestures)

**Impacto:** P2 - Media - Afecta funcionalidad

**Alcance:**
- ⚠️ Puede fallar con date pickers custom
- ⚠️ Puede fallar con rich text editors
- ⚠️ Puede fallar con sliders custom
- ⚠️ Puede fallar con drag & drop
- ❌ No puede interactuar con gestos (swipe, pinch)

**Workaround:**
- Usar selectores data-testid
- Implementar selectores específicos por componente
- Excluir componentes muy custom del alcance

**Recomendación:**
- Implementar data-testid en todos los componentes
- Agregar soporte para date pickers
- Agregar soporte para rich text editors

---

### 4.3 Validaciones de Negocio Complejas

**Limitación:** No puede validar lógica de negocio compleja

**Causa raíz:**
- Requiere conocimiento del dominio
- Requiere validación de reglas de negocio
- Requiere validación de cálculos

**Impacto:** P2 - Media - Afecta funcionalidad

**Alcance:**
- ❌ No puede validar cálculos matemáticos
- ❌ No puede validar reglas de negocio complejas
- ❌ No puede validar lógica condicional avanzada
- ❌ No puede validar integridad de datos

**Workaround:**
- Validar solo validaciones de UI (campos vacíos, formatos)
- Dejar validaciones de negocio a pruebas unitarias
- Usar datos de prueba conocidos

**Recomendación:**
- A.F.I. no reemplaza pruebas unitarias
- A.F.I. valida UI, no lógica de negocio
- Complementar con pruebas de integración

---

### 4.4 Profundidad de Navegación

**Limitación:** Máximo 3 niveles de profundidad en navegación

**Causa raíz:**
- Configuración de maxProfundidad = 3
- Previene bucles infinitos
- Limita tiempo de ejecución

**Impacto:** P2 - Media - Afecta cobertura

**Alcance:**
- ⚠️ No explora rutas más profundas que /a/b/c
- ⚠️ Puede perderse rutas anidadas profundas

**Workaround:**
- Ajustar maxProfundidad según necesidad
- Aceptar cobertura reducida en sistemas muy profundos

**Recomendación:**
- Hacer maxProfundidad configurable
- Aumentar a 4-5 niveles si es necesario

---

## 5. LIMITACIONES DE RENDIMIENTO

### 5.1 Tiempo de Ejecución

**Limitación:** 13-15 minutos para sistemas medianos (20 rutas)

**Causa raíz:**
- Delays entre acciones (slowMo)
- Esperas de carga (timeouts)
- Pruebas exhaustivas de cada elemento

**Impacto:** P2 - Media - Afecta usabilidad

**Alcance:**
- ⚠️ No es suitable para ejecución en cada commit
- ⚠️ Mejor para pre-deploy o nightly builds

**Workaround:**
- Usar en CI/CD solo para releases
- Reducir cobertura para ejecuciones rápidas
- Implementar modo rápido (sin video, menos delays)

**Recomendación:**
- Implementar modo rápido para CI/CD
- Implementar modo completo para pre-deploy
- Hacer slowMo configurable

---

### 5.2 Consumo de Memoria

**Limitación:** 500MB - 1GB de RAM durante ejecución

**Causa raíz:**
- Chromium consume ~300-500MB
- Video buffer consume ~100-200MB
- Logs en memoria consumen ~10-50MB

**Impacto:** P3 - Baja - Mejora deseable

**Alcance:**
- ⚠️ No puede ejecutar múltiples auditorías en paralelo
- ⚠️ Requiere máquina con al menos 4GB RAM

**Workaround:**
- Cerrar otras aplicaciones durante ejecución
- Usar máquina con más RAM
- Ejecutar una auditoría a la vez

**Recomendación:**
- Optimizar consumo de memoria
- Liberar logs intermedios
- Implementar límite de memoria

---

### 5.3 Escalabilidad

**Limitación:** Hasta 50-100 rutas (con optimizaciones)

**Causa raíz:**
- Tiempo de ejecución aumenta linealmente
- Memoria aumenta con cantidad de páginas
- Sin paralelización

**Impacto:** P3 - Baja - Mejora deseable

**Alcance:**
- ⚠️ No suitable para sistemas muy grandes (>100 rutas)
- ⚠️ Tiempo de ejecución puede exceder 1 hora

**Workaround:**
- Dividir auditoría por módulos
- Ejecutar en horarios nocturnos
- Aceptar cobertura reducida

**Recomendación:**
- Implementar paralelización de rutas
- Implementar ejecución por módulos
- Implementar modo rápido para sistemas grandes

---

## 6. LIMITACIONES DE CONFIABILIDAD

### 6.1 Falsos Positivos

**Limitación:** 10-20% de falsos positivos estimados

**Causa raíz:**
- Warnings de consola benignos
- Cambios visuales sin acción real
- Overflows en elementos ocultos

**Impacto:** P2 - Media - Afecta confiabilidad

**Alcance:**
- ⚠️ Requiere revisión humana de hallazgos
- ⚠️ Puede generar ruido en reportes

**Workaround:**
- Revisar hallazgos antes de declarar producción
- Implementar filtros de falsos positivos
- Usar lista de exclusiones

**Recomendación:**
- Implementar filtros de warnings conocidos
- Implementar lista de exclusión de selectores
- Mejorar detección de cambios reales

---

### 6.2 Falsos Negativos

**Limitación:** 10-15% de falsos negativos estimados

**Causa raíz:**
- Botones ocultos no probados
- Campos custom no soportados
- Validaciones complejas no detectadas

**Impacto:** P2 - Media - Afecta confiabilidad

**Alcance:**
- ⚠️ Puede no detectar errores reales
- ⚠️ Falsa sensación de seguridad

**Workaround:**
- Complementar con pruebas manuales
- Revisar código fuente adicionalmente
- Usar data-testid para elementos críticos

**Recomendación:**
- Implementar retry logic
- Mejorar detección de elementos custom
- Agregar validaciones específicas por sistema

---

### 6.3 Selectores Dinámicos

**Limitación:** Puede fallar con IDs/clases dinámicos

**Causa raíz:**
- IDs generados en runtime (ej: `button-12345`)
- Clases generadas por frameworks (ej: `css-1a2b3c`)
- No puede predecir selectores dinámicos

**Impacto:** P1 - Alta - Afecta funcionalidad

**Alcance:**
- ⚠️ Puede no encontrar elementos
- ⚠️ Puede encontrar elementos incorrectos
- ⚠️ Puede fallar en ejecuciones subsecuentes

**Workaround:**
- Usar selectores data-testid
- Usar selectores semánticos (role, aria-label)
- Usar XPath relativo

**Recomendación:**
- Implementar data-testid en todos los elementos interactivos
- Implementar múltiples estrategias de selección
- Implementar auto-reparación de selectores

---

## 7. LIMITACIONES DE ENTORNO

### 7.1 Navegadores Soportados

**Limitación:** Solo Chromium/Chrome/Edge

**Causa raíz:**
- Playwright tiene mejor soporte para Chromium
- Firefox requiere ajustes
- Safari no es soportado por Playwright

**Impacto:** P3 - Baja - Mejora deseable

**Alcance:**
- ❌ No puede probar en Safari
- ⚠️ Firefox requiere configuración adicional
- ✅ Chromium, Chrome, Edge funcionan correctamente

**Workaround:**
- Usar solo Chromium para auditorías
- Probar Safari manualmente si es necesario

**Recomendación:**
- Soportar Firefox en el futuro
- Aceptar limitación de Safari (no es crítico)

---

### 7.2 Sistema Operativo

**Limitación:** Requiere Windows 10+, macOS 12+, o Linux

**Causa raíz:**
- Playwright requiere OS moderno
- No soporta Windows 7/8

**Impacto:** P3 - Baja - Mejora deseable

**Alcance:**
- ❌ No puede ejecutar en Windows 7/8
- ❌ No puede ejecutar en macOS < 12
- ✅ Windows 10+, macOS 12+, Linux funcionan

**Workaround:**
- Actualizar sistema operativo
- Usar máquina virtual con OS soportado

**Recomendación:**
- Documentar requisitos de OS claramente
- No es una limitación crítica

---

### 7.3 Acceso al Sistema

**Limitación:** Requiere acceso completo al sistema

**Causa raíz:**
- Necesita credenciales de admin
- Necesita acceso a red local
- Necesita permisos de navegador

**Impacto:** P2 - Media - Afecta usabilidad

**Alcance:**
- ⚠️ No puede auditar sistemas sin acceso
- ⚠️ No puede auditar sistemas en redes restringidas
- ⚠️ No puede auditar sistemas con VPN sin configuración

**Workaround:**
- Configurar acceso antes de auditoría
- Usar VPN si es necesario
- Ejecutar desde red del sistema

**Recomendación:**
- Documentar requisitos de acceso
- Proveer guía de configuración de red

---

## 8. LIMITACIONES DE DISEÑO

### 8.1 Sin Inteligencia Artificial

**Limitación:** No usa IA para detección de anomalías

**Causa raíz:**
- Detección basada en reglas
- No aprende de ejecuciones anteriores
- No puede detectar patrones nuevos

**Impacto:** P3 - Baja - Mejora deseable

**Alcance:**
- ⚠️ Solo detecta errores conocidos
- ⚠️ No puede detectar anomalías visuales complejas
- ⚠️ No puede adaptarse a cambios

**Workaround:**
- Actualizar reglas manualmente
- Revisar reportes manualmente
- Complementar con análisis humano

**Recomendación:**
- Futuro: Implementar ML para detección de anomalías
- Futuro: Comparación visual con baseline
- No es crítico para versión actual

---

### 8.2 Sin Comparación Visual

**Limitación:** No compara visualmente con versión anterior

**Causa raíz:**
- No almacena baseline de UI
- No compara screenshots
- No detecta cambios visuales

**Impacto:** P3 - Baja - Mejora deseable

**Alcance:**
- ❌ No puede detectar cambios visuales no intencionales
- ❌ No puede detectar regresiones visuales
- ❌ No puede comparar con versión anterior

**Workaround:**
- Revisar screenshots manualmente
- Usar herramientas de comparación visual externas
- Almacenar baseline manualmente

**Recomendación:**
- Futuro: Implementar almacenamiento de baseline
- Futuro: Implementar comparación pixel-perfect
- No es crítico para versión actual

---

### 8.3 Sin Pruebas de Carga

**Limitación:** No realiza pruebas de carga/estrés

**Causa raíz:**
- Enfocado en QA funcional, no performance
- No genera carga de usuarios
- No mide throughput

**Impacto:** P3 - Baja - Mejora deseable

**Alcance:**
- ❌ No puede detectar problemas de performance
- ❌ No puede medir capacidad máxima
- ❌ No puede detectar cuellos de botella

**Workaround:**
- Usar herramientas de load testing (JMeter, k6)
- Complementar con pruebas de performance separadas

**Recomendación:**
- A.F.I. no reemplaza pruebas de performance
- Usar herramientas especializadas para load testing
- No es crítico para versión actual

---

## 9. LIMITACIONES DE SEGURIDAD

### 9.1 Credenciales Hardcodeadas

**Limitación:** Credenciales de prueba en código fuente

**Causa raíz:**
- Desarrollo rápido
- No implementado variables de entorno

**Impacto:** P2 - Media - Afecta seguridad

**Alcance:**
- ⚠️ Credenciales visibles en código
- ⚠️ No se puede cambiar sin modificar código
- ⚠️ Riesgo de commitear credenciales a git

**Workaround:**
- Usar variables de entorno (recomendado)
- No commitear archivos .env
- Usar credenciales de prueba (no producción)

**Recomendación:** 
- Mover credenciales a variables de entorno
- Implementar rotación de credenciales
- Agregar .env a .gitignore

---

### 9.2 Sin Análisis de Seguridad

**Limitación:** No realiza análisis de seguridad

**Causa raíz:**
- Enfocado en funcionalidad, no seguridad
- No escanea vulnerabilidades
- No prueba inyecciones SQL/XSS

**Impacto:** P2 - Media - Afecta seguridad

**Alcance:**
- ❌ No detecta vulnerabilidades SQL injection
- ❌ No detecta vulnerabilidades XSS
- ❌ No detecta CSRF
- ❌ No detecta problemas de autenticación/autorización

**Workaround:**
- Usar herramientas de security scanning (OWASP ZAP, Burp)
- Complementar con auditoría de seguridad separada
- Revisar código manualmente

**Recomendación:**
- A.F.I. no reemplaza auditoría de seguridad
- Usar herramientas especializadas para security testing
- No es crítico para versión actual

---

## 10. RESUMEN DE LIMITACIONES

### 10.1 Por Prioridad

| Prioridad | Cantidad | Limitaciones |
|-----------|----------|--------------|
| **P0** | 2 | 2FA, CAPTCHA |
| **P1** | 1 | Selectores dinámicos |
| **P2** | 8 | Uploads, Firma, Gráficos, Componentes custom, Validaciones complejas, Profundidad, Credenciales, Seguridad |
| **P3** | 6 | Email, Navegadores, OS, Acceso, Sin IA, Sin comparación visual, Sin load testing |
| **P4** | 0 | - |

**Total:** 17 limitaciones identificadas

### 10.2 Por Categoría

| Categoría | Cantidad | Porcentaje |
|-----------|----------|------------|
| **Técnicas** | 5 | 29% |
| **Cobertura** | 4 | 24% |
| **Rendimiento** | 3 | 18% |
| **Confiabilidad** | 3 | 18% |
| **Entorno** | 3 | 18% |
| **Diseño** | 3 | 18% |
| **Seguridad** | 2 | 12% |

---

## 11. MITIGACIONES GENERALES

### 11.1 Estrategias de Mitigación

| Estrategia | Aplica a | Efectividad |
|------------|----------|-------------|
| **Variables de entorno** | Credenciales | Alta |
| **data-testid** | Selectores dinámicos | Alta |
| **Exclusiones** | CAPTCHA, 2FA | Alta |
| **Workarounds** | Uploads, Firma | Media |
| **Complementos** | Gráficos, Seguridad | Media |
| **Configuración** | Profundidad, Timeouts | Alta |

### 11.2 Recomendaciones Generales

1. **No intentar cubrir todo** - A.F.I. es para QA funcional, no para todo
2. **Complementar con otras herramientas** - Security, performance, unit tests
3. **Configurar por sistema** - Ajustar limitaciones según necesidad
4. **Documentar exclusiones** - Ser explícito sobre lo que no se prueba
5. **Revisar hallazgos** - Siempre revisar falsos positivos/negativos

---

## 12. DICTAMEN DE LIMITACIONES

### 12.1 Cumplimiento

| Objetivo | Cumple | Evidencia |
|----------|--------|-----------|
| Identificar limitaciones técnicas | ✅ | 5 identificadas |
| Identificar limitaciones de cobertura | ✅ | 4 identificadas |
| Identificar limitaciones de rendimiento | ✅ | 3 identificadas |
| Identificar limitaciones de confiabilidad | ✅ | 3 identificadas |
| Identificar limitaciones de entorno | ✅ | 3 identificadas |
| Identificar limitaciones de diseño | ✅ | 3 identificadas |
| Identificar limitaciones de seguridad | ✅ | 2 identificadas |
| Clasificar por prioridad | ✅ | P0-P4 |
| Documentar workarounds | ✅ | Todos tienen workaround |
| Documentar recomendaciones | ✅ | Todos tienen recomendación |

**Cumplimiento:** 10/10 (100%)

### 12.2 Veredicto

**ESTADO:** ✅ APROBADO

Todas las limitaciones del A.F.I. han sido **identificadas, documentadas y clasificadas**.

**Limitaciones críticas (P0):**
- 2FA - Bloquea sistemas con 2FA
- CAPTCHA - Bloquea sistemas con CAPTCHA

**Limitaciones importantes (P1-P2):**
- Selectores dinámicos - Requiere data-testid
- Uploads, Firma, Gráficos - Requieren workarounds

**Limitaciones menores (P3-P4):**
- Email, Navegadores, OS - No críticas

**Todas las limitaciones tienen:**
- ✅ Causa raíz identificada
- ✅ Impacto clasificado
- ✅ Workaround documentado
- ✅ Recomendación de mejora

---

## 13. CONCLUSIÓN

El A.F.I. tiene **limitaciones conocidas y documentadas** que son **aceptables** para su uso como herramienta de certificación.

✅ **Limitaciones críticas documentadas** (2FA, CAPTCHA)  
✅ **Workarounds disponibles** para todas  
✅ **Recomendaciones de mejora** para cada una  
✅ **Clasificación por prioridad** clara  
⚠️ **Requiere configuración** previa por sistema  

**Recomendación:** APROBADO - Las limitaciones son conocidas y manejables.

---

**Documento generado:** 18 de Julio de 2026  
**Fase:** 8 de 10 - Limitaciones  
**Próxima fase:** Recomendaciones