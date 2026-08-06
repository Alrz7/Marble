import { AuthMethod, User } from "@internal/intrCmnTypes";
import { getUserByMasterKey, getUserByWrappingKey } from "@db/dbUsers.ts";
import {
  GetMasterKeyFromMasterString,
  GetWrappingKeyByMethod,
} from "@enc/encMain.ts";
import { err, ok, Result } from "@internal/golog";
import { getUserSaltArray } from "@db/dbAuthHelpers";

export async function loadConfigByMethod(
  user_id: number,
  authMethod: AuthMethod,
  passPrase?: string,
): Promise<Result<User | null>> {
  const wrappingKey = await GetWrappingKeyByMethod(authMethod, passPrase);
  if (!wrappingKey.ok) {
    return err(wrappingKey.error);
  }
  const currentUser = await getUserByWrappingKey(wrappingKey.value, user_id);
  if (!currentUser.ok) {
    return err(currentUser.error);
  }
  // onSendUserSignInReq(currentUser.value.config.displayId, "testingg!"); // this is gonna be replaced with autoSignIn() later
  return ok(currentUser.value);
}

export async function loadConfigByMasterPhrase(
  user_id: number,
  masterPassPhrase: string,
): Promise<Result<User | null>> {
  const master_salt = await getUserSaltArray(user_id, null);
  if (!master_salt.ok) return err(master_salt.error);

  const master = await GetMasterKeyFromMasterString(
    masterPassPhrase,
    master_salt.value,
  );
  if (!master.ok) {
    return err(master.error);
  }

  const currentUser = await getUserByMasterKey(
    master.value.localKey,
    user_id,
    null,
  );
  if (!currentUser.ok) {
    return err(currentUser.error);
  }

  // onSendUserSignInReq(currentUser.value.config.displayId, "testingg!"); // this is gonna be replaced with autoSignIn() later
  return ok(currentUser.value);
}
