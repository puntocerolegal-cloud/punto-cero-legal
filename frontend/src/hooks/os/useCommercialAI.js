import { commercialAiService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useCommercialAI() {
  return useOSResource(commercialAiService, "ENABLE_COMMERCIAL_AI_API");
}

export default useCommercialAI;
