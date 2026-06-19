import { notificationsService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useNotifications() {
  return useOSResource(notificationsService, "ENABLE_NOTIFICATIONS_API");
}

export default useNotifications;
