import { fetch } from "@tauri-apps/plugin-http";
import {
  getUserTokens,
  setUserTokens,
  updateEncryptedMasterKey,
  updateUserAuthMethod,
} from "@db/dbAuthHelpers";
import {
  addAppErrNotif,
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseErr,
  newAppErr,
  ok,
  Result,
} from "@internal/golog";
import { AuthMethod, UserId } from "@internal/intrCmnTypes";
import { AppUser } from "../user/stateUser";
import { jwtDecode } from "jwt-decode";
import { AppState } from "@states/stateCommon";
import { GetWrappingKeyByMethod } from "@enc/encMain";
import { buildApiUrl } from "@internal/intrHelperfuncs";

export function isJwtTokenExpiered(token: string): boolean {
  const decoded = jwtDecode(token);
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return true;
  return false;
}

export async function onGetUserAccessToken() {
  const { currentUser, accessToken, setAccessToken } = AppUser.getState();
  if (!currentUser?.config) {
    addAppErrNotif(commonErrors.userNotValid);
    return null;
  }

  if (accessToken != null && !isJwtTokenExpiered(accessToken)) {
    return accessToken;
  } else {
    const tokens = await getUserTokens(
      currentUser.config.id,
      currentUser.MasterKey,
    );
    if (!tokens.ok) {
      addAppErrNotif(tokens.error);
      return null;
    }
    if (
      tokens.value.accessToken != null &&
      !isJwtTokenExpiered(tokens.value.accessToken)
    ) {
      setAccessToken(tokens.value.accessToken);
      return tokens.value.accessToken;
    } else if (
      tokens.value.refreshToken != null &&
      !isJwtTokenExpiered(tokens.value.refreshToken)
    ) {
      const newAccessToken = await onRefreshUserTokens(
        currentUser.config.userId,
        currentUser.config.id,
        tokens.value.refreshToken,
        currentUser.MasterKey,
      );
      if (!newAccessToken.ok) {
        addAppErrNotif(newAccessToken.error);
        return null;
      }
      setAccessToken(newAccessToken.value);
      return newAccessToken.value;
    } else {
      addAppErrNotif(
        newAppErr(
          "failedToGetToken",
          "existing refreshToken are expired or null",
        ),
      );
    }
  }
  return null;
}

export async function onRefreshUserTokens(
  userId: UserId, // this is user's Global Id
  user_id: number, // this is User's local (client-db) Id
  refreshToken: string,
  masterkey: CryptoKey,
): Promise<Result<string>> {
  const body = JSON.stringify({
    userId: userId,
    refreshToken: refreshToken,
  });
  const { serverUrl } = AppState.getState();
  if (!serverUrl)
    return err(
      errEdtMessage(commonErrors.connectionFailed, "serverUrl is not valid"),
    );
  const response = await fromPromiseErr(
    fetch(buildApiUrl(serverUrl, "/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    }),
    commonErrors.failedTofetchData,
  );
  if (!response.ok) return err(response.error);
  const Result: {
    refreshToken: string | null;
    accessToken: string | null;
    error: boolean;
    message: string | null;
  } = await response.value.json();
  if (Result.error && Result.message)
    return err(errEdtMessage(commonErrors.failedTofetchData, Result.message));

  if (Result.accessToken == null)
    return err(
      errEdtMessage(
        commonErrors.failedTofetchData,
        "failed to fetch access-token from server: returned Null for acessToken",
      ),
    );

  if (Result.refreshToken != null) {
    const res = await setUserTokens(
      user_id,
      masterkey,
      Result.accessToken,
      Result.refreshToken,
    );
    if (!res.ok) return err(res.error);
  }
  return ok(Result.accessToken);
}

export async function updateUserAuthentication(
  method: AuthMethod,
  newPassPhrase?: string,
) {
  const { currentUser } = AppUser.getState();
  if (!currentUser?.config) return err(commonErrors.userNotValid);
  const WrappingKey = await GetWrappingKeyByMethod(method, newPassPhrase);
  if (!WrappingKey.ok) {
    return err(WrappingKey.error);
  }
  const updKey = await updateEncryptedMasterKey(
    currentUser.config.id,
    currentUser.MasterKey,
    WrappingKey.value,
  );
  if (!updKey.ok) return err(updKey.error);

  const updMethod = await updateUserAuthMethod(currentUser.config.id, method);
  if (!updMethod.ok) return err(updMethod.error);
  currentUser.authMethod = method;
  return ok(undefined);
}
