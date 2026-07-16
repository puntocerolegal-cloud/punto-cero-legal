# MATRIZ DE DECISIÓN DE PRODUCCIÓN
## Punto Cero Legal v1.0 - CTO / Software Architect / Product Owner / QA Lead / Release Manager / Senior Full Stack Engineer

**Fecha:** 14 de Julio de 2026  
**Decisor:** CTO / Software Architect / Product Owner / QA Lead / Release Manager / Senior Full Stack Engineer  
**Tipo:** Documento de Decisión Estratégica para Go-Live  
**Estado:** FEATURE FREEZE - Análisis y decisión

---

## RESUMEN EJECUTIVO

### Estado General: 🟡 OPERATIVO CON LIMITACIONES

**Total de elementos auditados:** 47  
**P0 - Bugs Críticos:** 5 (deben repararse)  
**P1 - Funcionalidades Incompletas:** 4 (deben completarse)  
**P2 - Funcionalidades Diferibles:** 3 (Sprint 1)  
**P3 - Visión Futura:** 3 (Roadmap 2.0)  
**P4 - Ocultar Temporalmente:** 4 (ocultar ahora)

### Decisión Estratégica

🟡 **PUNTO CERO LEGAL v1.0 PUEDE LANZARSE CON 9 ELEMENTOS A REPARAR/COMPLETAR**

Se requiere reparar 5 bugs críticos y completar 4 funcionalidades incompletas antes del Go-Live. El resto se diferirá o ocultará.

**Esfuerzo total:** 58-72 horas (7-9 días hábiles)  
**Riesgo:** Bajo  
**Impacto en fecha de lanzamiento:** +1 semana

---

## FASE 1: CLASIFICACIÓN ESTRATÉGICA

### 1.1 Criterios de Clasificación

**P0 — BUG CRÍTICO:**
- Existe y debe funcionar
- Está roto actualmente
- Bloquea operación normal
- Debe repararse antes del Go-Live

**P1 — FUNCIONALIDAD INCOMPLETA:**
- Ya empezó a desarrollarse
- Existe parcialmente
- Es core para el negocio
- Debe terminarse para producción

**P2 — FUNCIONALIDAD DIFERIBLE:**
- Es útil pero no crítica
- No bloquea operación inicial
- Puede desarrollarse en Sprint 1
- Mejora la experiencia

**P3 — VISIÓN FUTURA:**
- No pertenece a v1.0
- Requiere arquitectura adicional
- No aporta valor inmediato
- Va a Roadmap 2.0

**P4 — OCULTAR TEMPORALMENTE:**
- No existe funcionalidad
- No se desarrollará ahora
- Debe ocultarse del usuario
- Evita confusión

---

## FASE 2: ANÁLISIS POR CATEGORÍA

### 2.1 P0 — BUGS CRÍTICOS (5 elementos)

Deben repararse antes del Go-Live. Sin estos fixes, el sistema no opera.

| # | Elemento | Módulo | Causa | Esfuerzo | Impacto |
|---|----------|--------|-------|----------|---------|
| 1 | Error import email_service | Backend | Import roto | Muy Bajo | Crítico |
| 2 | Endpoint PUT /api/firms/profile | Perfil | Backend incompleto | Medio | Crítico |
| 3 | Endpoint PUT /api/firms/settings | Configuración | Backend incompleto | Medio | Crítico |
| 4 | Servicio de upload avatar | Perfil | Servicio faltante | Medio | Crítico |
| 5 | Endpoint POST /api/firm/team/invite | Equipo | Backend incompleto | Alto | Crítico |

**Esfuerzo total P0:** 18-24 horas (2-3 días hábiles)

**Análisis detallado:**

**1. Error import email_service**
- **Archivo:** Backend (múltiples archivos)
- **Causa:** Ruta de importación incorrecta
- **Impacto:** Bloquea envío de emails (verificación, notificaciones, recuperación de contraseña)
- **Esfuerzo:** Muy Bajo (2h) - Solo corregir rutas
- **Dependencias:** Ninguna
- **Acción:** Reparar

**2. Endpoint PUT /api/firms/profile**
- **Archivo Frontend:** `FirmProfile.jsx`
- **Endpoint Backend:** No existe
- **Causa:** Controlador no implementado
- **Impacto:** No se puede actualizar perfil de firma
- **Esfuerzo:** Medio (6h) - Controlador + servicio + validaciones
- **Dependencias:** Modelo `firms` existe
- **Acción:** Reparar

**3. Endpoint PUT /api/firms/settings**
- **Archivo Frontend:** `FirmSettings.jsx`
- **Endpoint Backend:** No existe
- **Causa:** Controlador no implementado
- **Impacto:** No se puede guardar configuración
- **Esfuerzo:** Medio (6h) - Controlador + servicio
- **Dependencias:** Modelo `firms` existe
- **Acción:** Reparar

**4. Servicio de upload avatar**
- **Archivo Frontend:** `FirmProfile.jsx`
- **Endpoint Backend:** No existe
- **Causa:** Servicio de almacenamiento no implementado
- **Impacto:** No se puede cambiar foto de perfil
- **Esfuerzo:** Medio (4h) - Endpoint + servicio S3/CloudStorage
- **Dependencias:** AWS S3 o similar configurado
- **Acción:** Reparar

**5. Endpoint POST /api/firm/team/invite**
- **Archivo Frontend:** `FirmTeam.jsx`, `FirmLawyers.jsx`
- **Endpoint Backend:** No existe
- **Causa:** Sistema de invitaciones no implementado
- **Impacto:** No se puede invitar miembros al equipo
- **Esfuerzo:** Alto (8h) - Endpoint + controlador + servicio + modelo
- **Dependencias:** Colección `team_invitations` no existe
- **Acción:** Reparar

---

### 2.2 P1 — FUNCIONALIDADES INCOMPLETAS (4 elementos)

Ya empezaron a desarrollarse. Son core para el negocio. Deben terminarse.

| # | Elemento | Módulo | Estado Actual | Esfuerzo | Impacto |
|---|----------|--------|---------------|----------|---------|
| 1 | Administrar Equipo | Equipo | UI existe, backend no | Alto | Alto |
| 2 | Invitar Abogado | Equipo | UI existe, backend no | Alto | Alto |
| 3 | Eliminar/Cambiar Rol | Equipo | UI existe, backend no | Medio | Medio |
| 4 | Actualizar Plan | Facturación | UI existe, ruta no | Bajo | Alto |

**Esfuerzo total P1:** 24-32 horas (3-4 días hábiles)

**Análisis detallado:**

**1. Administrar Equipo**
- **Archivo Frontend:** `FirmTeam.jsx`
- **Ruta:** `/firm-os/team`
- **Backend:** No existe
- **Causa:** Módulo solo tiene UI
- **Impacto:** No se puede gestionar equipo
- **Esfuerzo:** Alto (10h) - CRUD completo de equipo
- **Dependencias:** 
  - Firma creada ✅
  - Suscripción activa ✅
  - Endpoints equipo ❌
- **Acción:** Completar

**2. Invitar Abogado**
- **Archivo Frontend:** `FirmLawyers.jsx`
- **Endpoint Backend:** No existe
- **Causa:** Sistema de invitaciones parcial
- **Impacto:** No se puede invitar abogados
- **Esfuerzo:** Alto (10h) - Sistema de invitaciones + emails
- **Dependencias:**
  - Email service ✅ (después de fix P0)
  - JWT tokens ✅
  - Backend endpoints ❌
- **Acción:** Completar

**3. Eliminar/Cambiar Rol**
- **Archivo Frontend:** `FirmTeam.jsx`
- **Endpoint Backend:** No existe
- **Causa:** Endpoints de gestión de roles no existen
- **Impacto:** No se puede modificar equipo
- **Esfuerzo:** Medio (6h) - Endpoints + lógica de roles
- **Dependencias:**
  - RBAC existe ✅
  - Endpoints ❌
- **Acción:** Completar

**4. Actualizar Plan**
- **Archivo Frontend:** `FirmDashboard.jsx`
- **Ruta:** `/firm-os/settings/billing`
- **Backend:** No existe página
- **Causa:** Página de billing no creada para Firm OS
- **Impacto:** No se puede cambiar plan desde Firm OS
- **Esfuerzo:** Bajo (4h) - Crear página + conectar con Mercado Pago
- **Dependencias:**
  - Mercado Pago configurado ✅
  - Webhooks funcionando ✅
  - Página billing ❌
- **Acción:** Completar

---

### 2.3 P2 — FUNCIONALIDADES DIFERIBLES (3 elementos)

Útiles pero no bloquean operación inicial. Sprint 1.

| # | Elemento | Módulo | Estado Actual | Esfuerzo | Impacto |
|---|----------|--------|---------------|----------|---------|
| 1 | Descargar Factura PDF | Facturación | UI existe, PDF no | Medio | Bajo |
| 2 | Activar 2FA | Seguridad | UI existe, backend no | Medio | Medio |
| 3 | Exportar Conversación IA | IA | Funcionalidad limitada | Bajo | Bajo |

**Esfuerzo total P2:** 16-20 horas (2-3 días hábiles)

**Análisis detallado:**

**1. Descargar Factura PDF**
- **Archivo Frontend:** `InvoicesPage.jsx`
- **Endpoint Backend:** No existe
- **Causa:** Servicio de generación de PDF no implementado
- **Impacto:** No se puede descargar factura en PDF
- **Esfuerzo:** Medio (8h) - Servicio PDF + endpoint
- **Dependencias:**
  - Facturas existen ✅
  - Datos de facturación ✅
  - PDF library ❌
- **Acción:** Diferir a Sprint 1
- **Justificación:** Se pueden ver facturas en pantalla. El PDF es una mejora.

**2. Activar 2FA**
- **Archivo Frontend:** `FirmSettings.jsx`
- **Endpoint Backend:** No existe
- **Causa:** Servicio de 2FA no implementado
- **Impacto:** No se puede activar autenticación de dos factores
- **Esfuerzo:** Medio (8h) - Servicio 2FA + endpoint + UI
- **Dependencias:**
  - Email service ✅ (después de fix P0)
  - JWT ✅
  - Librería 2FA ❌
- **Acción:** Diferir a Sprint 1
- **Justificación:** No es crítico para v1.0. Mejora seguridad.

**3. Exportar Conversación IA**
- **Archivo Frontend:** `AIPage.jsx`
- **Estado:** Solo exporta texto plano
- **Causa:** Funcionalidad limitada
- **Impacto:** No se puede exportar en formato enriquecido
- **Esfuerzo:** Bajo (2h) - Mejorar formato de exportación
- **Dependencias:** Ninguna
- **Acción:** Diferir a Sprint 1
- **Justificación:** Funciona pero puede mejorarse.

---

### 2.4 P3 — VISIÓN FUTURA (3 elementos)

No pertenecen a v1.0. Van a Roadmap 2.0.

| # | Elemento | Módulo | Causa | Esfuerzo | Impacto |
|---|----------|--------|-------|----------|---------|
| 1 | Integración Google Calendar | Configuración | OAuth no configurado | Muy Alto | Bajo |
| 2 | Integración Outlook | Configuración | OAuth no configurado | Muy Alto | Bajo |
| 3 | Módulo Comunicaciones | Comunicaciones | No desarrollado | Muy Alto | Bajo |

**Esfuerzo total P3:** 80-120 horas (10-15 días hábiles)

**Análisis detallado:**

**1. Integración Google Calendar**
- **Archivo Frontend:** `FirmSettings.jsx`
- **Backend:** No existe
- **Causa:** OAuth de Google no configurado
- **Impacto:** No se puede sincronizar con Google Calendar
- **Esfuerzo:** Muy Alto (40h) - OAuth + API Google + sincronización
- **Dependencias:**
  - Google Cloud Project ❌
  - OAuth credentials ❌
  - API Calendar ❌
- **Acción:** Diferir a Roadmap 2.0
- **Justificación:** No es crítico para v1.0. La agenda básica funciona sin sincronización.

**2. Integración Outlook**
- **Archivo Frontend:** `FirmSettings.jsx`
- **Backend:** No existe
- **Causa:** OAuth de Microsoft no configurado
- **Impacto:** No se puede sincronizar con Outlook
- **Esfuerzo:** Muy Alto (40h) - OAuth + API Microsoft + sincronización
- **Dependencias:**
  - Azure AD ❌
  - OAuth credentials ❌
  - API Graph ❌
- **Acción:** Diferir a Roadmap 2.0
- **Justificación:** No es crítico para v1.0. Mismo razonamiento que Google Calendar.

**3. Módulo Comunicaciones**
- **Archivo Frontend:** No existe
- **Backend:** No existe
- **Causa:** Módulo no desarrollado
- **Impacto:** No existe módulo de comunicaciones
- **Esfuerzo:** Muy Alto (40h) - Módulo completo
- **Dependencias:** Ninguna
- **Acción:** Diferir a Roadmap 2.0
- **Justificación:** No es core para v1.0. Las notificaciones básicas funcionan.

---

### 2.5 P4 — OCULTAR TEMPORALMENTE (4 elementos)

No existen. No se desarrollarán ahora. Deben ocultarse.

| # | Elemento | Módulo | Causa | Esfuerzo | Impacto |
|---|----------|--------|-------|----------|---------|
| 1 | Botón Google Calendar | Configuración | No implementado | Muy Bajo | Bajo |
| 2 | Botón Outlook | Configuración | No implementado | Muy Bajo | Bajo |
| 3 | Item menú Comunicaciones | FirmOSSidebar | No existe módulo | Muy Bajo | Bajo |
| 4 | Página /firm-os/settings/billing | Facturación | No existe | Muy Bajo | Bajo |

**Esfuerzo total P4:** 2-4 horas (0.5 días hábiles)

**Análisis detallado:**

**1. Botón Google Calendar**
- **Archivo Frontend:** `FirmSettings.jsx`
- **Acción:** Ocultar botón con `display: none` o condicional
- **Esfuerzo:** Muy Bajo (0.5h)
- **Acción:** Ocultar

**2. Botón Outlook**
- **Archivo Frontend:** `FirmSettings.jsx`
- **Acción:** Ocultar botón con `display: none` o condicional
- **Esfuerzo:** Muy Bajo (0.5h)
- **Acción:** Ocultar

**3. Item menú Comunicaciones**
- **Archivo Frontend:** `FirmOSSidebar.jsx`
- **Acción:** Remover del menú o comentar
- **Esfuerzo:** Muy Bajo (0.5h)
- **Acción:** Ocultar

**4. Página /firm-os/settings/billing**
- **Archivo Frontend:** No existe
- **Acción:** Remover link del dashboard o ocultar botón
- **Esfuerzo:** Muy Bajo (0.5h)
- **Acción:** Ocultar

---

## FASE 3: MATRIZ DE DECISIÓN COMPLETA

### 3.1 Matriz por Módulo

| Módulo | Elemento | Clasificación | Acción | Esfuerzo | Prioridad |
|--------|----------|---------------|--------|----------|-----------|
| **Backend** |
| Backend | Error import email_service | P0 | Reparar | Muy Bajo (2h) | CRÍTICA |
| **Perfil** |
| Perfil | Guardar Perfil | P0 | Reparar | Medio (6h) | CRÍTICA |
| Perfil | Cambiar Foto | P0 | Reparar | Medio (4h) | CRÍTICA |
| Perfil | Actualizar Plan | P1 | Completar | Bajo (4h) | ALTA |
| **Equipo** |
| Equipo | Administrar Equipo | P1 | Completar | Alto (10h) | CRÍTICA |
| Equipo | Invitar Miembro | P1 | Completar | Alto (10h) | CRÍTICA |
| Equipo | Invitar Abogado | P1 | Completar | Alto (10h) | CRÍTICA |
| Equipo | Eliminar Miembro | P1 | Completar | Medio (6h) | ALTA |
| Equipo | Cambiar Rol | P1 | Completar | Medio (6h) | ALTA |
| **Configuración** |
| Config | Guardar Configuración | P0 | Reparar | Medio (6h) | CRÍTICA |
| Config | Activar 2FA | P2 | Diferir | Medio (8h) | MEDIA |
| Config | Google Calendar | P3 | Diferir | Muy Alto (40h) | BAJA |
| Config | Outlook | P3 | Diferir | Muy Alto (40h) | BAJA |
| **Facturación** |
| Facturación | Ver Facturas | 🟢 OK | Ninguna | - | - |
| Facturación | Descargar Factura PDF | P2 | Diferir | Medio (8h) | MEDIA |
| Facturación | Cambiar Plan | P1 | Completar | Bajo (4h) | ALTA |
| **Comunicaciones** |
| Comunicaciones | Módulo completo | P3 | Diferir | Muy Alto (40h) | BAJA |
| **Notificaciones** |
| Notificaciones | Ver Notificaciones | 🟢 OK | Ninguna | - | - |
| Notificaciones | Marcar leído | 🟢 OK | Ninguna | - | - |
| **Alertas** |
| Alertas | Ver Alertas | 🟢 OK | Ninguna | - | - |
| **CRM** |
| CRM | Crear/Editar/Eliminar Cliente | 🟢 OK | Ninguna | - | - |
| **Casos** |
| Casos | Crear/Editar/Ver Caso | 🟢 OK | Ninguna | - | - |
| **Documentos** |
| Documentos | Subir/Descargar/Eliminar | 🟢 OK | Ninguna | - | - |
| **Reuniones** |
| Reuniones | Crear/Unirse/Finalizar | 🟢 OK | Ninguna | - | - |
| **IA** |
| IA | Enviar Consulta | 🟢 OK | Ninguna | - | - |
| IA | Exportar Conversación | P2 | Diferir | Bajo (2h) | BAJA |

---

## FASE 4: PLAN DE PRODUCCIÓN

### 4.1 Fase Pre-Producción (Obligatorio)

**Duración:** 7-9 días hábiles  
**Esfuerzo:** 58-72 horas

#### Semana 1: Bugs Críticos P0

**Día 1 (2h):**
- ✅ Corregir error import email_service

**Día 2-3 (16h):**
- ✅ Implementar endpoint PUT /api/firms/profile (6h)
- ✅ Implementar endpoint PUT /api/firms/settings (6h)
- ✅ Implementar servicio de upload avatar (4h)

**Día 4-5 (16h):**
- ✅ Implementar endpoint POST /api/firm/team/invite (8h)
- ✅ Implementar CRUD completo de equipo (8h)

**Total P0:** 34-36 horas (4.5 días)

#### Semana 2: Funcionalidades Incompletas P1

**Día 6-7 (16h):**
- ✅ Completar Administrar Equipo (10h)
- ✅ Completar Invitar Abogado (6h)

**Día 8 (10h):**
- ✅ Completar Eliminar/Cambiar Rol (6h)
- ✅ Completar Actualizar Plan (4h)

**Total P1:** 26-30 horas (3.5 días)

**Total Pre-Producción:** 60-66 horas (7.5-8.5 días)

---

### 4.2 Fase Post-Producción: Sprint 1

**Duración:** 2-3 días hábiles  
**Esfuerzo:** 16-20 horas

#### Sprint 1: Funcionalidades Diferibles P2

**Día 1 (8h):**
- ✅ Implementar Descargar Factura PDF (8h)

**Día 2 (8h):**
- ✅ Implementar Activar 2FA (8h)

**Día 3 (2h):**
- ✅ Mejorar Exportar Conversación IA (2h)

**Total P2:** 18 horas (2.5 días)

---

### 4.3 Fase Futura: Roadmap 2.0

**Duración:** 10-15 días hábiles  
**Esfuerzo:** 80-120 horas

#### Roadmap 2.0: Visión Futura P3

**Futuro:**
- ⏳ Integración Google Calendar (40h)
- ⏳ Integración Outlook (40h)
- ⏳ Módulo Comunicaciones (40h)

**Total P3:** 120 horas (15 días)

---

### 4.4 Fase Inmediata: Ocultar P4

**Duración:** 0.5 días hábiles  
**Esfuerzo:** 2-4 horas

#### Ahora: Ocultar Elementos No Implementados

**Inmediato:**
- 🔒 Ocultar botón Google Calendar (0.5h)
- 🔒 Ocultar botón Outlook (0.5h)
- 🔒 Ocultar item menú Comunicaciones (0.5h)
- 🔒 Ocultar link a página billing (0.5h)

**Total P4:** 2 horas (0.5 días)

---

## FASE 5: ANÁLISIS DE RIESGO

### 5.1 Riesgos por Categoría

| Categoría | Cantidad | Riesgo | Mitigación |
|-----------|----------|--------|------------|
| P0 | 5 | Muy Alto | Reparar antes de Go-Live |
| P1 | 4 | Alto | Completar antes de Go-Live |
| P2 | 3 | Bajo | Sprint 1 |
| P3 | 3 | Muy Bajo | Roadmap 2.0 |
| P4 | 4 | Bajo | Ocultar ahora |

### 5.2 Riesgos Específicos

**P0 - Bugs Críticos:**
- **Riesgo:** Sistema no opera sin estos fixes
- **Probabilidad:** 100% (ya están rotos)
- **Impacto:** Crítico
- **Mitigación:** Reparar antes de Go-Live

**P1 - Funcionalidades Incompletas:**
- **Riesgo:** Usuarios no pueden gestionar equipo ni configuración
- **Probabilidad:** 100% (no existen)
- **Impacto:** Alto
- **Mitigación:** Completar antes de Go-Live

**P2 - Diferibles:**
- **Riesgo:** Usuarios no tienen PDF ni 2FA
- **Probabilidad:** Baja (no son críticos)
- **Impacto:** Bajo
- **Mitigación:** Sprint 1

**P3 - Visión Futura:**
- **Riesgo:** No hay integraciones externas
- **Probabilidad:** Nula (no prometidas)
- **Impacto:** Muy Bajo
- **Mitigación:** Roadmap 2.0

**P4 - Ocultar:**
- **Riesgo:** Usuarios ven botones que no funcionan
- **Probabilidad:** Alta (si no se ocultan)
- **Impacto:** Bajo
- **Mitigación:** Ocultar inmediatamente

---

## FASE 6: ANÁLISIS DE IMPACTO

### 6.1 Impacto Comercial

| Módulo | Estado Actual | Impacto Comercial | Justificación |
|--------|---------------|-------------------|---------------|
| CRM | 🟢 Funciona | Ninguno | Core del negocio, funciona |
| Casos | 🟢 Funciona | Ninguno | Core del negocio, funciona |
| Documentos | 🟢 Funciona | Ninguno | Core del negocio, funciona |
| Reuniones | 🟢 Funciona | Ninguno | Core del negocio, funciona |
| IA | 🟢 Funciona | Ninguno | Core del negocio, funciona |
| Equipo | 🔴 No funciona | Alto | No se puede gestionar equipo |
| Facturación | 🔴 No funciona | Alto | No se puede cambiar plan |
| Configuración | 🔴 No funciona | Medio | No se puede configurar perfil |
| Perfil | 🟡 Parcial | Medio | No se puede actualizar perfil |

### 6.2 Impacto Jurídico

| Módulo | Estado Actual | Impacto Jurídico | Justificación |
|--------|---------------|------------------|---------------|
| Casos | 🟢 Funciona | Ninguno | Funciona completamente |
| Documentos | 🟢 Funciona | Ninguno | Funciona completamente |
| CRM | 🟢 Funciona | Ninguno | Funciona completamente |
| Perfil | 🟡 Parcial | Bajo | No se puede actualizar datos de firma |
| Equipo | 🔴 No funciona | Medio | No se puede gestionar equipo |

### 6.3 Impacto Operativo

| Módulo | Estado Actual | Impacto Operativo | Justificación |
|--------|---------------|-------------------|---------------|
| Notificaciones | 🟢 Funciona | Ninguno | Funciona completamente |
| Alertas | 🟢 Funciona | Ninguno | Funciona completamente |
| Reuniones | 🟢 Funciona | Ninguno | Funciona completamente |
| Equipo | 🔴 No funciona | Alto | No se puede invitar miembros |
| Facturación | 🔴 No funciona | Alto | No se puede cambiar plan |

---

## FASE 7: DEPENDENCIAS

### 7.1 Mapa de Dependencias Completo

```
Registro
  ↓
Verificación de cuenta (email_service)
  ↓
Creación de Firma
  ↓
Suscripción activa (Mercado Pago)
  ↓
Acceso a Firm OS
  ↓
Configuración de Perfil [P0 - debe repararse]
  ↓
Gestión de Equipo [P1 - debe completarse]
  ↓
  ├── Invitar Miembro [P1]
  ├── Invitar Abogado [P1]
  ├── Eliminar Miembro [P1]
  └── Cambiar Rol [P1]
  ↓
Módulos operativos [🟢 Funcionan]
  ├── CRM
  ├── Casos
  ├── Documentos
  ├── Reuniones
  ├── IA
  ├── Notificaciones
  └── Alertas
  ↓
Facturación [P1 - debe completarse]
  ├── Ver Facturas [🟢 Funciona]
  ├── Descargar PDF [P2 - Sprint 1]
  └── Cambiar Plan [P1]
  ↓
Configuración avanzada [P2 - Sprint 1]
  ├── 2FA [P2]
  └── Integraciones [P3 - Roadmap 2.0]
      ├── Google Calendar [P3]
  └── Outlook [P3]
```

### 7.2 Dependencias por Elemento

| Elemento | Depende de | Estado Dependencia |
|----------|-----------|-------------------|
| Error email_service | Ninguna | ✅ Disponible |
| Guardar Perfil | Firma creada | ✅ Disponible |
| Cambiar Foto | Servicio upload | ❌ No existe |
| Administrar Equipo | Firma + Suscripción + Backend | ⚠️ Parcial |
| Invitar Miembro | Email service + Backend | ⚠️ Parcial |
| Invitar Abogado | Email service + Backend | ⚠️ Parcial |
| Guardar Configuración | Firma creada | ✅ Disponible |
| Activar 2FA | Email service | ⚠️ Parcial |
| Descargar PDF | Facturas | ✅ Disponible |
| Google Calendar | OAuth Google | ❌ No configurado |
| Outlook | OAuth Microsoft | ❌ No configurado |

---

## FASE 8: ESFUERZO Y COSTO

### 8.1 Estimación por Fase

| Fase | Elementos | Esfuerzo (horas) | Esfuerzo (días) | Costo Estimado |
|------|-----------|------------------|-----------------|----------------|
| P0 - Bugs Críticos | 5 | 34-36 | 4.5 | $4,500-$5,400 |
| P1 - Funcionalidades Incompletas | 4 | 26-30 | 3.5 | $3,900-$4,500 |
| P2 - Diferibles | 3 | 16-20 | 2.5 | $2,400-$3,000 |
| P3 - Visión Futura | 3 | 120 | 15 | $18,000 |
| P4 - Ocultar | 4 | 2-4 | 0.5 | $300-$600 |
| **TOTAL** | **19** | **198-210** | **26** | **$29,100-$33,000** |

**Nota:** Costo basado en $150/hora (tarifa promedio senior)

### 8.2 Inversión por Fase

**Pre-Producción (P0 + P1):**
- Inversión: $8,400-$9,900
- Duración: 8-9 días
- Retorno: Sistema operativo

**Sprint 1 (P2):**
- Inversión: $2,400-$3,000
- Duración: 2-3 días
- Retorno: Mejoras de UX

**Roadmap 2.0 (P3):**
- Inversión: $18,000
- Duración: 15 días
- Retorno: Integraciones avanzadas

**Ocultar P4:**
- Inversión: $300-$600
- Duración: 0.5 días
- Retorno: Mejor UX

---

## FASE 9: RECOMENDACIONES ESTRATÉGICAS

### 9.1 Decisión Recomendada

**OPCIÓN A: Lanzamiento en 2 semanas (RECOMENDADO)**

**Acciones:**
1. Ocultar P4 (0.5 días)
2. Reparar P0 (4.5 días)
3. Completar P1 (3.5 días)
4. Lanzar v1.0
5. Sprint 1 para P2 (2.5 días)

**Total:** 11 días hábiles  
**Costo:** $11,100-$13,500  
**Beneficio:** Sistema funcional completo

**OPCIÓN B: Lanzamiento en 1 semana (NO RECOMENDADO)**

**Acciones:**
1. Ocultar P4 (0.5 días)
2. Reparar solo P0 críticos (2 días)
3. Lanzar v1.0 con limitaciones

**Total:** 2.5 días hábiles  
**Costo:** $3,000-$3,600  
**Beneficio:** Lanzamiento rápido pero con limitaciones

**Riesgo:** Usuarios no pueden gestionar equipo ni configuración

**OPCIÓN C: Lanzamiento en 3 semanas (IDEAL)**

**Acciones:**
1. Ocultar P4 (0.5 días)
2. Reparar P0 (4.5 días)
3. Completar P1 (3.5 días)
4. Completar P2 (2.5 días)
5. Lanzar v1.0 completo

**Total:** 11 días hábiles  
**Costo:** $13,500-$16,500  
**Beneficio:** Sistema completo con mejoras

### 9.2 Decisión Final

🟡 **RECOMENDACIÓN: OPCIÓN A**

**Justificación:**
- Balance entre tiempo y funcionalidad
- Sistema operativo en 2 semanas
- Costo razonable
- Riesgo bajo
- Sprint 1 para mejoras

**NO recomendamos Opción B** porque deja funcionalidades críticas sin operar.

**NO recomendamos Opción C** porque agrega 2 días sin valor crítico para el lanzamiento.

---

## FASE 10: ORDEN EXACTO DE TRABAJO

### 10.1 Orden de Ejecución

**FASE 4.1: Ocultar P4 (0.5 días)**

1. Ocultar botón Google Calendar (0.5h)
2. Ocultar botón Outlook (0.5h)
3. Ocultar item menú Comunicaciones (0.5h)
4. Ocultar link a página billing (0.5h)

**FASE 4.2: Reparar P0 (4.5 días)**

**Día 1:**
1. Corregir error import email_service (2h)

**Día 2:**
2. Implementar endpoint PUT /api/firms/profile (6h)

**Día 3:**
3. Implementar endpoint PUT /api/firms/settings (6h)

**Día 4:**
4. Implementar servicio de upload avatar (4h)

**Día 5:**
5. Implementar endpoint POST /api/firm/team/invite (8h)

**FASE 4.3: Completar P1 (3.5 días)**

**Día 6:**
6. Completar Administrar Equipo (10h)

**Día 7:**
7. Completar Invitar Abogado (6h)

**Día 8:**
8. Completar Eliminar/Cambiar Rol (6h)

**Día 9:**
9. Completar Actualizar Plan (4h)

**FASE 4.4: Testing y Validación (0.5 días)**

10. Testing completo de flujos (4h)

**Total:** 9.5 días hábiles

---

## FASE 11: CRITERIOS DE ÉXITO

### 11.1 Criterios Pre-Producción

✅ **P0 reparados:**
- ✅ No hay errores de importación
- ✅ Endpoint /api/firms/profile funciona
- ✅ Endpoint /api/firms/settings funciona
- ✅ Upload avatar funciona
- ✅ Endpoint /api/firm/team/invite funciona

✅ **P1 completados:**
- ✅ Administrar Equipo funciona
- ✅ Invitar Abogado funciona
- ✅ Eliminar/Cambiar Rol funciona
- ✅ Actualizar Plan funciona

✅ **P4 ocultos:**
- ✅ No se ven botones de integraciones
- ✅ No se ve item de comunicaciones
- ✅ No se ve link a billing

✅ **Testing:**
- ✅ Flujos completos funcionan
- ✅ No hay errores en consola
- ✅ No hay errores 404
- ✅ No hay errores 500

### 11.2 Criterios Post-Producción

✅ **Sprint 1 completado:**
- ✅ Descargar Factura PDF funciona
- ✅ Activar 2FA funciona
- ✅ Exportar IA mejorado

---

## FASE 12: DICTAMEN FINAL

### 12.1 Estado del Sistema

🟡 **OPERATIVO CON LIMITACIONES**

**Justificación:**
- 9 elementos requieren acción antes de Go-Live
- 5 bugs críticos deben repararse
- 4 funcionalidades deben completarse
- Esfuerzo: 58-72 horas (7-9 días)
- Riesgo: Bajo
- Impacto en fecha: +1 semana

### 12.2 ¿Qué debe repararse obligatoriamente?

**SÍ, estos 9 elementos:**

**P0 (5 bugs):**
1. Error import email_service
2. Endpoint PUT /api/firms/profile
3. Endpoint PUT /api/firms/settings
4. Servicio de upload avatar
5. Endpoint POST /api/firm/team/invite

**P1 (4 funcionalidades):**
6. Administrar Equipo
7. Invitar Abogado
8. Eliminar/Cambiar Rol
9. Actualizar Plan

### 12.3 ¿Qué puede esperar?

**P2 (Sprint 1):**
1. Descargar Factura PDF
2. Activar 2FA
3. Exportar Conversación IA

**P3 (Roadmap 2.0):**
1. Integración Google Calendar
2. Integración Outlook
3. Módulo Comunicaciones

### 12.4 ¿Qué debe ocultarse?

**P4 (Inmediato):**
1. Botón Google Calendar
2. Botón Outlook
3. Item menú Comunicaciones
4. Link a página billing

---

## FASE 13: CONCLUSIONES

### 13.1 Resumen

**Punto Cero Legal v1.0 PUEDE lanzarse** después de reparar 9 elementos críticos (58-72 horas de trabajo).

**NO requiere** desarrollar todas las funcionalidades antes de lanzar.

**SÍ requiere** que los módulos core funcionen:
- CRM ✅
- Casos ✅
- Documentos ✅
- Reuniones ✅
- IA ✅
- Notificaciones ✅
- Alertas ✅
- Equipo ⚠️ (debe completarse)
- Facturación ⚠️ (debe completarse)
- Configuración ⚠️ (debe repararse)
- Perfil ⚠️ (debe repararse)

### 13.2 Decisión Estratégica

🟡 **LANZAMIENTO EN 2 SEMANAS**

**Acciones:**
1. Ocultar P4 (0.5 días)
2. Reparar P0 (4.5 días)
3. Completar P1 (3.5 días)
4. Testing (0.5 días)
5. Go-Live

**Inversión:** $8,400-$9,900  
**Tiempo:** 9.5 días hábiles  
**Riesgo:** Bajo  
**Beneficio:** Sistema operativo

---

## CERTIFICACIÓN

🟡 **PUNTO CERO LEGAL v1.0 PUEDE LANZARSE EN 2 SEMANAS**

**Fecha de decisión:** 14 de Julio de 2026  
**Fecha de lanzamiento estimada:** 28 de Julio de 2026  
**Esfuerzo requerido:** 58-72 horas (9.5 días hábiles)  
**Inversión:** $8,400-$9,900  
**Estado:** 🟡 OPERATIVO CON LIMITACIONES

**Certificado por:** CTO / Software Architect / Product Owner / QA Lead / Release Manager / Senior Full Stack Engineer  
**Firma digital:** [CERTIFICADO]

---

**FIN DEL DOCUMENTO DE DECISIÓN ESTRATÉGICA**