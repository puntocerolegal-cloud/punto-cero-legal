from typing import Optional


def can_access_resource(user_role: Optional[str], resource_firm_id: Optional[str], requested_firm_id: Optional[str], is_cross_tenant: bool = False) -> bool:
    if not user_role:
        return False

    if is_cross_tenant and user_role in {"firm_owner", "firm_admin", "admin"}:
        return True

    if not resource_firm_id or not requested_firm_id:
        return False

    return str(resource_firm_id) == str(requested_firm_id)
