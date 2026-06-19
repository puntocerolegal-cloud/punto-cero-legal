import { subscriptionsService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useSubscriptions() {
  return useOSResource(subscriptionsService, "ENABLE_SUBSCRIPTIONS_API");
}

export default useSubscriptions;
