import { Store } from "@tauri-apps/plugin-store";
import { appDataDir } from "@tauri-apps/api/path";

/** 
    App sessions are currently getting saved along with the user datas inside the
    stronghold but keeping messages inside there is not a good idea
    it will cause big delays on loading and savings, the other choise is the Store plugin
    <this file> which has the same issues but for simplicity im currently using this one
    and the right method for saving messages is an actual db like SQLite.
    i chose SQLite for now but im not going to initiate it right now, cuz i got many things
    to do that have higher prioritys But, we will get back to this for sure...
 */

// Store Load Init
let storeLoadCache: Store | null = null;
let isStoreLoadInitializing = false;

export async function initStoreClient(
  storageId: string,
): Promise<Store | null> {
  if (storeLoadCache) return storeLoadCache;

  if (isStoreLoadInitializing) {
    while (isStoreLoadInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return storeLoadCache;
  }
  isStoreLoadInitializing = true;
  const storagePath = `${await appDataDir()}/localStorage/${storageId}`;
  storeLoadCache = await Store.load(storagePath);
  isStoreLoadInitializing = false;
  return storeLoadCache;
}

// Store Config CRUD Operations & Deps
export async function getStoreSessions(): Promise<Record<
  string,
  string[]
> | null> {
  if (!storeLoadCache) throw new Error("store client is not Loaded!");
  const DoesExist = await storeLoadCache.has("sessions");
  if (DoesExist) {
    const sessions =
      await storeLoadCache.get<Record<string, string[]>>("sessions");
    return sessions ?? null;
  }
  return null;
}

export async function setStoreSession(
  sessionStorageId: string,
  encMessages: string[],
): Promise<void> {
  if (!storeLoadCache) throw new Error("store client is not Loaded!");
  let existing: Record<string, string[]> | null = await getStoreSessions();
  if (!existing) existing = {};
  existing[sessionStorageId] = encMessages;
  await storeLoadCache.set("sessions", existing);
}

export async function addStoreSession(
  sessionStorageId: string,
  encMessage: string,
): Promise<void> {
  if (!storeLoadCache) throw new Error("store client is not Loaded!");
  let existing: Record<string, string[]> | null = await getStoreSessions();
  if (!existing) existing = {};
  if (existing[sessionStorageId]) {
    existing[sessionStorageId].push(encMessage);
  } else {
    existing[sessionStorageId] = [encMessage];
  }

  await storeLoadCache.set("sessions", existing);
}
