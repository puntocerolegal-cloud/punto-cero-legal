import { verticalsService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useVerticals() {
  return useOSResource(verticalsService, "ENABLE_VERTICALS_API");
}

export default useVerticals;
