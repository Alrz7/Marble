import { fetch } from "@tauri-apps/plugin-http";
import {
  getHoldUser,
  addHoldUser,
  setPrimaryUser,
  deletePrimaryUser,
} from "../enc/keyChain";
import { User, UserConfig } from "../internal/commonTypes";

// on the login we need to set the Logging-user as Primary-user
export async function login(
  DisplayId: string,
  password: string,
): Promise<UserConfig | null> {
  const userList = await getHoldUser();
  const existingUser = userList?.users?.[DisplayId];
  if (!existingUser) throw new Error(`${DisplayId} is not found in UserList`);

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
  const result = await response.json();

  if (!response.ok) {
    throw new Error("Failed to decode the http result");
  }
  // console.log(result)
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

export async function logOut(
  setUserData: React.Dispatch<React.SetStateAction<User | null>>,
) {
  await deletePrimaryUser();
  setTimeout(() => {
    setUserData(null);
  }, 500);
}
