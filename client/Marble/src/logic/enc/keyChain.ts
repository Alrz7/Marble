import {
  getPassword,
  setPassword,
  deletePassword,
} from "tauri-plugin-keyring-api";
import { KEYCHAIN_USER } from "@internal/intrCmnTypes";
import { fromPromiseErr, newAppErr, Result } from "@internal/golog";

// Keychain Storage (OS keychain)
export async function setKeychainObject(
  service: string,
  password: string,
): Promise<Result<void>> {
  return await fromPromiseErr(
    setPassword(service, KEYCHAIN_USER, password),
    newAppErr("KyChainFailedToSetObj", "keychain: failed to set Object"),
  );
}

export async function getKeychainObject(
  service: string,
): Promise<Result<string | null>> {
  return await fromPromiseErr(
    getPassword(service, KEYCHAIN_USER),
    newAppErr("KyChainFailedToGetObj", "keychain: failed to get Object"),
  );
}

export async function deleteKeychainObject(
  service: string,
): Promise<Result<void>> {
  return await fromPromiseErr(
    deletePassword(service, KEYCHAIN_USER),
    newAppErr("KyChainFailedToDelObj", "keychain: failed to delete Object"),
  );
}
