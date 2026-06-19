import { inventoryService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useInventory() {
  return useOSResource(inventoryService, "ENABLE_INVENTORY_API");
}

export default useInventory;
