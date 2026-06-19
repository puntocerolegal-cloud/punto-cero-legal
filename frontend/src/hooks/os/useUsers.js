import { usersService } from "@/services/os";
import { useOSResource } from "./useOSResource";

export function useUsers() {
  return useOSResource(usersService, "ENABLE_USERS_API");
}

export default useUsers;
