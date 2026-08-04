import { userSignIn } from "@auth/login.ts";
import { AuthMethod, User } from "@internal/intrCmnTypes";
import { InitAndMigrate } from "@db/dbMain.ts";
import { getActiveUserId, GetUser, GetUserAuthMethod } from "@db/dbUsers.ts";
import { GetWrappingKeyByMethod } from "@enc/encMain.ts";
import { err, ok, Result } from "@internal/golog";

export async function getActiveUserAuthMethod(): Promise<
  Result<{ id: number; method: AuthMethod } | null>
> {
  await InitAndMigrate();
  const actUser_id = await getActiveUserId();
  if (!actUser_id.ok) {
    return err(actUser_id.error);
  }
  if (actUser_id.value < 0) return ok(null);

  const authMethod = await GetUserAuthMethod(actUser_id.value);
  if (!authMethod.ok) {
    return err(authMethod.error);
  }
  return ok({ id: actUser_id.value, method: authMethod.value });
}

export async function loadConfigByMethod(
  user_id: number,
  authMethod: AuthMethod,
  passPrase?: string,
): Promise<Result<User | null>> {
  const wrappingKey = await GetWrappingKeyByMethod(authMethod, passPrase);
  if (!wrappingKey.ok) {
    return err(wrappingKey.error);
  }
  const currentUser = await GetUser(wrappingKey.value, user_id, null);
  if (!currentUser.ok) {
    return err(currentUser.error);
  }
  userSignIn(currentUser.value.config.displayId, "testingg!"); // this is gonna be replaced with autoSignIn() later
  return ok(currentUser.value);
}

// const kek = await GetOrCreateKeyChainKey();
// if (!kek.ok) {
//   addAppErrNotif(kek.error);
//   return null;
// }
// if (kek.value == null) {
//   addAppErrNotif(commonErrors.keychainKeyNotValid);
//   return null;
// }
