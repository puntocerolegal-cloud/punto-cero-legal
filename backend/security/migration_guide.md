# S2.5 GSCL Migration Guide

## Before and After Patterns

### Pattern 1: Reading a Resource

**BEFORE (Old Pattern - Cases S2.4B):**
```python
case = await get_secure_case(case_id, current_user, db)
check_case_authorization(current_user, case, action="read")
```

**AFTER (S2.5 Pattern):**
```python
from security.security_engine import authorize

case = await secure_repo.find_one(
    collection_name="cases",
    query={"_id": ObjectId(case_id)},
    user=current_user,
    resource_type="case",
    action="read",
    db=db,
)
```

**Benefits:**
- Single authorization point (security_engine.py)
- Automatic audit logging
- Automatic ObjectId validation
- Automatic 404 on missing
- Automatic 403 on unauthorized

---

### Pattern 2: Creating a Resource

**BEFORE:**
```python
doc = {
    "case_number": case_number,
    "organization_id": current_user.get("organization_id"),
    "lawyer_id": lawyer_id,
    ...
}
result = await db.cases.insert_one(doc)
```

**AFTER:**
```python
doc = {
    "case_number": case_number,
    # organization_id and lawyer_id set automatically by secure_repo
    ...
}
case_id = await secure_repo.insert_one(
    collection_name="cases",
    document=doc,
    user=current_user,
    resource_type="case",
    db=db,
)
```

---

### Pattern 3: Updating a Resource

**BEFORE:**
```python
await validate_case_ownership(case_id, current_user, db)
result = await db.cases.update_one(
    {"_id": ObjectId(case_id)},
    {"$set": update_data}
)
```

**AFTER:**
```python
matched = await secure_repo.update_one(
    collection_name="cases",
    query={"_id": case_id},  # Pass as string
    update={"$set": update_data},
    user=current_user,
    resource_type="case",
    db=db,
)
```

---

### Pattern 4: Deleting a Resource

**BEFORE:**
```python
await validate_case_ownership(case_id, current_user, db)
result = await db.cases.delete_one({"_id": ObjectId(case_id)})
```

**AFTER:**
```python
deleted = await secure_repo.delete_one(
    collection_name="cases",
    query={"_id": case_id},
    user=current_user,
    resource_type="case",
    db=db,
)
```

---

## Migration Steps for Each Module

### Step 1: Import Core Components

```python
from security.security_engine import authorize
from security.secure_repository import get_secure_repository

async def get_db():
    from server import db
    return db

# In endpoint:
db = await get_db()
secure_repo = get_secure_repository(db)
```

### Step 2: Replace DB Calls

1. Find all `db.collection.find_one()` → `secure_repo.find_one()`
2. Find all `db.collection.update_one()` → `secure_repo.update_one()`
3. Find all `db.collection.delete_one()` → `secure_repo.delete_one()`
4. Find all `db.collection.insert_one()` → `secure_repo.insert_one()`

### Step 3: Remove Old Helpers

Delete these imports and calls:
- `validate_case_ownership`
- `validate_document_ownership`
- `validate_lawyer_id_ownership`
- `validate_org_ownership`
- `get_secure_case`
- `check_case_authorization`
- `authorize_case_access`

Replace with single call:
```python
await secure_repo.find_one(..., user=current_user, resource_type="case", ...)
```

### Step 4: Remove ObjectId Parsing

**BEFORE:**
```python
try:
    object_id = ObjectId(case_id)
except InvalidId:
    raise HTTPException(400, "Invalid ID")
```

**AFTER:**
```python
# secure_repo handles this automatically
```

---

## Modules to Migrate (Priority Order)

1. **cases.py** → Reference implementation (S2.5A)
2. **documents.py** → S2.5B
3. **invoices.py** → S2.5C
4. **dashboard.py** → S2.5D
5. **users.py** → S2.5E
6. **clients.py** → S2.5F
7. Others as needed

---

## Policy Matrix Integration

Each module's resource_type must exist in `policy_matrix.py`:

```python
POLICIES = {
    "case": {
        "read": ["owner", "team", "admin"],
        "write": ["owner", "admin"],
        "delete": ["admin"],
    },
    "document": {
        "read": ["owner", "team"],
        "write": ["owner"],
        "delete": ["owner", "admin"],
    },
    ...
}
```

If resource_type not defined → Default DENY (fail-closed).

---

## Testing Each Module

For each migrated module, test:

1. **Unauthenticated Access**: 401
2. **Cross-Tenant Access**: 403
3. **Non-Owner Read**: 403
4. **Owner Read**: 200
5. **Admin Read**: 200
6. **Team Member Read**: 200
7. **Invalid ObjectId**: 400
8. **Missing Resource**: 404
9. **Audit Logs**: Check `/logs/audit.log`

---

## Rollback Plan

If migration fails:
1. Keep old helpers in place initially
2. Migrate one endpoint at a time
3. Test each endpoint fully before next
4. Old helpers can be deprecated gradually

---

## Success Criteria

✅ All DB calls go through secure_repo
✅ Zero direct db.collection access
✅ All authorization through security_engine
✅ Audit logs present for every action
✅ Fail-closed (undefined policies → 403)
✅ Zero regressions in business logic
✅ All tests passing

