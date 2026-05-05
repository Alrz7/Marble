import * as enc from "../enc/encMain.ts";
import * as hold from "../enc/encStoreManagement.ts";
import { fetch } from "@tauri-apps/plugin-http";

export type keyGroup = {
  privateKey: string;
  publicKey: string;
  revocationCertificate: string;
};

export type userConfig = {
  name: string;
  email: string;
  id: string;
  address: string;
  identityKey: keyGroup;
  // strongHoldKey: keyGroup;
};

// the IdentityKey & strongHoldKey Key-Groups are going to be saved in the StrongHold
// there are save there but i'll add encryption to these keys later too

export async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<userConfig | null> {
  const IdentityKey = await enc.GenerateIdntKey(name, email);
  const userInfo: {
    name: string;
    email: string;
    password: string;
    pubIdentKey: string;
  } = {
    name: name,
    email: email,
    password: password,
    pubIdentKey: IdentityKey.publicKey,
  };

  const response = await fetch("http://localhost:6280/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "create",
    },
    body: JSON.stringify(userInfo),
  });

  const result = await response.json();

  if (!response.ok) {
    console.log("Error: Failed to create account", result);
    return null;
  }
  console.log(result);
  // const strongHoldKey = await enc.GenerateIdntKey(name, email);
  hold.SetkeyChainObject("prvIdentKey", IdentityKey.privateKey);
  // hold.SetkeyChainObject("strongHoldKey", strongHoldKey.privateKey);

  const newUser: userConfig = {
    name: name,
    email: email,
    id: result.id,
    address: result.address,
    identityKey: IdentityKey,
    // strongHoldKey: strongHoldKey,
  };
  const load = await hold.initStrHoldClient(undefined, hold.MarbleStrongHold);
  if (!load) return null;
  hold.SetStrHoldObject(newUser, load, hold.DefualtObjectKey);
  return newUser;
}
