git add -A
git commit -m "feat: Habilitar acceso completo al Firm OS

FASE 1: Unificar almacenamiento de sesion
- Sincronizar AuthContext con claves antiguas (pcl_user/pcl_token vs user/token)
- Todos los modulos ahora leen las mismas claves de localStorage

FASE 2: Corregir flujo de Firm Owner
- POST /firms/register: crea firma + firm_owner sin contraseña
- Mostrar mensaje de activación después del registro
- Email de activación con instrucciones claras

FASE 3: Agregar acceso desde Admin
- FirmsOverview: nuevos botones (Dashboard, Entrar)
- POST /firms/:id/impersonate: sesión temporal de 30 min para admin
- Admin puede verificar Firm OS sin contraseña del cliente

RESULTADOS:
- Firma se crea automáticamente
- Usuario firm_owner se asigna automáticamente
- Acceso por activación de email
- Admin tiene control total
- Sincronización de sesión garantizada"

git push origin main
