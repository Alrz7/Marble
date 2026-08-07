import { fetch } from "@tauri-apps/plugin-http";
import { getUserTokens, setUserTokens } from "@db/dbAuthHelpers";
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
import { UserId } from "@internal/intrCmnTypes";
import { AppUser } from "@user/stateUser";
import { jwtDecode } from "jwt-decode";
import { AppState } from "@states/stateCommon";

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
        console.log(newAccessToken.error)
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
  const {serverUrl} = AppState.getState()
  const response = await fromPromiseErr(
    fetch(`${serverUrl}/auth/refresh`, {
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
