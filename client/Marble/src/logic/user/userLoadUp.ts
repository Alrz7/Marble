import { userSignIn } from "@auth/login.ts";
import { User } from "@internal/intrCmnTypes";
import { InitAndMigrate } from "@db/dbMain.ts";
import { getActiveUserId, GetUser } from "@db/dbUsers.ts";
import { GetOrCreateKeyChainKey } from "@enc/encMain.ts";
import { addAppErrNotif, commonErrors } from "@internal/golog";

export async function loadConfig(): Promise<User | null> {
  const kek = await GetOrCreateKeyChainKey();
  if (!kek.ok) {
    addAppErrNotif(kek.error);
    return null;
  }
  if (kek.value == null) {
    addAppErrNotif(commonErrors.keychainKeyNotValid);
    return null;
  }

  InitAndMigrate();
  const actvUserId = await getActiveUserId();
  if (!actvUserId.ok) {
    addAppErrNotif(actvUserId.error);
    return null;
  }
  const currentUser = await GetUser(kek.value, actvUserId.value, null);
  if (!currentUser.ok) {
    addAppErrNotif(currentUser.error);
    return null;
  }
  userSignIn(currentUser.value.config.displayId, "testingg!"); // this is gonna be replaced with autoSignIn() later
  return currentUser.value;
}
