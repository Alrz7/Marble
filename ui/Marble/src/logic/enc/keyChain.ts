/**
 * Manages data stored in Stronghold and the keys to encrypt them.
 * Stronghold is secured by an OpenPGP Curve25519 key which is saved in the Keychain.
 * The key is created once automatically on first start and can be changed by the user.
 */

import { Stronghold, Client } from "@tauri-apps/plugin-stronghold";
import { appDataDir } from "@tauri-apps/api/path";
import {
  getPassword,
  setPassword,
  deletePassword,
} from "tauri-plugin-keyring-api";
import * as openpgp from "openpgp";
import { UserConfig, MARBLE_STRONGHOLD_KEY, STRONGHOLD_OBJECT_KEYS, KEYCHAIN_USER, UserHold } from "../internal/commonTypes";

// ---------------------------------------------------------------------------
// Stronghold Initialisation

export type Load = { stronghold: Stronghold; client: Client }


let cachedLoad: Load | null = null;
let isInitializing = false;

export async function initStrholdClient(
  vaultKey?: string,
  clientName?: string,
): Promise<Load | null> {
  if (cachedLoad) {
    return cachedLoad;
  }

  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return cachedLoad;
  }
  isInitializing = true;

  try {
    const vaultPath = `${await appDataDir()}/vault.hold`;

    if (!vaultKey) {
      const storedKey = await getKeychainObject(MARBLE_STRONGHOLD_KEY);
      if (!storedKey) throw new Error("couldn't Provide the Strong-Hold-Key");
      vaultKey = storedKey;
    }

    const stronghold = await Stronghold.load(vaultPath, vaultKey);
    const client = await loadOrCreateClient(stronghold, clientName ?? MARBLE_STRONGHOLD_KEY);

    cachedLoad = { stronghold, client };
    return cachedLoad;
  } finally {
    isInitializing = false;
  }
}

async function loadOrCreateClient(
  stronghold: Stronghold,
  clientName: string,
): Promise<Client> {
  try {
    return await stronghold.loadClient(clientName);
  } catch {
    return await stronghold.createClient(clientName);
  }
}

export function resetStronghold() {
  cachedLoad?.stronghold.unload
  cachedLoad = null;
}

// ---------------------------------------------------------------------------
// User Config Management (CRUD on Stronghold)

export async function setStgHoldData(
  newData: string,
  objectKey: string,
  load?: Load | null
) {
  if (!load) {
    load = await initStrholdClient()
    if (!load) throw new Error("could't load a storeClient")
  }
  const store = load.client.getStore();
  const dataBytes = new TextEncoder().encode(newData);
  await store.insert(objectKey, Array.from(dataBytes));
  await load.stronghold.save();
}



export async function getStgHoldData(
  objectKey: string,
  load?: Load | null
): Promise<string | null> {
  if (!load) {
    load = await initStrholdClient()
    if (!load) throw new Error("could't load a storeClient")
  }

  const store = load.client.getStore();
  const data = await store.get(objectKey);
  if (!data) return null;

  return new TextDecoder().decode(new Uint8Array(data));
}

export async function deleteStrgHoldData(
  objectKey: string,
  load?: Load | null

): Promise<void> {
  if (!load) {
    load = await initStrholdClient()
    if (!load) throw new Error("could't load a storeClient")
  }

  const store = load.client.getStore();
  await store.remove(objectKey);
}

//-------------------------------------------------------------------
// StrongHold's USER Methods...

export async function addHoldUser(
  newUser: UserConfig,
  load?: Load | null
): Promise<void> {
  let existingData = await getHoldUser(load);
  if (!existingData) existingData = { users: {}, primaryUser: null };

  // we currently set user as Primary
  existingData.primaryUser = newUser.address
  existingData.users[newUser.address] = newUser
  setStgHoldData(JSON.stringify(existingData), STRONGHOLD_OBJECT_KEYS.Users, load)
}

export async function getHoldUser(
  load?: Load | null
): Promise<UserHold | null> {

  const jsonString = await getStgHoldData(STRONGHOLD_OBJECT_KEYS.Users, load)
  if (!jsonString) return null
  const parsedObject = JSON.parse(jsonString) as UserHold;
  return parsedObject;
}

export async function deleteHoldUser(
  userAddress: string,
  load?: Load | null
): Promise<void> {
  let existingData = await getHoldUser(load);
  if (existingData) {
    delete existingData.users[userAddress]
  }
  setStgHoldData(JSON.stringify(existingData), STRONGHOLD_OBJECT_KEYS.Users, load)
}

//------------------
// Primary-User Methods
//

export async function setPrimaryUser(userAddress: string, load?: Load | null): Promise<void> {
  let existingData = await getHoldUser(load);
  if (!existingData) existingData = { users: {}, primaryUser: null };
  existingData.primaryUser = userAddress
  setStgHoldData(JSON.stringify(existingData), STRONGHOLD_OBJECT_KEYS.Users, load)

}
export async function getPrimaryUser(load?: Load | null): Promise<string | null> {
  let existingData = await getHoldUser(load);
  if (!existingData) return null;
  return existingData.primaryUser;
}

export async function deletePrimaryUser(load?: Load | null): Promise<void> {
  let existingData = await getHoldUser(load);
  if (!existingData) existingData = { users: {}, primaryUser: null };
  existingData.primaryUser = null
  setStgHoldData(JSON.stringify(existingData), STRONGHOLD_OBJECT_KEYS.Users, load)
}

// ---------------------------------------------------------------------------
// Keychain Storage (OS keychain)

export async function setKeychainObject(service: string, password: string): Promise<void> {
  await setPassword(service, KEYCHAIN_USER, password);
}

export async function getKeychainObject(service: string): Promise<string | null> {
  return await getPassword(service, KEYCHAIN_USER);
}

export async function deleteKeychainObject(service: string): Promise<void> {
  await deletePassword(service, KEYCHAIN_USER);
}

// ---------------------------------------------------------------------------
// OpenPGP Key Helpers
// ---------------------------------------------------------------------------

export async function getKeyFromArmored(
  armoredKey: string,
  password: string | null,
): Promise<openpgp.PrivateKey | null> {
  try {
    let privateKey = await openpgp.readPrivateKey({ armoredKey });
    if (password) {
      privateKey = await openpgp.decryptKey({
        privateKey,
        passphrase: password,
      });
    }
    return privateKey;
  } catch {
    return null;
  }
}
