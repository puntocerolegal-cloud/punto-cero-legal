import { subscriptionCenterService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useSubscriptionCenter() {
  return useOSResource(subscriptionCenterService, "ENABLE_SUBSCRIPTION_CENTER_API");
}

export default useSubscriptionCenter;
