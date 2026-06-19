import { implementationsService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useImplementations() {
  return useOSResource(implementationsService, "ENABLE_IMPLEMENTATIONS_API");
}

export default useImplementations;
