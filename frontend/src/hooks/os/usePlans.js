import { plansService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function usePlans() {
  return useOSResource(plansService, "ENABLE_PLANS_API");
}

export default usePlans;
