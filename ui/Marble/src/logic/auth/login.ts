import { fetch } from "@tauri-apps/plugin-http";
import {
  getHoldUser,
  addHoldUser,
  setPrimaryUser,
  deletePrimaryUser,
} from "../enc/keyChain";
import { User, UserConfig } from "../internal/commonTypes";
import { setAuthToken } from "../internal/IntrAuth";
import { openConnection } from "../active/actWebsocket";

// on the login we need to set the Logging-user as Primary-user
export async function login(
  DisplayId: string,
  password: string,
): Promise<UserConfig | null> {
  const userList = await getHoldUser();
  const existingUser = userList?.users?.[DisplayId];
  if (!existingUser) throw new Error(`${DisplayId} is not found in UserList`);

  signIn(DisplayId, password); // this is gonna be replaced with userSignIn() later

  const currentUser: UserConfig = {
    name: existingUser.name,
    id: existingUser.id,
    email: existingUser.email,
    display_id: existingUser.display_id,
    identityKey: existingUser.identityKey,
    sessions: {},
    storagePath: existingUser.storagePath,
  };
  setPrimaryUser(currentUser.display_id);
  addHoldUser(currentUser);
  return currentUser;
}

export async function logOut(setUserData: (NewUser: User | null) => void) {
  await deletePrimaryUser();
  setTimeout(() => {
    setUserData(null);
  }, 500);
}

export async function signIn(
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
