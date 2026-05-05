// this file has the responsibilitties to manage the data that has been stored in StrongHold
// & the key to enc those datas
// Stronghold is secured by a openPGP<curve25519> key which is saved in the Keychain itself
// the key should be created once automaticaly at the first start and editble by user

import { Stronghold, Client } from "@tauri-apps/plugin-stronghold";
import { appDataDir } from "@tauri-apps/api/path";

import {
  getPassword,
  setPassword,
  deletePassword,
} from "tauri-plugin-keyring-api";
import * as openpgp from "openpgp";
export const DefualtObjectKey = "MarbleUserData";
export const MarbleStrongHold = "MarbleStrongHold";

export async function initStrHoldClient(
  vaultKey?: string,
  clientName?: string,
) {
  const vaultPath = `${await appDataDir()}/vault.hold`;

  if (!vaultKey) {
    const selfLoadKey = await GetkeyChainObject(MarbleStrongHold);
    if (!selfLoadKey) return null;
    vaultKey = selfLoadKey;
  }
  const stronghold = await Stronghold.load(vaultPath, vaultKey);
  let client: Client;
  try {
    client = await stronghold.loadClient(clientName ?? MarbleStrongHold);
  } catch {
    client = await stronghold.createClient(clientName ?? MarbleStrongHold);
  }
  return {
    stronghold,
    client,
  };
}

// export async function LoadStrHoldClient(clientName: string) {
//   const vaultPath = `${await appDataDir()}/vault.hold`;
//   const vaultKey = await GetkeyChainObject(MarbleStrongHold);
//   if (!vaultKey) return null;
//   const stronghold = await Stronghold.load(vaultPath, vaultKey);
//   let client: Client;
//   try {
//     client = await stronghold.loadClient(clientName ?? MarbleStrongHold);
//     return { client, stronghold };
//   } catch (err) {
//     console.error(`there was an erorr while loading the client: ${err}`);
//     return null;
//   }
// }

export async function SetStrHoldObject(
  data: any,
  load: {
    client: Client;
    stronghold: Stronghold;
  },
  ObjectKey?: string,
) {
  const store = load.client.getStore();
  const datainByte = Array.from(new TextEncoder().encode(JSON.stringify(data)));
  await store.insert(ObjectKey ?? DefualtObjectKey, datainByte);
  await load.stronghold.save();
}

export async function GetStrHoldObject(
  load: {
    client: Client;
    stronghold: Stronghold;
  },
  ObjectKey?: string,
): Promise<any | null> {
  const store = load.client.getStore();
  const data = await store.get(ObjectKey ?? DefualtObjectKey);
  if (!data) return null;
  const stringData = new TextDecoder().decode(new Uint8Array(data));
  return await JSON.parse(stringData);
}

export async function DeleteStrHoldObject(
  load: {
    client: Client;
    stronghold: Stronghold;
  },
  ObjectKey?: string,
) {
  const store = load.client.getStore();
  await store.remove(ObjectKey ?? DefualtObjectKey);
}

// <<<<----------------keychain Storage----------------->>>>

const user = "Marble";

export async function SetkeyChainObject(service: string, password: string) {
  await setPassword(service, user, password);
}

export async function GetkeyChainObject(service: string) {
  return await getPassword(service, user);
}

export async function DeletekeyChainObject(service: string) {
  await deletePassword(service, user);
}

export async function GetKeyfromArmored(
  armKey: string,
  password?: string,
): Promise<openpgp.PrivateKey | null> {
  let privateKey = await openpgp.readPrivateKey({ armoredKey: armKey });
  if (password) {
    privateKey = await openpgp.decryptKey({
      privateKey,
      passphrase: password,
    });
  }
  return privateKey;
}
