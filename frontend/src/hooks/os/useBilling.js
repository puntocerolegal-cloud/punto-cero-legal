import { billingService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useBilling() {
  return useOSResource(billingService, "ENABLE_BILLING_API");
}

export default useBilling;
