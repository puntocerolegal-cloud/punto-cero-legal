import { analyticsService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useAnalytics() {
  return useOSResource(analyticsService, "ENABLE_ANALYTICS_API");
}

export default useAnalytics;
