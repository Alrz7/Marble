import { fetch } from "@tauri-apps/plugin-http";
import { DefEncoder, User } from "@internal/intrCmnTypes";
import { openConnection } from "@active/actWsRouter";
import { getUserByMasterKey, SetActiveUserId } from "@db/dbUsers";
import { SignWithHmac } from "@enc/encHelpers";
import { GetMasterKeyFromMasterString } from "@enc/encMain";
import { ResetStates } from "@states/stateMain";
import { commonErrors, err, fromPromiseErr, ok, Result } from "@internal/golog";
import { bytesToHex } from "@enc/encAuth";
import { getUserSaltArray } from "@db/dbAuthHelpers";
import { AppUser } from "@user/stateUser";

export async function onUserSignIn(
  DisplayId: string,
  masterPassPhrase: string,
): Promise<Result<User | null>> {
  const signedDIsplayId = await SignWithHmac(
    DefEncoder.encode(DisplayId).buffer,
  );
  if (!signedDIsplayId.ok) {
    return err(signedDIsplayId.error);
  }

  const master_salt = await getUserSaltArray(null, signedDIsplayId.value);
  if (!master_salt.ok) return err(master_salt.error);

  const master = await GetMasterKeyFromMasterString(
    masterPassPhrase,
    master_salt.value,
  );
  if (!master.ok) {
    return err(master.error);
  }

  const existingUser = await getUserByMasterKey(
    master.value.localKey,
    null,
    signedDIsplayId.value,
  );
  if (!existingUser.ok) {
    return err(existingUser.error);
  }

  const res = await onSendUserSignInReq(DisplayId, bytesToHex(master.value.serverHash));
  if(!res.ok) return err(res.error)

  SetActiveUserId(existingUser.value.config.id);
  return ok(existingUser.value);
}

export async function logOut() {
  await ResetStates();
  SetActiveUserId(-1);
}
export async function onSendUserSignInReq(
  DisplayId: string,
  password: string,
): Promise<Result<string>> {
  const fetchResult = await fromPromiseErr(
    fetch("http://localhost:6280/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        task: "signin",
      },
      body: JSON.stringify({
        display_id: DisplayId,
        password: password,
      }),
    }),
    commonErrors.connectionFailed,
  );

  if (!fetchResult.ok) {
    0;
    return err(fetchResult.error);
  }

  const response = fetchResult.value;
  if (!response.ok) {
    return err(commonErrors.connectionFailed);
  }

  const jsonResult = await fromPromiseErr(
    response.json() as Promise<{ token: string; error?: string }>,
    commonErrors.conversionFailed,
  );

  if (!jsonResult.ok) {
    return err(jsonResult.error);
  }

  if (jsonResult.value.error) {
    return err(commonErrors.notAuthorized);
  }

  const { setAccessToken } = AppUser.getState();
  setAccessToken(jsonResult.value.token);
  openConnection();

  return ok(jsonResult.value.token);
}
