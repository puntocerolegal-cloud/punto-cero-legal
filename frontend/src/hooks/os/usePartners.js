import { partnersService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function usePartners() {
  return useOSResource(partnersService, "ENABLE_PARTNERS_API");
}

export default usePartners;
