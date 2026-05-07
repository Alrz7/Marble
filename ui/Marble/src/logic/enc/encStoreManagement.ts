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
import { UserConfig, MARBLE_STRONGHOLD_KEY, DEFAULT_OBJECT_KEY, KEYCHAIN_USER } from "../internal/commonTtypes";

// ---------------------------------------------------------------------------
// Stronghold Initialisation

export async function initStrholdClient(
  vaultKey?: string,
  clientName?: string,
): Promise<{ stronghold: Stronghold; client: Client } | null> {
  const vaultPath = `${await appDataDir()}/vault.hold`;
  // If no vault key is provided, try to load from Keychain
  if (!vaultKey) {
    const storedKey = await getKeychainObject(MARBLE_STRONGHOLD_KEY);
    if (!storedKey) throw new Error("couldn't Provide the Strong-Hold-Key")
    vaultKey = storedKey;
  }
  const stronghold = await Stronghold.load(vaultPath, vaultKey);
  const client = await loadOrCreateClient(stronghold, clientName ?? MARBLE_STRONGHOLD_KEY);

  return { stronghold, client };
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

// ---------------------------------------------------------------------------
// User Config Management (CRUD on Stronghold)

export async function setHoldUser(
  userData: UserConfig,
  objectKey: string | null,
  load?: { stronghold: Stronghold; client: Client } | null
): Promise<void> {

  if (!load) {
    load = await initStrholdClient()
    if (!load) throw new Error("could't load a storeClient")
  }

  let existingData = await getHoldUser(objectKey);
  if (!existingData) {
    existingData = new Map<string, UserConfig>();
  }
  existingData.set(userData.address, userData);

  const store = load.client.getStore();
  const dataBytes = new TextEncoder().encode(JSON.stringify([...existingData]));
  await store.insert(objectKey ?? DEFAULT_OBJECT_KEY, Array.from(dataBytes));
  await load.stronghold.save();
}

export async function getHoldUser(
  objectKey: string | null,
  load?: { stronghold: Stronghold; client: Client } | null
): Promise<Map<string, UserConfig> | null> {

  if (!load) {
    load = await initStrholdClient()
    if (!load) throw new Error("could't load a storeClient")
  }

  const store = load.client.getStore();
  const data = await store.get(objectKey ?? DEFAULT_OBJECT_KEY);
  if (!data) return null;

  const jsonString = new TextDecoder().decode(new Uint8Array(data));
  const parsedObject = JSON.parse(jsonString) as Array<[string, UserConfig]>;
  return new Map(parsedObject);
}

export async function deleteHoldUser(
  objectKey: string | null,
  load?: { stronghold: Stronghold; client: Client } | null

): Promise<void> {
  if (!load) {
    load = await initStrholdClient()
    if (!load) throw new Error("could't load a storeClient")
  }

  const store = load.client.getStore();
  await store.remove(objectKey ?? DEFAULT_OBJECT_KEY);
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
