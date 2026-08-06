import { getUserRefreshToken, setUserRefreshToken } from "@db/dbAuthHelpers";
import {
  addAppErrNotif,
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";
import { UserId } from "@internal/intrCmnTypes";
import { AppUser } from "@user/stateUser";
import { jwtDecode } from "jwt-decode";

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
  }

  const newAccessToken = await onRefreshUserTokens(
    currentUser.config.userId,
    currentUser.config.id,
    currentUser.MasterKey,
  );
  if (!newAccessToken.ok) {
    addAppErrNotif(newAccessToken.error);
    return null;
  }

  setAccessToken(newAccessToken.value);
  return newAccessToken.value;
}

export async function onRefreshUserTokens(
  userId: UserId, // this is user's Global Id
  user_id: number, // this is User's local (client-db) Id
  masterkey: CryptoKey,
): Promise<Result<string>> {
  const refreshToken = await getUserRefreshToken(user_id, masterkey);
  if (!refreshToken.ok) return err(refreshToken.error);

  const body = JSON.stringify({
    userId: userId,
    refreshToken: refreshToken.value,
  });
  const response = await fromPromiseErr(
    fetch("http://localhost:6280/auth/refresh", {
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
        "failed to fetch access-token from server: returned Null",
      ),
    );

  if (Result.refreshToken != null) {
    const res = await setUserRefreshToken(
      user_id,
      Result.refreshToken,
      masterkey,
    );
    if (!res.ok) return err(res.error);
  }
  return ok(Result.accessToken);
}
