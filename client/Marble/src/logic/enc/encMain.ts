import { MAIN_KEY } from "@internal/intrCmnTypes";
import { getKeychainObject, setKeychainObject } from "./keyChain";
import { generateMasterKey, GetKeyFromString, KeyToString } from "./encMaster";
import { err, ok, Result } from "@internal/golog";

export let KEYCHAIN_KEY: CryptoKey | null = null;
let loadingKey: boolean = false;

export async function GetOrCreateKeyChainKey(): Promise<
  Result<CryptoKey | null>
> {
  if (KEYCHAIN_KEY) return ok(KEYCHAIN_KEY);

  if (loadingKey) {
    while (loadingKey) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return ok(KEYCHAIN_KEY);
  }
  loadingKey = true;

  const existing = await getKeychainObject(MAIN_KEY);
  if (!existing.ok) return err(existing.error);
  if (existing.value) {
    const res = await GetKeyFromString(existing.value);
    if (!res.ok) return err(res.error);
    KEYCHAIN_KEY = res.value;
    return ok(res.value);
  }

  const newKey = await generateMasterKey();
  if (!newKey.ok) return err(newKey.error);
  KEYCHAIN_KEY = newKey.value;
  const keychainKeybase64 = await KeyToString(KEYCHAIN_KEY);
  if (!keychainKeybase64.ok) return err(keychainKeybase64.error);
  await setKeychainObject(MAIN_KEY, keychainKeybase64.value);
  loadingKey = false;
  return ok(KEYCHAIN_KEY);
}
