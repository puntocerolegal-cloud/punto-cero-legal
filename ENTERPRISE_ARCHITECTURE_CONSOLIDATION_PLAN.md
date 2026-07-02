# ENTERPRISE_ARCHITECTURE_CONSOLIDATION_PLAN

## Objetivo

Consolidar la separación arquitectónica entre Lawyer OS, Firm OS y Admin OS sin modificar el comportamiento funcional del sistema, sin introducir nuevas funcionalidades y sin tocar el backend.

## Principio rector

La arquitectura debe pasar de una estructura de shells inicial a un modelo de dominios con:

- shells independientes por producto,
- un Shared Kernel común y controlado,
- providers separados por dominio,
- un sistema de autorización desacoplado de la navegación,
- lazy loading por dashboard y por ruta.

No se aplicarán cambios en esta fase. Este documento define la ruta de implementación segura para la siguiente fase.

---

## 1. Estado actual de la arquitectura

### Estado observado

- Existen shells separadas para Lawyer, Firm y Admin en [frontend/src/shells/lawyer/LawyerShell.jsx](frontend/src/shells/lawyer/LawyerShell.jsx), [frontend/src/shells/firm/FirmShell.jsx](frontend/src/shells/firm/FirmShell.jsx) y [frontend/src/shells/admin/AdminShell.jsx](frontend/src/shells/admin/AdminShell.jsx).
- El enrutador principal en [frontend/src/App.js](frontend/src/App.js) ya deriva las rutas a esas shells.
- La separación de registries también existe en [frontend/src/shells/lawyer/lawyerRegistry.js](frontend/src/shells/lawyer/lawyerRegistry.js), [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) y [frontend/src/shells/admin/adminRegistry.js](frontend/src/shells/admin/adminRegistry.js).
- La arquitectura aún conserva acoplamiento estructural porque Firm OS reutiliza componentes heredados de Lawyer OS.
- Los providers siguen siendo globales en [frontend/src/contexts/AuthContext.jsx](frontend/src/contexts/AuthContext.jsx), [frontend/src/contexts/SubscriptionContext.jsx](frontend/src/contexts/SubscriptionContext.jsx) y [frontend/src/contexts/CaseContext.jsx](frontend/src/contexts/CaseContext.jsx).
- El Shared Kernel existe de forma incipiente en [frontend/src/shared](frontend/src/shared), pero aún no es el origen único de la base común de layout, navegación y módulos reutilizables.

### Conclusión del estado actual

La separación es visible, pero no es todavía completa. La arquitectura sigue siendo parcialmente heredada y requiere una consolidación de capas antes de continuar con nuevas funcionalidades.

---

## 2. Dependencias restantes

### Dependencias directas de Firm OS hacia Lawyer OS

| Origen | Destino | Tipo | Clasificación propuesta |
|---|---|---|---|
| [frontend/src/modules/firm-os/FirmOSLayout.jsx](frontend/src/modules/firm-os/FirmOSLayout.jsx) | [frontend/src/components/DashboardLayout.jsx](frontend/src/components/DashboardLayout.jsx) | Layout base | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/DashboardHome.jsx](frontend/src/pages/DashboardHome.jsx) | Reutilización de pantalla base | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/dashboard/CRMPage.jsx](frontend/src/pages/dashboard/CRMPage.jsx) | Reutilización de módulo jurídico | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/dashboard/CasesPage.jsx](frontend/src/pages/dashboard/CasesPage.jsx) | Reutilización de módulo jurídico | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/dashboard/ClientsPage.jsx](frontend/src/pages/dashboard/ClientsPage.jsx) | Reutilización de módulo jurídico | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/dashboard/AgendaPage.jsx](frontend/src/pages/dashboard/AgendaPage.jsx) | Reutilización de módulo jurídico | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/dashboard/AIPage.jsx](frontend/src/pages/dashboard/AIPage.jsx) | Reutilización de módulo jurídico | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/dashboard/MeetingsPage.jsx](frontend/src/pages/dashboard/MeetingsPage.jsx) | Reutilización de módulo jurídico | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/dashboard/InvoicesPage.jsx](frontend/src/pages/dashboard/InvoicesPage.jsx) | Reutilización de módulo jurídico | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/dashboard/DocumentsPage.jsx](frontend/src/pages/dashboard/DocumentsPage.jsx) | Reutilización de módulo jurídico | Mover a Shared |
| [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx) | [frontend/src/pages/dashboard/SettingsPage.jsx](frontend/src/pages/dashboard/SettingsPage.jsx) | Reutilización de módulo jurídico | Mover a Shared |
| [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) | [frontend/src/pages/dashboard/CRMPage.jsx](frontend/src/pages/dashboard/CRMPage.jsx) | Registry de Firm reutiliza página de Lawyer | Mover a Shared |
| [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) | [frontend/src/pages/dashboard/CasesPage.jsx](frontend/src/pages/dashboard/CasesPage.jsx) | Registry de Firm reutiliza página de Lawyer | Mover a Shared |
| [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) | [frontend/src/pages/dashboard/ClientsPage.jsx](frontend/src/pages/dashboard/ClientsPage.jsx) | Registry de Firm reutiliza página de Lawyer | Mover a Shared |
| [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) | [frontend/src/pages/dashboard/AgendaPage.jsx](frontend/src/pages/dashboard/AgendaPage.jsx) | Registry de Firm reutiliza página de Lawyer | Mover a Shared |
| [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) | [frontend/src/pages/dashboard/AIPage.jsx](frontend/src/pages/dashboard/AIPage.jsx) | Registry de Firm reutiliza página de Lawyer | Mover a Shared |
| [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) | [frontend/src/pages/dashboard/MeetingsPage.jsx](frontend/src/pages/dashboard/MeetingsPage.jsx) | Registry de Firm reutiliza página de Lawyer | Mover a Shared |
| [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) | [frontend/src/pages/dashboard/InvoicesPage.jsx](frontend/src/pages/dashboard/InvoicesPage.jsx) | Registry de Firm reutiliza página de Lawyer | Mover a Shared |
| [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) | [frontend/src/pages/dashboard/DocumentsPage.jsx](frontend/src/pages/dashboard/DocumentsPage.jsx) | Registry de Firm reutiliza página de Lawyer | Mover a Shared |
| [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js) | [frontend/src/pages/dashboard/SettingsPage.jsx](frontend/src/pages/dashboard/SettingsPage.jsx) | Registry de Firm reutiliza página de Lawyer | Mover a Shared |

### Clasificación general

- Mantener: componentes que son estrictamente propios de cada shell y no deben compartirse.
- Mover a Shared: los módulos transversales de operaciones jurídicas, layout base, shell primitives, navegación base y componentes de estado compartido.
- Eliminar: cualquier dependencia de una shell hacia otra que no sea un contrato formal de dominio. En el estado actual no se detecta un caso claro de eliminación inmediata; el punto crítico es reemplazar el heredado por un diseño shared.

---

## 3. Mapa completo de imports entre dashboards

### A. Lawyer OS

- [frontend/src/shells/lawyer/LawyerShell.jsx](frontend/src/shells/lawyer/LawyerShell.jsx)
  - importa [frontend/src/components/DashboardLayout.jsx](frontend/src/components/DashboardLayout.jsx)
  - importa [frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx)
  - importa [frontend/src/components/commerce/FeatureGate.jsx](frontend/src/components/commerce/FeatureGate.jsx)
- [frontend/src/shells/lawyer/lawyerRegistry.js](frontend/src/shells/lawyer/lawyerRegistry.js)
  - importa páginas de dashboard desde [frontend/src/pages](frontend/src/pages)

### B. Firm OS

- [frontend/src/shells/firm/FirmShell.jsx](frontend/src/shells/firm/FirmShell.jsx)
  - importa [frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx)
  - importa [frontend/src/modules/firm-os/FirmOSLayout.jsx](frontend/src/modules/firm-os/FirmOSLayout.jsx)
- [frontend/src/shells/firm/firmRegistry.js](frontend/src/shells/firm/firmRegistry.js)
  - importa páginas de dashboard desde [frontend/src/pages](frontend/src/pages)
  - importa módulos específicos de Firm desde [frontend/src/modules/firm-os](frontend/src/modules/firm-os)
- [frontend/src/modules/firm-os/FirmOSLayout.jsx](frontend/src/modules/firm-os/FirmOSLayout.jsx)
  - importa [frontend/src/components/DashboardLayout.jsx](frontend/src/components/DashboardLayout.jsx)
- [frontend/src/modules/firm-os/FirmOSModule.jsx](frontend/src/modules/firm-os/FirmOSModule.jsx)
  - importa páginas de Lawyer y módulos específicos de Firm

### C. Admin OS

- [frontend/src/shells/admin/AdminShell.jsx](frontend/src/shells/admin/AdminShell.jsx)
  - importa [frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx)
  - importa [frontend/src/modules/admin/AdminOSLayout.jsx](frontend/src/modules/admin/AdminOSLayout.jsx)
- [frontend/src/shells/admin/adminRegistry.js](frontend/src/shells/admin/adminRegistry.js)
  - importa páginas y módulos propios de Admin desde [frontend/src/modules/admin](frontend/src/modules/admin)

### D. Cross-domain observations

- No hay importaciones directas de Admin a Lawyer ni de Admin a Firm en el sentido de navegación o shell.
- Sí existe una relación de acoplamiento estructural de Firm hacia Lawyer mediante páginas y layout compartidos.
- El acoplamiento de dominio más fuerte está en la frontera entre Firm y Lawyer, no en Admin.

---

## 4. Shared Kernel definitivo

### Objetivo

Crear una base compartida de arquitectura que no dependa de un dashboard concreto, sino de un contrato de dominio común.

### Componentes que deben conformar el Shared Kernel

#### 4.1 Shell primitives

Estos elementos deben vivir en Shared porque son reutilizables por los tres dashboards:

- layout base de shell,
- header base,
- sidebar base,
- navigation model,
- shell container,
- loading/error boundaries,
- route transition wrapper.

#### 4.2 Domain modules transversales

Los módulos que son compartidos por Lawyer y Firm deben desplazarse a Shared para evitar que Firm dependa de Lawyer:

- CRM,
- Cases,
- Clients,
- Agenda,
- AI,
- Meetings,
- Invoices,
- Documents,
- Settings,
- DashboardHome.

#### 4.3 Componentes de UI reutilizables

La carpeta [frontend/src/shared](frontend/src/shared) ya es el lugar correcto para:

- componentes presentacionales,
- gráficos,
- tablas,
- badges,
- timeline,
- empty states,
- confirm dialogs,
- audit log.

#### 4.4 Contratos de dominio

El Shared Kernel debe exponer contratos, no dependencias concretas de dashboard. Ejemplo:

- ShellContract
- NavigationItem
- DashboardRouteConfig
- ModuleDescriptor
- DomainFeatureFlag

### Diseño propuesto

- El Shared Kernel será el único origen de los componentes transversales.
- Cada dashboard tendrá su propia shell, pero no su propio núcleo visual heredado.
- Firm OS dejará de importar páginas de Lawyer directamente y pasará a consumir un contrato shared del mismo módulo.

### Qué NO se moverá en esta fase

- No se moverán archivos físicamente todavía.
- Se priorizará primero el diseño del contrato y el adapter layer para evitar romper rutas.

---

## 5. Providers definitivos

### Objetivo

Separar el estado de la interfaz por dominio sin romper el comportamiento actual.

### Propuesta de diseño

#### 5.1 Providers globales obligatorios

- AuthProvider: debe permanecer global y seguir siendo el punto de entrada de autenticación.
- ThemeProvider o AppShellProvider: opcional, solo si el diseño lo requiere; no es prioritario en esta fase.

#### 5.2 Providers por dominio

- LawyerProvider: estado propio del workspace jurídico, contexto de expediente, navegación legal, filtros del dashboard.
- FirmProvider: estado de firma, estructura organizacional, automatización, operaciones empresariales.
- AdminProvider: estado de administración, operaciones globales, seguridad y auditoría.

#### 5.3 Provider de shell o workspace

Cada shell debe envolver sus rutas con un provider de shell que combine:

- auth context global,
- provider de dominio,
- provider de suscripción o entitlement,
- provider de contexto de workspace.

### Reglas de diseño

- Auth no debe ser reemplazado ni duplicado.
- Cada dashboard debe leer y escribir solo el estado que le corresponde.
- No debe haber estado compartido entre dashboards a través de un provider común sin contrato explícito.

### Riesgo actual

Actualmente [frontend/src/App.js](frontend/src/App.js) monta providers globales que se usan desde todos los dashboards. Eso es correcto para la sesión, pero insuficiente para un aislamiento completo de estado.

---

## 6. Estrategia de ProtectedRoute

### Problema actual

[frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx) concentra:

- validación de sesión,
- validación de rol,
- reglas de redirección,
- control de verificación,
- lógica de acceso por ruta.

### Diseño definitivo

ProtectedRoute debe convertirse en un componente de orquestación, no en un componente de negocio.

### Estructura propuesta

1. Un componente base de autenticación:
   - valida sesión,
   - valida verificación,
   - deja el acceso a la ruta si el usuario está autenticado.

2. Un componente de autorización por dominio:
   - recibe un contract de permisos,
   - decide si el usuario puede entrar a un dashboard específico.

3. Un componente de redirección por shell:
   - si la ruta es de Lawyer y el usuario es admin, redirige a Admin.
   - si la ruta es de Firm y el usuario no tiene rol de firma, redirige a la landing o al dashboard correcto.

### Regla de diseño

- ProtectedRoute no debe contener lógica de negocio de cada dashboard.
- Cada dashboard debe declarar su propio contrato de acceso.
- La redirección debe ser configurable desde la shell, no desde un componente global de propósito múltiple.

### Resultado esperado

- Menos acoplamiento.
- Mejor trazabilidad del acceso.
- Menor riesgo de romper rutas al cambiar reglas de rol.

---

## 7. Estrategia de Lazy Loading

### Estado actual

No se detecta uso de React.lazy ni de lazy loading por ruta. Los shells cargan el árbol completo de la aplicación de forma eager.

### Estrategia definitiva

Implementar lazy loading por dashboard y por ruta en tres niveles:

#### 7.1 Lazy loading por shell

- LawyerShell se carga bajo demanda al entrar a /dashboard.
- FirmShell se carga bajo demanda al entrar a /firm-os.
- AdminShell se carga bajo demanda al entrar a /admin.

#### 7.2 Lazy loading por módulo

- Los módulos de Firm y Admin que no son esenciales para la carga inicial deben cargarse cuando el usuario navega a esa ruta.
- Los módulos transversales como CRM o Cases pueden cargarse bajo demanda si no son la ruta inicial.

#### 7.3 Lazy loading por feature flag

- Las features comerciales o verticales nuevas no deben cargarse de forma inmediata si el usuario no las necesita.

### Recomendación de implementación

- Introducir React.lazy solo en los puntos de entrada de shell o de routes pesadas.
- Mantener un fallback simple y consistente.
- Evitar lazy loading excesivo para rutas críticas que deben responder inmediatamente.

### Impacto esperado

- Menor tiempo de carga inicial.
- Menor bundle inicial.
- Mejor percepción de rendimiento.

---

## 8. Orden exacto de implementación

### Fase 0 — Preparación

1. Crear contratos de shell y de módulo compartido.
2. Definir los adapters de rutas para cada dashboard.
3. Asegurar que las rutas actuales sigan funcionando sin cambios de comportamiento.

### Fase 1 — Shared Kernel

4. Definir la base de shell shared.
5. Definir la base de navegación shared.
6. Definir los módulos transversales como parte del Shared Kernel.
7. Sin mover archivos todavía, introducir re-export adapters que permitan consumir los mismos módulos desde una capa shared.

### Fase 2 — Providers

8. Separar providers por dominio.
9. Encapsular el estado de workspace en providers por shell.
10. Mantener Auth global y estable.

### Fase 3 — ProtectedRoute

11. Reemplazar la lógica de ProtectedRoute por un modelo compuesto.
12. Mover la lógica de roles y redirecciones a contratos de shell y permisos.

### Fase 4 — Lazy Loading

13. Aplicar lazy loading por shell.
14. Aplicar lazy loading por ruta para módulos pesados.
15. Medir impacto de bundle y carga.

### Fase 5 — Validación

16. Validar login, logout, cambio de rol, deep links, refresh y 404.
17. Confirmar compatibilidad de /dashboard, /firm-os y /admin.
18. Confirmar que no haya regresiones funcionales.

---

## 9. Riesgos

### Riesgo 1 — romper rutas existentes

La mayor amenaza es modificar la estructura de imports o de providers sin mantener compatibilidad de rutas.

### Riesgo 2 — acoplamiento invisible

Algunos módulos parecen compartidos, pero en realidad siguen ligados al layout o al estado del dashboard específico.

### Riesgo 3 — sobre-abstractación

Si el Shared Kernel se diseña demasiado pronto, puede convertirse en una capa innecesariamente pesada y difícil de mantener.

### Riesgo 4 — cambios de comportamiento en auth

La lógica de ProtectedRoute y Auth tiene impacto directo sobre acceso, redirección y login.

### Riesgo 5 — performance regresiva

Si el lazy loading se aplica de forma incorrecta, podría empeorar la experiencia de carga.

---

## 10. Tiempo estimado

### Tiempo estimado total

- Planeación y diseño técnico: 1 día
- Implementación segura del Shared Kernel y adapters: 2 a 3 días
- Providers y ProtectedRoute: 1 a 2 días
- Lazy loading y validación: 1 día

### Total estimado

4 a 7 días de trabajo controlado, con validación en cada fase.

---

## 11. Impacto esperado

### Impacto positivo

- Menor acoplamiento entre shells.
- Mejor mantenimiento del código.
- Menos riesgo de regresiones al agregar o modificar módulos.
- Mejor escalabilidad para futuras extensiones.
- Mejor base para performance y lazy loading.

### Impacto de riesgo

- Requiere cambios estructurales en el enrutado y en la forma en que se consumen varios módulos.
- Debe ejecutarse de forma incremental y con validación de rutas en cada paso.

---

## Recomendación final

La siguiente fase debe enfocarse en consolidar la arquitectura antes de introducir mejoras funcionales o módulos nuevos. El objetivo debe ser transformar la separación de shells en una arquitectura real de dominios, con Shared Kernel, providers desacoplados, ProtectedRoute modularizado y lazy loading por dashboard.

No se aplicarán cambios en esta fase. Este documento sirve como guía técnica para la siguiente implementación controlada.
