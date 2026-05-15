import { Store } from '@tauri-apps/plugin-store'
import { StoreConfig } from '../internal/config';
import { appDataDir } from '@tauri-apps/api/path';
import { MessageProps } from '../internal/commonTypes';


// Store Load Init
let storeLoadCache: Store | null = null
let isStoreLoadInitializing = false;

export async function initStoreClient(storageId: string): Promise<Store | null> {
    if (storeLoadCache) return storeLoadCache

    if (isStoreLoadInitializing) {
        while (isStoreLoadInitializing) {
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return storeLoadCache
    }
    isStoreLoadInitializing = true
    const storagePath = `${await appDataDir()}/localStorage/${storageId}`;
    storeLoadCache = await Store.load(storagePath)
    isStoreLoadInitializing = false
    return storeLoadCache
}

// Store Config CRUD Operations & Deps

// store configs are going to have many bytes of datas and keeping them in a single cache-file is not going to be
// efficinet while doing CRUD operations, so the aproache that im going to use is to fragment the Store-config
// to some tags and Ids and use the combination of these two as a key for doing CRUD on each part Separately
// and gather them together by `StoreConfig` as a cache file to make the Updatings more efficient.

let storeConfigCache: StoreConfig = { sessions: {} }
let isStoreConfigInitializing = false;

export async function getStoreSession(sessionStorageId: string, force?: boolean): Promise<MessageProps[] | null> {
    if (!storeLoadCache) throw new Error("store client is not Loaded!")

    const existing = storeConfigCache.sessions[sessionStorageId]
    if (existing && !force) return existing
    if (isStoreConfigInitializing) {
        while (isStoreConfigInitializing) {
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return existing ?? null
    }

    const DoesExist = await storeLoadCache.has(sessionStorageId)
    if (DoesExist) {
        const session = await storeLoadCache.get<MessageProps[]>(sessionStorageId)
        if (!session) return null
        storeConfigCache.sessions[sessionStorageId] = session
        return session
    }
    return null
}

export async function setStoreSession(sessionStorageId: string, messages: MessageProps[]): Promise<void> {
    if (!storeLoadCache) throw new Error("store client is not Loaded!")
    storeConfigCache.sessions[sessionStorageId] = messages
    await storeLoadCache.set(sessionStorageId, messages)

}