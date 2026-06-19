import { organizationsService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useOrganizations() {
  return useOSResource(organizationsService, "ENABLE_ORGANIZATIONS_API");
}

export default useOrganizations;
