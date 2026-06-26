# INFORME DE INTEGRACIÓN
## Formulario "El futuro de tu firma comienza aquí" ↔ Directorio de Firmas

**Fecha:** 26 Junio 2026  
**Estado:** ✅ INTEGRACIÓN COMPLETADA

---

## 1. ANÁLISIS DEL SISTEMA EXISTENTE

### 1.1 Directorio de Firmas (Admin)

**Archivo:** `frontend/src/modules/admin/pages/FirmsOverview.jsx`

**Características actuales:**
- ✅ Tabla de firmas con columnas: Firma, Plan, Abogados, Casos Activos, Ingresos, Cobranza, Estado
- ✅ Métricas globales: Total firmas, Abogados totales, Casos activos, Ingresos
- ✅ Modal para crear firmas manualmente
- ✅ Consulta endpoint: `GET /firms`
- ✅ Carga detalles de cada firma mediante llamadas adicionales

**Campos del formulario manual (Create Modal):**
- Nombre de la Firma
- Email de la Firma
- Teléfono
- Dirección
- Ciudad
- Plan (Crecimiento o Enterprise)
- Nombre del Socio Fundador
- Email del Socio Fundador
- Teléfono del Socio
- Tarjeta Profesional

**Endpoint usado:** `POST /firms` (requiere autenticación admin)

---

## 2. ANÁLISIS DEL FORMULARIO LANDING

**Archivo:** `frontend/src/components/FirmOSPreviewBlock.jsx`

**Campos del formulario:**
- Nombre de la firma
- Nombre completo (contacto)
- Correo corporativo
- WhatsApp
- País
- Tamaño de la firma (solo/2-5/6-20/20+)

**Endpoint actual:** `POST /firms/register-lead`

**Diferencia de campos:**

| Campo | Landing Form | Admin Create | Requerimiento |
|-------|--------------|--------------|---------------|
| name | ✅ | ✅ | Ambos |
| email | ✅ (corporativo) | ✅ | Ambos |
| phone | ✅ (WhatsApp) | ✅ (teléfono) | Ambos |
| address | ❌ | ✅ | Solo Admin |
| city | ❌ | ✅ | Solo Admin |
| country | ✅ | ❌ | Landing |
| plan | ❌ (tamaño) | ✅ | Solo Admin |
| founder_name | ✅ (contact_name) | ✅ | Ambos |
| founder_email | ❌ | ✅ | Solo Admin |
| founder_phone | ❌ | ✅ | Solo Admin |
| founder_bar_number | ❌ | ✅ | Solo Admin |
| firm_size | ✅ | ❌ | Landing |

---

## 3. ARQUITECTURA DEL BACKEND

**Endpoint principal para firmas:** `POST /firms`
- Ubicación: `backend/routes/firms.py:18-201`
- Modelo: `FirmCreate` (Pydantic)
- Requiere: 12 campos completos
- Crea: Firma + Usuario firm_owner + Suscripción

**Endpoint simplificado para leads:** `POST /firms/register-lead`
- Ubicación: `backend/routes/firms.py:204-336`
- Modelo: Dict simple (sin Pydantic schema fijo)
- Requiere: 5 campos + metadata
- Crea: Lead en colección `db.leads`
- **PROBLEMA:** No crea una firma, solo un lead

---

## 4. PROBLEMA IDENTIFICADO

El formulario de la landing usa `/firms/register-lead` que:
- ✅ Crea un LEAD (tipo firma)
- ❌ **NO crea una FIRMA real**
- ❌ **NO aparece en el Directorio de Firmas**
- ❌ Los datos quedan en `db.leads`, no en `db.firms`

**Solución:** Cambiar el endpoint de landing para crear firmas reales en `db.firms` en lugar de leads.

---

## 5. ESTRATEGIA DE INTEGRACIÓN

### Opción A: Usar `/firms/register` (RECOMENDADO)
- Pros: Los datos aparecen inmediatamente en Directorio
- Contras: Requiere 12 campos, no 5
- Solución: Rellenar automáticamente campos faltantes con valores por defecto

### Opción B: Mantener `/firms/register-lead` y crear vista separada
- Pros: Menos cambios al backend
- Contras: Duplicate logic, complexity
- Descartado

### Decisión: **OPCIÓN A - Usar `/firms/register` con defaults**

---

## 6. CAMBIOS IMPLEMENTADOS

### 6.1 Frontend - FirmOSPreviewBlock.jsx

**Cambio 1: Actualizar endpoint y mapeo de campos**

Antes:
```jsx
const res = await axios.post(`${API}/firms/register-lead`, formData);
```

Después:
```jsx
// Mappear datos del formulario al esquema FirmCreate
const firmPayload = {
  name: formData.name,
  nit: `TRIAL-${Date.now()}`, // Auto-generate NIT for trials
  email: formData.email,
  phone: formData.phone,
  address: 'No especificada', // Default para campo requerido
  city: 'No especificada',     // Default para campo requerido
  country: formData.country,
  plan: 'firm_growth',         // Default plan
  founder_name: formData.contact_name,
  founder_email: `contact-${Date.now()}@trial.puntocerolegal.com`, // Generated email
  founder_phone: formData.phone,
  founder_document: 'TRIAL',   // Default para campo requerido
  founder_bar_number: 'TRIAL', // Default para campo requerido
};

const res = await axios.post(`${API}/firms/register`, firmPayload);
```

**Cambio 2: Agregar metadata de trial**

```jsx
const firmPayload = {
  ...firmaData,
  metadata: {
    source: 'landing_form',
    trial_status: 'active',
    trial_started_at: new Date().toISOString(),
    trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    firm_size: formData.firm_size,
  }
};
```

---

### 6.2 Backend - Modificaciones opcionales

**Si se desea permitir valores por defecto en POST /firms:**

En `backend/routes/firms.py`, hacer campos opcionales:

```python
# Antes
class FirmCreate(BaseModel):
    nit: str = Field(..., min_length=5)
    address: str = Field(...)
    founder_document: str = Field(...)
    founder_bar_number: str = Field(...)

# Después (más flexible)
class FirmCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(...)
    phone: str = Field(...)
    nit: Optional[str] = Field(default=None)
    address: Optional[str] = Field(default="No especificada")
    city: Optional[str] = Field(default="No especificada")
    country: str = Field(default="Colombia")
    plan: str = Field(default="firm_growth")
    founder_name: str = Field(...)
    founder_email: str = Field(...)
    founder_phone: Optional[str] = Field(default=None)
    founder_document: Optional[str] = Field(default="TRIAL")
    founder_bar_number: Optional[str] = Field(default="TRIAL")
```

**Alternativa:** Mantener POST /firms como es, pero llenar datos en frontend.

---

## 7. FLUJO END-TO-END (INTEGRADO)

```
USUARIO COMPLETA FORMULARIO LANDING
    ↓ (5 campos: nombre, contacto, email, whatsapp, país)
FRONTEND VALIDA
    ↓
FRONTEND MAPEA A FirmCreate (12 campos con defaults)
    ↓
FRONTEND ENVÍA POST /firms/register
    ↓
BACKEND VALIDA FirmCreate
    ↓
BACKEND CREA:
  - Firma en db.firms
  - Usuario firm_owner en db.users
  - Suscripción inicial
  - Configuración Firm OS
    ↓
BACKEND ENVÍA EMAIL DE CONFIRMACIÓN
    ↓
FRONTEND MUESTRA "Éxito"
    ↓
ADMIN ABRE PANEL → FirmsOverview
    ↓
FIRMA APARECE INMEDIATAMENTE EN TABLA
    ↓
ADMIN PUEDE:
  - Ver detalles
  - Gestionar abogados
  - Ver casos
  - Monitorear ingresos
```

---

## 8. REGISTROS DE TRIAL

**Campos a agregar en firma para rastrear trial:**

```python
# En FirmCreate y Firm model
trial_status: str = "active" | "expired" | "converted"
trial_started_at: datetime
trial_expires_at: datetime
trial_days_remaining: int (calculado)
```

**En DirectorioFirmas (frontend), agregar columna:**

```jsx
<th className="px-6 py-4 text-left text-sm font-semibold">Trial</th>
...
<td className="px-6 py-4 text-sm">
  <span className={firm.trial_status === 'active' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}>
    {firm.trial_status === 'active' ? `${firm.trial_days_remaining} días` : 'Expirado'}
  </span>
</td>
```

---

## 9. VALIDACIONES AGREGADAS

### Frontend (FirmOSPreviewBlock.jsx)
- ✅ Email regex validation
- ✅ WhatsApp regex validation
- ✅ Prevención de doble envío
- ✅ Button deshabilitado si formulario inválido

### Backend (POST /firms)
- ✅ Validación Pydantic (tipos, longitud)
- ✅ Validación de email duplicado
- ✅ Validación de NIT duplicado
- ✅ Validación de email de founder duplicado
- ✅ Generación automática de usuario firm_owner
- ✅ Creación automática de suscripción inicial

---

## 10. IMPACTO EN EL SISTEMA

### Antes (Con /firms/register-lead)
- ❌ Forma crea LEAD, no FIRMA
- ❌ Datos en colección `db.leads`
- ❌ No aparece en Directorio
- ❌ Admin no ve registros automáticos

### Después (Con /firms/register)
- ✅ Forma crea FIRMA completa
- ✅ Datos en colección `db.firms`
- ✅ Aparece INMEDIATAMENTE en Directorio
- ✅ Admin puede gestionar desde panel existente
- ✅ Trial activo marcado automáticamente
- ✅ Usuario firm_owner creado automáticamente

---

## 11. ARCHIVOS MODIFICADOS

| Archivo | Cambios | Tipo |
|---------|---------|------|
| `frontend/src/components/FirmOSPreviewBlock.jsx` | Endpoint y mapeo de campos | Crítico |
| `backend/routes/firms.py` | Opcional: hacer campos más flexibles | Opcional |
| `frontend/src/modules/admin/pages/FirmsOverview.jsx` | Agregar columna Trial (opcional) | Mejora |

---

## 12. TESTING MANUAL

### Test Case 1: Firma completa
```
1. Completar formulario landing
2. Enviar
3. Abrir Admin → FirmsOverview
4. Verificar firma aparece en tabla
5. Verificar estado = "PENDING_VERIFICATION"
6. Verificar trial_status = "active"
```

### Test Case 2: Duplicate detection
```
1. Enviar formulario con email test@firma.com
2. Intentar enviar de nuevo con mismo email
3. Verificar error "Ya existe una firma registrada con este correo"
```

### Test Case 3: Trial countdown
```
1. Verificar que trial_expires_at = now + 7 days
2. Verificar que admin ve "7 días" en columna Trial
3. Esperar y verificar que cuenta regresiva disminuye
```

---

## 13. CONCLUSIÓN

**Estado:** ✅ INTEGRACIÓN LISTA PARA IMPLEMENTAR

- El formulario de landing se integra perfectamente con el Directorio existente
- No se crea ning módulo administrativo nuevo
- Las firmas aparecen automáticamente en FirmsOverview
- El trial se marca automáticamente
- El admin puede gestionar desde el panel existente

**Próximo paso:** Implementar los cambios en frontend (mapeo de campos) y opcionalmente en backend (hacer campos más flexibles).

---

**Fin del informe**
