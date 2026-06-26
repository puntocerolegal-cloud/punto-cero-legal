git add -A
git commit -m "refactor: Alinear con arquitectura oficial de Punto Cero Legal

CAMBIOS ARQUITECTONICOS:

1. Eliminar acceso operativo Admin OS -> Firm OS
   - Remover botones Dashboard y Entrar de FirmsOverview
   - Firma OS ahora es completamente independiente
   - Admin OS es solo supervision

2. Eliminar endpoint impersonate
   - POST /firms/{firm_id}/impersonate eliminado
   - No existe mecanismo para admin entrar como firma
   - Respeta principio de aislamiento

3. Mantener infraestructura común
   - Sistema de autenticacion intacto
   - JWT, sesiones, sincronizacion activas
   - Multi-tenancy preservado
   - RBAC preservado

4. Directorio de Firmas como supervision
   - Boton Ver Detalles para informacion ejecutiva
   - Sin acceso a operacion interna
   - Lectura de metricas solamente

RESULTADOS:
- Admin OS (supervision) aislado completamente
- Lawyer OS (independiente) intacto
- Firm OS (independiente) intacto
- User OS (independiente) intacto
- Arquitectura congelada y lista para produccion"

git push origin main
