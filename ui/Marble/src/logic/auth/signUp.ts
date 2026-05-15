import { fetch } from "@tauri-apps/plugin-http";
import { UserConfig } from "../internal/commonTypes";
import { generateIdntKey } from "../enc/encHelpers";
import { addHoldUser } from "../enc/keyChain";
import { getUserStoragePath } from "../store/strHelpers";

// the IdentityKey & strongHoldKey Key-Groups are going to be saved in the StrongHold
// there are save there but i'll add encryption to these keys later too

export async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<UserConfig | null> {
  const IdentityKey = await generateIdntKey(name, email);

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
    address: result.address,
    identityKey: IdentityKey,
    sessions: {},
    storagePath: getUserStoragePath()
  };
  addHoldUser(newUser);
  return newUser;
}
