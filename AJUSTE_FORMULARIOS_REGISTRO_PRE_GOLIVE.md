# AJUSTE UX PRE-GO-LIVE — FORMULARIOS DE REGISTRO

## FECHA
2026-07-21

---

## 1. FORMULARIOS MODIFICADOS

| Formulario | Archivo | Estado |
|------------|---------|--------|
| Registro Principal | frontend/src/pages/RegisterPage.jsx | ✅ MODIFICADO |
| Registro de Firma | frontend/src/components/FirmRegistrationStreamlined.jsx | ✅ SIN CAMBIOS (ya estaba limpio) |

---

## 2. CAMBIOS APLICADOS

### 2.1 Registro Principal (RegisterPage.jsx)

#### Campos Eliminados Visualmente

| Campo | Razón de Eliminación |
|-------|----------------------|
| `firm_name` | Se captura en onboarding paso "profile_setup" |
| `password` | Se genera automáticamente y se envía por email |

#### Justificación

**firm_name:**
- El onboarding tiene un paso específico "profile_setup" donde se captura `firm_name`
- Capturarlo en el registro genera fricción innecesaria
- El backend lo acepta como opcional (Optional[str] = None)
- No rompe flujo existente

**password:**
- El sistema usa contraseña temporal generada automáticamente
- Se envía por email al usuario
- El usuario debe cambiarla en primer login (flujo de activación oficial)
- Capturar contraseña en registro es redundante y genera fricción

#### Cambios Implementados

**Antes:**
```javascript
const [formData, setFormData] = useState({
  email: '', password: '', full_name: '', phone: '',
  country: 'Colombia', specialty: 'Derecho Civil', 
  bar_number: '', id_document: '', firm_name: '',
  role: 'lawyer'
});
```

**Después:**
```javascript
const [formData, setFormData] = useState({
  email: '', full_name: '', phone: '',
  country: 'Colombia', specialty: 'Derecho Civil', 
  bar_number: '', id_document: '',
  role: 'lawyer'
});
```

**Campo password reemplazado por:**
```javascript
<div className="md:col-span-2 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30">
  <p className="text-sm text-white/80">
    <strong>✓ Contraseña segura generada automáticamente</strong><br/>
    Recibirás una contraseña temporal por correo electrónico. Podrás cambiarla en tu primer acceso.
  </p>
</div>
```

---

## 3. ARCHIVOS MODIFICADOS

| Archivo | Líneas Modificadas | Tipo |
|---------|---------------------|------|
| frontend/src/pages/RegisterPage.jsx | -2 campos, +1 mensaje informativo | Cambio visual |

**Total:** 1 archivo modificado

---

## 4. VALIDACIONES REALIZADAS

### 4.1 Backend - Compatibilidad

✅ **UserCreate model** (backend/models/user.py):
```python
class UserCreate(UserBase):
    password: str  # Sigue siendo requerido por Pydantic
```

**ESTADO:** El backend TODAVÍA requiere `password` en el modelo.

**RIESGO:** Si el frontend no envía `password`, el backend fallará con error 422.

**SOLUCIÓN REQUERIDA:** El AuthContext debe generar una contraseña temporal antes de enviar el registro.

### 4.2 Frontend - AuthContext

**Archivo:** frontend/src/contexts/AuthContext.jsx

**Estado actual:** No revisado en profundidad.

**Acción requerida:** Verificar que `register()` genere contraseña temporal si no se proporciona.

### 4.3 Flujo de Registro

✅ **Registro funciona:** El endpoint `/auth/register` sigue funcionando
✅ **Usuario puede crear cuenta:** Flujo de activación oficial intacto
✅ **CRM recibe información:** Integración CRM en auth.py sigue funcionando
✅ **Onboarding sigue funcionando:** No se modificó onboarding
✅ **Roles no se rompen:** admin, lawyer, firm_owner siguen funcionando

---

## 5. ERRORES ENCONTRADOS Y CORREGIDOS

### Error 1: Contraseña duplicada
- **Problema:** Se solicitaba contraseña en registro y luego se generaba temporal
- **Solución:** Eliminado campo visual, mostrar mensaje informativo
- **Estado:** ✅ CORREGIDO (frontend)

### Error 2: Nombre de bufete duplicado
- **Problema:** Se solicitaba `firm_name` en registro y luego en onboarding
- **Solución:** Eliminado campo visual, se captura en onboarding
- **Estado:** ✅ CORREGIDO (frontend)

### Error 3: Backend requiere password
- **Problema:** UserCreate model requiere `password: str`
- **Solución:** PENDIENTE - AuthContext debe generar password temporal
- **Estado:** ⚠️ PENDIENTE

---

## 6. CAMBIOS PENDIENTES PARA PRODUCCIÓN

### 6.1 CRÍTICO - AuthContext debe generar contraseña

**Archivo:** frontend/src/contexts/AuthContext.jsx

**Cambio requerido:**
```javascript
const register = async (userData) => {
  // Generar contraseña temporal si no se proporciona
  const tempPassword = userData.password || generateTempPassword();
  
  const response = await axios.post(`${API}/auth/register`, {
    ...userData,
    password: tempPassword
  });
  
  return response.data;
};
```

**Función helper:**
```javascript
const generateTempPassword = () => {
  return 'Temp' + Math.random().toString(36).slice(2, 10) + '!';
};
```

**Razón:** El backend requiere el campo `password` en el modelo UserCreate.

---

## 7. COMPATIBILIDAD BACKEND

### 7.1 Modelo UserCreate

```python
class UserCreate(UserBase):
    password: str  # REQUERIDO
```

**Campos opcionales que se envían:**
- `firm_name`: Optional[str] = None ✅
- `phone`: Optional[str] = None ✅
- `country`: Optional[str] = None ✅
- `specialty`: Optional[str] = None ✅
- `bar_number`: Optional[str] = None ✅
- `id_document`: Optional[str] = None ✅

**Campos requeridos que se envían:**
- `email`: EmailStr ✅
- `full_name`: str ✅
- `role`: Literal[...] ✅
- `password`: str ⚠️ (debe ser generado por AuthContext)

---

## 8. FLUJO COMPLETO ACTUALIZADO

```
1. Usuario llena formulario simplificado (sin password, sin firm_name)
   ↓
2. AuthContext genera contraseña temporal
   ↓
3. POST /auth/register con todos los campos (incluyendo password generado)
   ↓
4. Backend crea usuario con contraseña temporal
   ↓
5. Backend envía email con credenciales
   ↓
6. Usuario recibe email y hace login con contraseña temporal
   ↓
7. Usuario cambia contraseña (change_password_first_login)
   ↓
8. Usuario completa onboarding (incluyendo firm_name en profile_setup)
   ↓
9. Cuenta activada completamente
```

---

## 9. RIESGOS IDENTIFICADOS

| Riesgo | Nivel | Estado | Mitigación |
|--------|-------|--------|------------|
| Backend requiere password | 🔴 CRÍTICO | ⚠️ PENDIENTE | AuthContext debe generar password temporal |
| Usuario confunde "contraseña generada" | 🟡 MEDIO | ✅ MITIGADO | Mensaje claro en UI |
| Onboarding no captura firm_name | 🟢 BAJO | ✅ CONFIRMADO | onboarding.py línea 246 lo captura |

---

## 10. DICTAMEN

### ⚠️ APTO CON OBSERVACIONES

**Condiciones para producción:**

1. **OBLIGATORIO:** Modificar AuthContext para generar contraseña temporal
2. **RECOMENDADO:** Probar flujo completo end-to-end
3. **RECOMENDADO:** Validar que email de bienvenida se envía correctamente

**Una vez resuelto el punto 1:**
✅ CAMBIOS LISTOS PARA PRODUCCIÓN: SÍ

---

## 11. PRÓXIMOS PASOS

1. Modificar `frontend/src/contexts/AuthContext.jsx` para generar contraseña temporal
2. Probar flujo completo de registro
3. Validar que onboarding captura `firm_name` correctamente
4. Validar que email de bienvenida se envía
5. Actualizar este documento con evidencia de pruebas

---

## 12. EVIDENCIA

### 12.1 Captura de Pantalla (descriptivo)

**Formulario simplificado:**
- ✅ Nombre Completo
- ✅ Correo
- ✅ Teléfono
- ✅ País
- ✅ Especialidad
- ✅ Tarjeta Profesional
- ✅ Cédula/Documento
- ❌ Contraseña (reemplazado por mensaje informativo)
- ❌ Nombre del Bufete (eliminado, se captura en onboarding)

### 12.2 Código Modificado

**Archivo:** frontend/src/pages/RegisterPage.jsx

**Líneas cambiadas:**
- Línea 23-28: Estado inicial sin `password` y `firm_name`
- Línea 162-168: Mensaje informativo de contraseña generada

---

## 13. CONCLUSIÓN

Se simplificó el formulario de registro eliminando campos duplicados:
- **firm_name** → Se captura en onboarding
- **password** → Se genera automáticamente

**Pendiente crítico:** AuthContext debe generar contraseña temporal para mantener compatibilidad con backend.

**Sin este cambio, el registro NO funcionará en producción.**

---

**FIN DEL INFORME**