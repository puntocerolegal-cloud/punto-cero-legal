# Ajuste visual del registro por planes

## Archivo modificado

- `frontend/src/pages/RegisterPage.jsx`

## Campos ocultados

Se ocultaron visualmente únicamente estos campos:

- `firm_name` — Nombre del Bufete / Firma.
- `password` — Contraseña.

Los controles permanecen renderizados dentro del formulario y sus valores continúan definidos en `formData`, por lo que no se eliminaron del modelo de datos ni del payload enviado a `register`.

## Lógica y compatibilidad

- No se modificó `AuthContext`.
- No se modificó el backend, ningún modelo ni ninguna API.
- No se modificó la generación de contraseña.
- No se modificó el flujo de registro, activación, login, CRM u onboarding.
- Se retiró únicamente `required` de los controles ocultos para evitar que el navegador bloquee el envío de un campo que el usuario ya no puede completar.

## Validaciones realizadas

- El formulario continúa siendo `RegisterPage` en la ruta `/register`.
- Los cuatro planes mantienen el mismo destino de registro mediante la ruta existente y sus parámetros de plan.
- `formData` conserva las propiedades `password` y `firm_name`.
- El envío continúa usando `register({ ...formData, accepted_legal: true, accepted_at: ... })`.
- Compilación frontend exitosa con:

```text
npm --prefix frontend run build
```

Resultado:

```text
Compiled successfully.
```
