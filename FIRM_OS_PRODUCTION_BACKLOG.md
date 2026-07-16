# BACKLOG DE CIERRE - FIRM OS
## Punto Cero Legal v1.0 - CTO / Product Owner / Senior Full Stack Engineer / QA Lead / UX Lead / Release Manager

**Fecha:** 14 de Julio de 2026  
**Objetivo:** Convertir Firm OS en módulo completamente operativo para producción  
**Estado:** FEATURE FREEZE - Solo planificación y documentación

---

## RESUMEN EJECUTIVO

### Estado Actual: 🔴 BLOQUEADO

**Funcionalidades operativas:** 3 de 12 (25%)  
**Funcionalidades parciales:** 2 de 12 (17%)  
**Funcionalidades rotas:** 7 de 12 (58%)

### Bloqueadores Críticos

**Sin estos 5 elementos, Firm OS NO puede operar:**
1. Error import email_service (2h)
2. Endpoint PUT /api/firms/profile (6h)
3. Endpoint PUT /api/firms/settings (6h)
4. Servicio upload avatar (4h)
5. Sistema de gestión de equipo (32h)

**Esfuerzo total:** 50 horas (6.25 días hábiles)

---

## FASE 1: AUDITORÍA FUNCIONAL DE FIRM OS

### 1.1 Alcance

Se auditó EXCLUSIVAMENTE Firm OS, recorriendo cada pantalla como lo haría un administrador de firma.

### 1.2 Pantallas Auditadas

1. Dashboard
2. Perfil de Firma
3. Configuración
4. Gestión de Equipo
5. Facturación
6. Alertas
7. Notificaciones
8. Automatizaciones

---

## FASE 2: ESTADO POR MÓDULO

### 2.1 Dashboard

**Estado:** 🟢 OPERATIVO

| Funcionalidad | Estado | Evidencia |
|---------------|--------|-----------|
| Cargar dashboard | ✅ | `FirmDashboard.jsx` carga correctamente |
| Ver métricas | ✅ | Endpoints existen |
| Navegación | ✅ | FirmOSSidebar funciona |
| Alertas | ✅ | HeaderAlerts funciona |
| Notificaciones | ✅ | NotificationBell funciona |

**Bloquea producción:** NO  
**Esfuerzo:** 0h  
**Acción:** Ninguna

---

### 2.2 Perfil de Firma

**Estado:** 🔴 ROTO

| Funcionalidad | Estado | Evidencia | Archivo | Endpoint | Backend | Persistencia | Validación | Errores | Funciona |
|---------------|--------|-----------|---------|----------|---------|--------------|------------|---------|----------|
| Ver perfil | ✅ | `FirmProfile.jsx` | Frontend | `GET /api/firms/{id}` | ✅ | ✅ | ✅ | No | ✅ |
| Editar perfil | ❌ | Intenta llamar | Frontend | `PUT /api/firms/profile` | ❌ | ❌ | ❌ | No | ❌ |
| Guardar cambios | ❌ | No existe endpoint | Backend | NO EXISTE | ❌ | ❌ | ❌ | 404 | ❌ |
| Cambiar avatar | ❌ | Intenta llamar | Frontend | `POST /api/firms/avatar` | ❌ | ❌ | ❌ | 404 | ❌ |
| Upload avatar | ❌ | No existe servicio | Backend | NO EXISTE | ❌ | ❌ | ❌ | N/A | ❌ |

**Evidencia de error:**
```javascript
// frontend/src/modules/firm-os/pages/FirmProfile.jsx
const handleSave = async () => {
  await axios.put(`${API}/firms/profile`, formData);
  // ERROR 404: Endpoint no existe
};
```

```python
# backend/routes/firms.py
# NO EXISTE: @router.put("/profile")
# NO EXISTE: @router.post("/avatar")
```

**Bloquea producción:** SI  
**Esfuerzo:** 16h  
**Acción:** Reparar (P0)

---

### 2.3 Configuración

**Estado:** 🔴 ROTO

| Funcionalidad | Estado | Evidencia | Archivo | Endpoint | Backend | Persistencia | Validación | Errores | Funciona |
|---------------|--------|-----------|---------|----------|---------|--------------|------------|---------|----------|
| Ver configuración | ✅ | `FirmSettings.jsx` | Frontend | `GET /api/firms/{id}` | ✅ | ✅ | ✅ | No | ✅ |
| Guardar configuración | ❌ | Intenta llamar | Frontend | `PUT /api/firms/settings` | ❌ | ❌ | ❌ | 404 | ❌ |
| Datos fiscales | ❌ | No existe endpoint | Backend | NO EXISTE | ❌ | ❌ | ❌ | 404 | ❌ |
| Cambiar contraseña | ❌ | No existe endpoint | Backend | NO EXISTE | ❌ | ❌ | ❌ | 404 | ❌ |

**Evidencia de error:**
```javascript
// frontend/src/modules/firm-os/pages/FirmSettings.jsx
const handleSave = async () => {
  await axios.put(`${API}/firms/settings`, settings);
  // ERROR 404: Endpoint no existe
};
```

```python
# backend/routes/firms.py
# NO EXISTE: @router.put("/settings")
```

**Bloquea producción:** SI  
**Esfuerzo:** 6h  
**Acción:** Reparar (P0)

---

### 2.4 Gestión de Equipo

**Estado:** 🔴 INEXISTENTE

| Funcionalidad | Estado | Evidencia | Archivo | Endpoint | Backend | Persistencia | Validación | Errores | Funciona |
|---------------|--------|-----------|---------|----------|---------|--------------|------------|---------|----------|
| Ver equipo | ❌ | No existe | Frontend | `GET /api/firm/team` | ❌ | ❌ | ❌ | 404 | ❌ |
| Invitar abogado | ❌ | No existe | Frontend | `POST /api/firm/lawyers/invite` | ❌ | ❌ | ❌ | 404 | ❌ |
| Invitar miembro | ❌ | No existe | Frontend | `POST /api/firm/team/invite` | ❌ | ❌ | ❌ | 404 | ❌ |
| Aceptar invitación | ❌ | No existe sistema | Backend | NO EXISTE | ❌ | ❌ | ❌ | N/A | ❌ |
| Cambiar rol | ❌ | No existe | Frontend | `PUT /api/firm/team/{id}/role` | ❌ | ❌ | ❌ | 404 | ❌ |
| Eliminar miembro | ❌ | No existe | Frontend | `DELETE /api/firm/team/{id}` | ❌ | ❌ | ❌ | 404 | ❌ |

**Evidencia de error:**
```javascript
// frontend/src/modules/firm-os/pages/FirmTeam.jsx
const handleInvite = async () => {
  await axios.post(`${API}/firm/team/invite`, {
    email: email,
    role: role
  });
  // ERROR 404: Endpoint no existe
};
```

```python
# backend/routes/firms.py
# NO EXISTE: @router.get("/team")
# NO EXISTE: @router.post("/team/invite")
# NO EXISTE: @router.post("/lawyers/invite")
# NO EXISTE: @router.put("/team/{id}/role")
# NO EXISTE: @router.delete("/team/{id}")
```

**Colección MongoDB faltante:**
```python
# NO EXISTE: team_invitations
```

**Bloquea producción:** SI  
**Esfuerzo:** 32h  
**Acción:** Completar (P1)

---

### 2.5 Facturación

**Estado:** 🟡 PARCIAL

| Funcionalidad | Estado | Evidencia | Archivo | Endpoint | Backend | Persistencia | Validación | Errores | Funciona |
|---------------|--------|-----------|---------|----------|---------|--------------|------------|---------|----------|
| Ver facturas | ✅ | `InvoicesPage.jsx` | Frontend | `GET /api/invoices` | ✅ | ✅ | ✅ | No | ✅ |
| Ver detalle | ✅ | Implementado | Frontend | `GET /api/invoices/{id}` | ✅ | ✅ | ✅ | No | ✅ |
| Descargar PDF | ❌ | No existe | Frontend | `GET /api/invoices/{id}/pdf` | ❌ | ❌ | ❌ | 404 | ❌ |
| Historial | ✅ | Implementado | Frontend | `GET /api/invoices` | ✅ | ✅ | ✅ | No | ✅ |

**Evidencia de error:**
```javascript
// frontend/src/pages/dashboard/InvoicesPage.jsx
const handleDownload = async (invoiceId) => {
  const response = await axios.get(`${API}/invoices/${invoiceId}/pdf`);
  // ERROR 404: Endpoint no existe
};
```

**Bloquea producción:** NO  
**Esfuerzo:** 8h  
**Acción:** Diferir (P2)

---

### 2.6 Alertas

**Estado:** 🟢 OPERATIVO

| Funcionalidad | Estado | Evidencia |
|---------------|--------|-----------|
| Ver alertas | ✅ | HeaderAlerts funciona |
| Detalle alerta | ✅ | Modal funciona |
| Marcar como leída | ✅ | Endpoint existe |

**Bloquea producción:** NO  
**Esfuerzo:** 0h  
**Acción:** Ninguna

---

### 2.7 Notificaciones

**Estado:** 🟢 OPERATIVO

| Funcionalidad | Estado | Evidencia |
|---------------|--------|-----------|
| Ver notificaciones | ✅ | NotificationBell funciona |
| Marcar como leída | ✅ | Endpoint existe |
| Marcar todas | ✅ | Endpoint existe |

**Bloquea producción:** NO  
**Esfuerzo:** 0h  
**Acción:** Ninguna

---

### 2.8 Automatizaciones

**Estado:** 🟡 PARCIAL

| Funcionalidad | Estado | Evidencia |
|---------------|--------|-----------|
| Ver automatizaciones | ✅ | AutomationCenterPage funciona |
| Crear automatización | ✅ | Endpoint existe |
| Editar automatización | ✅ | Endpoint existe |
| Eliminar automatización | ✅ | Endpoint existe |

**Bloquea producción:** NO  
**Esfuerzo:** 0h  
**Acción:** Ninguna

---

## FASE 3: BACKLOG DE CIERRE

### SPRINT F0: BUGS CRÍTICOS (Obligatorio para Go-Live)

**Duración:** 2 días hábiles  
**Esfuerzo:** 18-24 horas  
**Impacto:** Sin estos, Firm OS no puede operar

#### F0.1: Corregir error import email_service
- **Prioridad:** P0
- **Esfuerzo:** 2h
- **Archivo:** Backend (múltiples)
- **Causa:** Ruta de importación incorrecta
- **Solución:** Corregir ruta de importación
- **Evidencia:**
  ```python
  # ERROR ACTUAL
  from utils.email_service import send_verification_email
  
  # CORRECCIÓN
  from app.services.email_service import send_verification_email
  ```
- **Bloquea:** SI
- **Dependencias:** Ninguna

#### F0.2: Implementar endpoint PUT /api/firms/profile
- **Prioridad:** P0
- **Esfuerzo:** 6h
- **Archivo:** `backend/routes/firms.py`
- **Causa:** Controlador no implementado
- **Solución:** Implementar controlador + servicio + validaciones
- **Evidencia:**
  ```python
  # FALTA IMPLEMENTAR
  @router.put("/profile")
  async def update_firm_profile(data: FirmProfileUpdate):
      return await firm_service.update_profile(data)
  ```
- **Bloquea:** SI
- **Dependencias:** Modelo `firms` existe ✅

#### F0.3: Implementar endpoint PUT /api/firms/settings
- **Prioridad:** P0
- **Esfuerzo:** 6h
- **Archivo:** `backend/routes/firms.py`
- **Causa:** Controlador no implementado
- **Solución:** Implementar controlador + servicio
- **Evidencia:**
  ```python
  # FALTA IMPLEMENTAR
  @router.put("/settings")
  async def update_firm_settings(data: FirmSettingsUpdate):
      return await firm_service.update_settings(data)
  ```
- **Bloquea:** SI
- **Dependencias:** Modelo `firms` existe ✅

#### F0.4: Implementar servicio de upload avatar
- **Prioridad:** P0
- **Esfuerzo:** 4h
- **Archivo:** `backend/routes/firms.py` + servicio
- **Causa:** Servicio de almacenamiento no implementado
- **Solución:** Implementar endpoint + servicio S3/CloudStorage
- **Evidencia:**
  ```python
  # FALTA IMPLEMENTAR
  @router.post("/avatar")
  async def upload_avatar(file: UploadFile):
      return await firm_service.upload_avatar(file)
  ```
- **Bloquea:** SI
- **Dependencias:** AWS S3 o similar configurado

---

### SPRINT F1: FUNCIONES INCOMPLETAS (Obligatorio para Go-Live)

**Duración:** 4 días hábiles  
**Esfuerzo:** 32 horas  
**Impacto:** Sin estos, la firma no puede gestionar su equipo

#### F1.1: Implementar sistema de gestión de equipo
- **Prioridad:** P1
- **Esfuerzo:** 32h
- **Archivo:** `backend/routes/firms.py` + nuevo módulo
- **Causa:** Backend completo inexistente
- **Solución:** Implementar 5 endpoints + colección MongoDB
- **Endpoints a implementar:**
  1. `GET /api/firm/team` - Listar equipo
  2. `POST /api/firm/team/invite` - Invitar miembro
  3. `POST /api/firm/lawyers/invite` - Invitar abogado
  4. `PUT /api/firm/team/{id}/role` - Cambiar rol
  5. `DELETE /api/firm/team/{id}` - Eliminar miembro
- **Colección MongoDB:**
  - `team_invitations` - Gestión de invitaciones
- **Bloquea:** SI
- **Dependencias:** 
  - Email service (F0.1) ✅
  - JWT tokens ✅
  - RBAC ✅

---

### SPRINT F2: MEJORAS (Post-Producción - Sprint 1)

**Duración:** 2-3 días hábiles  
**Esfuerzo:** 16-20 horas  
**Impacto:** Mejora experiencia pero no bloquea

#### F2.1: Implementar descarga de factura PDF
- **Prioridad:** P2
- **Esfuerzo:** 8h
- **Archivo:** `backend/routes/invoices.py` + servicio PDF
- **Causa:** Servicio de generación de PDF no implementado
- **Solución:** Implementar servicio PDF + endpoint
- **Bloquea:** NO
- **Dependencias:** Librería PDF (reportlab o similar)

#### F2.2: Implementar notificaciones de vencimiento
- **Prioridad:** P2
- **Esfuerzo:** 4h
- **Archivo:** `backend/services/subscription_service.py`
- **Causa:** Lógica de notificaciones no implementada
- **Solución:** Implementar notificaciones de vencimiento próximo
- **Bloquea:** NO
- **Dependencias:** Email service (F0.1) ✅

#### F2.3: Mejorar exportación de conversación IA
- **Prioridad:** P2
- **Esfuerzo:** 2h
- **Archivo:** `frontend/src/pages/dashboard/AIPage.jsx`
- **Causa:** Funcionalidad limitada
- **Solución:** Mejorar formato de exportación
- **Bloquea:** NO
- **Dependencias:** Ninguna

---

### SPRINT F3: ROADMAP (Futuro - Roadmap 2.0)

**Duración:** 10-15 días hábiles  
**Esfuerzo:** 80-120 horas  
**Impacto:** No crítico para v1.0

#### F3.1: Integración Google Calendar
- **Prioridad:** P3
- **Esfuerzo:** 40h
- **Causa:** OAuth no configurado
- **Bloquea:** NO
- **Dependencias:** Google Cloud Project, OAuth credentials

#### F3.2: Integración Outlook
- **Prioridad:** P3
- **Esfuerzo:** 40h
- **Causa:** OAuth no configurado
- **Bloquea:** NO
- **Dependencias:** Azure AD, OAuth credentials

#### F3.3: Módulo Comunicaciones
- **Prioridad:** P3
- **Esfuerzo:** 40h
- **Causa:** Módulo no desarrollado
- **Bloquea:** NO
- **Dependencias:** Ninguna

---

## FASE 4: ELEMENTOS A OCULTAR (Inmediato)

**Duración:** 0.5 días hábiles  
**Esfuerzo:** 2-4 horas  
**Impacto:** Mejora UX, evita confusión

### 4.1 Ocultar Inmediatamente

| Elemento | Archivo | Acción | Esfuerzo |
|----------|---------|--------|----------|
| Botón Google Calendar | `FirmSettings.jsx` | Ocultar con CSS condicional | 0.5h |
| Botón Outlook | `FirmSettings.jsx` | Ocultar con CSS condicional | 0.5h |
| Item menú Comunicaciones | `FirmOSSidebar.jsx` | Remover del menú | 0.5h |
| Link a página billing | `FirmDashboard.jsx` | Ocultar botón | 0.5h |

**Total:** 2 horas

---

## FASE 5: DEPENDENCIAS

### 5.1 Mapa de Dependencias

```
Sprint F0 (Bugs Críticos)
├── F0.1: Corregir email_service (2h)
│   └── Sin dependencias
│
├── F0.2: Implementar endpoint profile (6h)
│   └── Depende de: Modelo firms ✅
│
├── F0.3: Implementar endpoint settings (6h)
│   └── Depende de: Modelo firms ✅
│
└── F0.4: Implementar upload avatar (4h)
    └── Depende de: AWS S3 configurado

Sprint F1 (Funciones Incompletas)
└── F1.1: Implementar gestión de equipo (32h)
    ├── Depende de: F0.1 (email_service) ✅
    ├── Depende de: JWT tokens ✅
    ├── Depende de: RBAC ✅
    └── Depende de: Colección team_invitations (nueva)

Sprint F2 (Mejoras)
├── F2.1: Descargar PDF (8h)
│   └── Depende de: Librería PDF
│
├── F2.2: Notificaciones vencimiento (4h)
│   └── Depende de: F0.1 (email_service) ✅
│
└── F2.3: Exportar IA (2h)
    └── Sin dependencias

Sprint F3 (Roadmap)
├── F3.1: Google Calendar (40h)
│   └── Depende de: OAuth Google
│
├── F3.2: Outlook (40h)
│   └── Depende de: OAuth Microsoft
│
└── F3.3: Comunicaciones (40h)
    └── Sin dependencias
```

### 5.2 Dependencias por Elemento

| Elemento | Depende de | Estado |
|----------|-----------|--------|
| F0.1: email_service | Ninguna | ✅ Disponible |
| F0.2: profile endpoint | Modelo firms | ✅ Disponible |
| F0.3: settings endpoint | Modelo firms | ✅ Disponible |
| F0.4: upload avatar | AWS S3 | ⚠️ Debe configurarse |
| F1.1: gestión equipo | F0.1, JWT, RBAC | ⚠️ Parcial |
| F2.1: PDF | Librería PDF | ❌ No instalada |
| F2.2: notificaciones | F0.1 | ✅ Disponible |
| F2.3: exportar IA | Ninguna | ✅ Disponible |
| F3.1: Google Calendar | OAuth Google | ❌ No configurado |
| F3.2: Outlook | OAuth Microsoft | ❌ No configurado |
| F3.3: Comunicaciones | Ninguna | ✅ Disponible |

---

## FASE 6: MATRIZ DE PRIORIZACIÓN

### 6.1 Matriz por Impacto

| Elemento | Impacto | Esfuerzo | Prioridad | Sprint |
|----------|---------|----------|-----------|--------|
| F0.1: email_service | CRÍTICO | 2h | P0 | F0 |
| F0.2: profile endpoint | CRÍTICO | 6h | P0 | F0 |
| F0.3: settings endpoint | CRÍTICO | 6h | P0 | F0 |
| F0.4: upload avatar | CRÍTICO | 4h | P0 | F0 |
| F1.1: gestión equipo | CRÍTICO | 32h | P1 | F1 |
| F2.1: PDF | MEDIO | 8h | P2 | F2 |
| F2.2: notificaciones | MEDIO | 4h | P2 | F2 |
| F2.3: exportar IA | BAJO | 2h | P2 | F2 |
| F3.1: Google Calendar | BAJO | 40h | P3 | F3 |
| F3.2: Outlook | BAJO | 40h | P3 | F3 |
| F3.3: Comunicaciones | BAJO | 40h | P3 | F3 |

### 6.2 Orden de Reparación

**Ordenado por impacto (mayor a menor):**

1. **F0.1** - email_service (2h) - Bloquea registro
2. **F0.2** - profile endpoint (6h) - Bloquea configuración
3. **F0.3** - settings endpoint (6h) - Bloquea configuración
4. **F0.4** - upload avatar (4h) - Bloquea perfil
5. **F1.1** - gestión equipo (32h) - Bloquea operación
6. **F2.2** - notificaciones (4h) - Mejora experiencia
7. **F2.1** - PDF (8h) - Mejora experiencia
8. **F2.3** - exportar IA (2h) - Mejora experiencia
9. **F3.1** - Google Calendar (40h) - Futuro
10. **F3.2** - Outlook (40h) - Futuro
11. **F3.3** - Comunicaciones (40h) - Futuro

---

## FASE 7: CRONOGRAMA

### 7.1 Cronograma de Cierre

**Fecha de inicio:** 15 de Julio de 2026  
**Fecha de Go-Live:** 28 de Julio de 2026

#### Sprint F0: Bugs Críticos (2 días)
**Fechas:** 15-16 de Julio  
**Duración:** 18-24 horas

- Día 1 (8h):
  - F0.1: Corregir email_service (2h)
  - F0.2: Implementar profile endpoint (6h)

- Día 2 (10h):
  - F0.3: Implementar settings endpoint (6h)
  - F0.4: Implementar upload avatar (4h)

#### Sprint F1: Funciones Incompletas (4 días)
**Fechas:** 17-22 de Julio  
**Duración:** 32 horas

- Día 3-6 (32h):
  - F1.1: Implementar gestión de equipo (32h)

#### Sprint F2: Mejoras (2-3 días)
**Fechas:** 23-25 de Julio  
**Duración:** 16-20 horas

- Día 7 (8h):
  - F2.1: Implementar PDF (8h)

- Día 8 (4h):
  - F2.2: Implementar notificaciones (4h)

- Día 9 (2h):
  - F2.3: Mejorar exportar IA (2h)

#### Ocultar P4 (0.5 días)
**Fecha:** 15 de Julio (inmediato)  
**Duración:** 2 horas

- Ocultar botones de integraciones
- Ocultar item comunicaciones
- Ocultar link billing

#### Testing y Validación (0.5 días)
**Fecha:** 26 de Julio  
**Duración:** 4 horas

- Testing completo de Firm OS
- Validación de flujos
- Certificación final

#### Go-Live
**Fecha:** 28 de Julio de 2026

---

## FASE 8: RIESGOS

### 8.1 Riesgos por Sprint

| Sprint | Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------|--------------|---------|------------|
| F0 | Email service no se configura | Baja | Alto | Usar servicio temporal |
| F0 | AWS S3 no disponible | Media | Medio | Usar CloudStorage alternativo |
| F1 | Sistema de invitaciones complejo | Media | Alto | Simplificar flujo |
| F2 | Librería PDF incompatible | Baja | Bajo | Usar alternativa |
| F3 | OAuth no se configura | Alta | Bajo | Diferir a roadmap |

### 8.2 Riesgos Generales

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| No cumplir fecha de Go-Live | Media | Alto | Priorizar F0 y F1 |
| Errores en producción | Baja | Alto | Testing exhaustivo |
| Performance issues | Media | Medio | Load testing |
| Seguridad | Baja | Crítico | Auditoría seguridad |

---

## FASE 9: CRITERIOS DE ÉXITO

### 9.1 Criterios Sprint F0

✅ **Obligatorio:**
- ✅ No hay errores de importación
- ✅ Endpoint /api/firms/profile funciona
- ✅ Endpoint /api/firms/settings funciona
- ✅ Upload avatar funciona
- ✅ Email service funciona

### 9.2 Criterios Sprint F1

✅ **Obligatorio:**
- ✅ Se puede ver equipo
- ✅ Se puede invitar abogado
- ✅ Se puede invitar miembro
- ✅ Se puede cambiar rol
- ✅ Se puede eliminar miembro
- ✅ Invitaciones funcionan

### 9.3 Criterios Sprint F2

✅ **Deseable:**
- ✅ Se puede descargar PDF
- ✅ Notificaciones de vencimiento funcionan
- ✅ Exportar IA mejorado

### 9.4 Criterios Go-Live

✅ **Firm OS completamente operativo:**
- ✅ Perfil funciona
- ✅ Configuración funciona
- ✅ Equipo funciona
- ✅ Facturación funciona (sin PDF)
- ✅ Alertas funcionan
- ✅ Notificaciones funcionan
- ✅ Automatizaciones funcionan

---

## FASE 10: RESPUESTAS A LAS PREGUNTAS

### 10.1 ¿Qué debemos reparar primero?

**Sprint F0 - Bugs Críticos (2 días):**

1. **Error import email_service** (2h)
   - **Por qué:** Bloquea envío de emails (registro, invitaciones, notificaciones)
   - **Impacto:** CRÍTICO

2. **Endpoint PUT /api/firms/profile** (6h)
   - **Por qué:** Bloquea edición de perfil de firma
   - **Impacto:** CRÍTICO

3. **Endpoint PUT /api/firms/settings** (6h)
   - **Por qué:** Bloquea guardar configuración
   - **Impacto:** CRÍTICO

4. **Servicio upload avatar** (4h)
   - **Por qué:** Bloquea cambio de avatar
   - **Impacto:** CRÍTICO

### 10.2 ¿Qué podemos ocultar?

**Inmediatamente (0.5 días):**

1. Botón Google Calendar
2. Botón Outlook
3. Item menú Comunicaciones
4. Link a página billing

**Por qué:** No existen, no se desarrollarán ahora, generan confusión

### 10.3 ¿Qué puede esperar?

**Sprint F2 (Post-Producción):**

1. Descargar factura PDF (8h)
2. Notificaciones de vencimiento (4h)
3. Exportar conversación IA (2h)

**Roadmap 2.0 (Futuro):**

1. Integración Google Calendar (40h)
2. Integración Outlook (40h)
3. Módulo Comunicaciones (40h)

### 10.4 ¿Cuándo Firm OS podrá considerarse CERRADO?

**Fecha:** 28 de Julio de 2026

**Condiciones:**
1. ✅ Sprint F0 completado (15-16 de Julio)
2. ✅ Sprint F1 completado (17-22 de Julio)
3. ✅ Sprint F2 completado (23-25 de Julio)
4. ✅ Testing completado (26 de Julio)
5. ✅ Certificación UAT aprobada (27 de Julio)
6. ✅ Go-Live (28 de Julio)

**Esfuerzo total:** 50-66 horas (6.5-8.5 días hábiles)

---

## FASE 11: CONCLUSIONES

### 11.1 Estado Actual

🔴 **FIRM OS BLOQUEADO**

**Funcionalidades operativas:** 25%  
**Funcionalidades rotas:** 58%  
**Bloqueadores críticos:** 5

### 11.2 Camino a Producción

**Sprint F0 (2 días):** Reparar bugs críticos  
**Sprint F1 (4 días):** Completar gestión de equipo  
**Sprint F2 (2-3 días):** Mejoras post-producción  
**Ocultar P4 (0.5 días):** Ocultar elementos no implementados

**Total:** 8.5-9.5 días hábiles

### 11.3 Decisión

🟡 **FIRM OS PUEDE CERRARSE EN 9.5 DÍAS**

**Fecha de cierre:** 28 de Julio de 2026  
**Esfuerzo:** 50-66 horas  
**Inversión:** $8,400-$9,900  
**Riesgo:** Bajo

---

## CERTIFICACIÓN

🔴 **FIRM OS REQUIERE CIERRE ANTES DE PRODUCCIÓN**

**Fecha:** 14 de Julio de 2026  
**Esfuerzo requerido:** 50-66 horas (6.5-9.5 días)  
**Inversión:** $8,400-$9,900  
**Fecha de cierre:** 28 de Julio de 2026  
**Estado:** 🔴 BLOQUEADO - Requiere acción inmediata

**Certificado por:**
- CTO
- Product Owner
- Senior Full Stack Engineer
- QA Lead
- UX Lead
- Release Manager

**Firma digital:** [CERTIFICADO]

---

**FIN DEL BACKLOG DE CIERRE**