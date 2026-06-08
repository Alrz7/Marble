import { signIn } from "../auth/login.ts";
import { generateIdntKey, getKeyFromArmored } from "../enc/encMain.ts";
import { initClient } from "../localStore/strMain.ts";
import { getKeychainObject, setKeychainObject } from "../enc/keyChain.ts";
import { User, MARBLE_STRONGHOLD_KEY } from "../internal/commonTypes.ts";
import { getUser } from "../localStore/strUser.ts";
import { initStoreClient } from "../localStore/tmpMessageStore.ts";

async function getOrCreateVaultKey(): Promise<string> {
  const existing = await getKeychainObject(MARBLE_STRONGHOLD_KEY);
  if (existing) return existing;

  const { privateKey } = await generateIdntKey(
    "chainKey",
    "marbledev@gmail.com",
  );
  await setKeychainObject(MARBLE_STRONGHOLD_KEY, privateKey);
  return privateKey;
}

export async function loadConfig(): Promise<User | null> {
  const vaultKey = await getOrCreateVaultKey();

  const strongholdClient = await initClient(vaultKey, MARBLE_STRONGHOLD_KEY);
  if (!strongholdClient)
    throw new Error("Failed to initialize Stronghold client");

  const existingUserData = await getUser(strongholdClient);
  if (
    !existingUserData ||
    Object.keys(existingUserData).length == 0 ||
    !existingUserData.primaryUser
  )
    return null;

  const entry = existingUserData.users[existingUserData.primaryUser];
  if (!entry) return null;

  const privateKey = await getKeyFromArmored(
    entry.identityKey.privateKey,
    null,
  );
  if (!privateKey)
    throw new Error("Failed to decode primary user's private key");
  initStoreClient(entry.storagePath);
  signIn(entry.display_id, "testingg!"); // this is gonna be replaced with autoSignIn() later
  return {
    config: entry,
    prvIdentKey: privateKey,
  };
}
