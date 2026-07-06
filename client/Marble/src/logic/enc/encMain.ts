import { MAIN_KEY, MARBLE_STRONGHOLD_KEY } from "../internal/commonTypes";
import {
  deleteKeychainObject,
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

  const existing = await getKeychainObject(MAIN_KEY);
  deleteKeychainObject(MARBLE_STRONGHOLD_KEY); // twmperory      one time only       !!!!!!!
  if (existing) {
    KEYCHAIN_KEY = await GetKeyFromString(existing);
    return KEYCHAIN_KEY;
  }

  KEYCHAIN_KEY = await generateMasterKey();
  const keychainKeybase64 = await KeyToString(KEYCHAIN_KEY);
  await setKeychainObject(MARBLE_STRONGHOLD_KEY, keychainKeybase64);
  return KEYCHAIN_KEY;
}
