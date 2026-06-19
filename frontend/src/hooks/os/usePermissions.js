import { permissionsService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function usePermissions() {
  return useOSResource(permissionsService, "ENABLE_PERMISSIONS_API");
}

export default usePermissions;
