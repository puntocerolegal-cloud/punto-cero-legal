# JWT Runtime Fix - Task Progress

- [x] Audit all JWT creation/validation locations
- [x] Identify hardcoded fallback secrets
- [x] Fix `backend/utils/auth.py` - unified JWT_SECRET/SECRET_KEY
- [x] Fix `backend/services/enterprise_auth_service.py` - unified JWT_SECRET/SECRET_KEY
- [x] Fix `backend/kernel/tenant_kernel.py` - unified JWT_SECRET/SECRET_KEY
- [ ] Create `.builder/JWT_RUNTIME_FIX_REPORT.md`
- [ ] Run full test: Login → JWT → /api/ai/chat
- [ ] Clean up audit script