import { fetch } from "@tauri-apps/plugin-http";
import { DefEncoder, User, UserConfig } from "@internal/intrCmnTypes";
import { setAuthToken } from "@internal/intrAuthHelpers";
import { openConnection } from "@active/actWsRouter";
import { GetUser, SetActiveUserId } from "@db/dbUsers";
import { SignWithHmac } from "@enc/encHelpers";
import {
  GetMasterKeyFromMasterString,
  GetOrCreateKeyChainKey,
} from "@enc/encMain";
import { ResetStates } from "@states/stateMain";
import { commonErrors, err, ok, Result } from "@internal/golog";

// on the login we need to set the Logging-user as Primary-user
export async function onLogin(
  DisplayId: string,
  masterPassPhrase: string,
): Promise<Result<User | null>> {
  const kek = await GetOrCreateKeyChainKey();
  if (!kek.ok) {
    return err(kek.error);
  }
  if (kek.value == null) {
    return err(commonErrors.keychainKeyNotValid);
  }

  const signedDIsplayId = await SignWithHmac(
    DefEncoder.encode(DisplayId).buffer,
  );
  if (!signedDIsplayId.ok) {
    return err(signedDIsplayId.error);
  }

  const localMasterKey = await GetMasterKeyFromMasterString(masterPassPhrase);
  if (!localMasterKey.ok) {
    return err(localMasterKey.error);
  }

  const existingUser = await GetUser(
    localMasterKey.value,
    null,
    signedDIsplayId.value,
  );
  if (!existingUser.ok) {
    return err(existingUser.error);
  }
  userSignIn(DisplayId, masterPassPhrase); // this is gonna be replaced with userSignIn() later

  SetActiveUserId(existingUser.value.config.id);
  return ok(existingUser.value);
}

export async function logOut() {
  await ResetStates();
}

export async function userSignIn(
  DisplayId: string,
  password: string,
): Promise<UserConfig | null> {
  const response = await fetch("http://localhost:6280/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "signin",
    },
    body: JSON.stringify({
      display_id: DisplayId,
      password: password,
    }),
  });
  if (response.ok) {
    try {
      const result = await response.json();
      if (!result.error) {
        setAuthToken(result.token);
        openConnection();
        return result;
      } else
        console.error(
          "there was an error while trying to connect to the server",
        );
      return null;
    } catch (err) {
      // adding to the notif system...( will be added a little bit later!)
      console.error(`there was an error while trying to connect to the server`);
      return null;
    }
  } else {
    console.error("Failed to decode the http result");
    throw new Error("Failed to decode the http result");
  }
}
