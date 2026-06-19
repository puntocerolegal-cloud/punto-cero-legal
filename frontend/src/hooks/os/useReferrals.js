import { referralsService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useReferrals() {
  return useOSResource(referralsService, "ENABLE_REFERRALS_API");
}

export default useReferrals;
