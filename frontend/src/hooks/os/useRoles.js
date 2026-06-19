import { rolesService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useRoles() {
  return useOSResource(rolesService, "ENABLE_ROLES_API");
}

export default useRoles;
