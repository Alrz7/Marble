import { fetch } from "@tauri-apps/plugin-http";
import { UserConfig } from "../internal/commonTypes";
import { generateIdntKey } from "../enc/encMain";
import { setUser } from "../hold/hldUser";
import { GenRandStorageId, getUserStoragePath } from "../internal/helperfuncs";

// the IdentityKey & strongHoldKey Key-Groups are going to be saved in the StrongHold
// there are save there but i'll add encryption to these keys later too

export async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<UserConfig | null> {
  const IdentityKey = await generateIdntKey(name, email);
  const StoreKey = await generateIdntKey(name, email);
  const storage_id = GenRandStorageId();
  const response = await fetch("http://localhost:6280/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "create",
    },
    body: JSON.stringify({
      name: name,
      email: email,
      password: password,
      pubIdentKey: IdentityKey.publicKey,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error("Failed to decode the http result");
  }

  const newUser: UserConfig = {
    name: name,
    email: email,
    id: result.id,
    display_id: result.display_id,
    storageId: storage_id,
    identityKey: IdentityKey,
    storeKey: StoreKey,
    sessions: {},
    storagePath: getUserStoragePath(),
  };
  setUser(newUser);
  return newUser;
}
