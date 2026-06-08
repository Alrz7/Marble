/**
 * Manages data stored in Stronghold and the keys to encrypt them.
 * Stronghold is secured by an OpenPGP Curve25519 key which is saved in the Keychain.
 * The key is created once automatically on first start and can be changed by the user.
 */
import { Stronghold, Client } from "@tauri-apps/plugin-stronghold";
import { appDataDir } from "@tauri-apps/api/path";
import {
  MARBLE_STRONGHOLD_KEY,
} from "../internal/commonTypes";
import { getKeychainObject } from "../enc/keyChain";

// Stronghold Initialisation
export type Load = { stronghold: Stronghold; client: Client };

export let cachedLoad: Load | null = null;
export let isInitializing = false;

export async function initClient(
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
    const vaultPath = `${await appDataDir()}/localStorage/config.hold`;

    if (!vaultKey) {
      const storedKey = await getKeychainObject(MARBLE_STRONGHOLD_KEY);
      if (!storedKey) throw new Error("couldn't Provide the Strong-Hold-Key");
      vaultKey = storedKey;
    }

    const stronghold = await Stronghold.load(vaultPath, vaultKey);
    const client = await loadOrCreateClient(
      stronghold,
      clientName ?? MARBLE_STRONGHOLD_KEY,
    );

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
  cachedLoad?.stronghold.unload;
  cachedLoad = null;
}

// ---------------------------------------------------------------------------
// User Config Management (CRUD on Stronghold)

export async function setData(
  newData: string,
  objectKey: string,
  load?: Load | null,
) {
  if (!load) {
    load = await initClient();
    if (!load) throw new Error("could't load a storeClient");
  }
  const store = load.client.getStore();
  const dataBytes = new TextEncoder().encode(newData);
  await store.insert(objectKey, Array.from(dataBytes));
  await load.stronghold.save();
}

export async function getData(
  objectKey: string,
  load?: Load | null,
): Promise<string | null> {
  if (!load) {
    load = await initClient();
    if (!load) throw new Error("could't load a storeClient");
  }

  const store = load.client.getStore();
  const data = await store.get(objectKey);
  if (!data) return null;

  return new TextDecoder().decode(new Uint8Array(data));
}

export async function deleteData(
  objectKey: string,
  load?: Load | null,
): Promise<void> {
  if (!load) {
    load = await initClient();
    if (!load) throw new Error("could't load a storeClient");
  }

  const store = load.client.getStore();
  await store.remove(objectKey);
}

