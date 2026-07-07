import { MAIN_KEY } from "../internal/commonTypes";
import {
  getKeychainObject,
  setKeychainObject,
} from "./keyChain";
import { generateMasterKey, GetKeyFromString, KeyToString } from "./encMaster";

export var KEYCHAIN_KEY: CryptoKey | null = null;
var loadingKey: boolean = false;

export async function GetOrCreateKeyChainKey(): Promise<CryptoKey | null> {
  if (KEYCHAIN_KEY) return KEYCHAIN_KEY;

  if (loadingKey) {
    while (loadingKey) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return KEYCHAIN_KEY;
  }
  loadingKey = true;

  try {
    const existing = await getKeychainObject(MAIN_KEY);
    if (existing) {
      KEYCHAIN_KEY = await GetKeyFromString(existing);
      return KEYCHAIN_KEY;
    }

    KEYCHAIN_KEY = await generateMasterKey();
    const keychainKeybase64 = await KeyToString(KEYCHAIN_KEY);
    await setKeychainObject(MAIN_KEY, keychainKeybase64);
    return KEYCHAIN_KEY;
  } finally {
    loadingKey = false;
  }
}
