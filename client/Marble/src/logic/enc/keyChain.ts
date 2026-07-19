import {
  getPassword,
  setPassword,
  deletePassword,
} from "tauri-plugin-keyring-api";
import { KEYCHAIN_USER } from "@internal/intrCmnTypes";

// Keychain Storage (OS keychain)
export async function setKeychainObject(
  service: string,
  password: string,
): Promise<void> {
  await setPassword(service, KEYCHAIN_USER, password);
}

export async function getKeychainObject(
  service: string,
): Promise<string | null> {
  return await getPassword(service, KEYCHAIN_USER);
}

export async function deleteKeychainObject(service: string): Promise<void> {
  await deletePassword(service, KEYCHAIN_USER);
}
