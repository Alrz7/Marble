import { fetch } from "@tauri-apps/plugin-http";
import { User } from "@internal/intrCmnTypes";
import { openConnection } from "@active/actWsRouter";
import {
  dbFindUserByDisplayId,
  getUserByMasterKey,
  SetActiveUserId,
  setUserServerUrl,
} from "@db/dbUsers";
import { GetMasterKeyFromMasterString } from "@enc/encMain";
import { ResetStates } from "@states/stateMain";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";
import { bytesToHex } from "@enc/encAuth";
import { getUserSaltArray, setUserTokens } from "@db/dbAuthHelpers";
import { AppUser } from "../user/stateUser";
import { AppState } from "@states/stateCommon";
import { settingState } from "@states/stateSettings";
import { buildApiUrl } from "@internal/intrHelperfuncs";

export async function onUserSignIn(
  newServerUrl: string,
  DisplayId: string,
  masterPassPhrase: string,
): Promise<Result<User | null>> {
  const existingUser_id = await dbFindUserByDisplayId(DisplayId);
  if (!existingUser_id.ok) return err(existingUser_id.error);
  if (existingUser_id.value == -1) return err(commonErrors.userNotFound);

  const master_salt = await getUserSaltArray(existingUser_id.value, null);
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
    existingUser_id.value,
    null,
  );
  if (!existingUser.ok) {
    return err(existingUser.error);
  }

  const { serverUrl, setServerUrl } = AppState.getState();
  const { setSettingServerUrl } = settingState.getState();
  if (serverUrl !== newServerUrl) {
    const res = await setUserServerUrl(
      existingUser.value.config.id,
      newServerUrl,
      existingUser.value.MasterKey,
    );
    if (!res.ok) return err(res.error);
    setServerUrl(newServerUrl);
    setSettingServerUrl(newServerUrl);
  }

  const res = await onSendUserSignInReq(
    existingUser.value.config.id,
    master.value.localKey,
    DisplayId,
    bytesToHex(master.value.serverHash),
  );
  if (!res.ok) return err(res.error);

  SetActiveUserId(existingUser.value.config.id);
  return ok(existingUser.value);
}

export async function onLogOut() {
  await ResetStates();
  SetActiveUserId(-1);
}
export async function onSendUserSignInReq(
  user_id: number,
  masterKey: CryptoKey,
  DisplayId: string,
  password: string,
): Promise<Result<string>> {
  const { serverUrl } = AppState.getState();
  if (!serverUrl)
    return err(
      errEdtMessage(commonErrors.connectionFailed, "serverUrl is not valid"),
    );
  const fetchResult = await fromPromiseErr(
    fetch(buildApiUrl(serverUrl, "/account/"), {
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
    response.json() as Promise<{
      accessToken: string;
      refreshToken: string;
      error?: string;
    }>,
    commonErrors.conversionFailed,
  );

  if (!jsonResult.ok) {
    return err(jsonResult.error);
  }

  if (jsonResult.value.error) {
    return err(commonErrors.notAuthorized);
  }

  const { setAccessToken } = AppUser.getState();
  setAccessToken(jsonResult.value.accessToken);
  setUserTokens(
    user_id,
    masterKey,
    jsonResult.value.accessToken,
    jsonResult.value.refreshToken,
  );
  openConnection();

  return ok(jsonResult.value.accessToken);
}
