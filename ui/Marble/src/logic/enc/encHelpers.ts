import {
  getPassword,
  setPassword,
  deletePassword,
} from "tauri-plugin-keyring-api";

const user = "Marble";

export async function SetkeyChainObject(service: string, password: string) {
  await setPassword(service, user, password);
}

export async function GetkeyChainObject(service: string) {
  return await getPassword(service, user);
}

export async function DeletekeyChainObject(service: string) {
  await deletePassword(service, user);
}
