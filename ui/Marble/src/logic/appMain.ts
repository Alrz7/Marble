import { generateIdntKey } from "./enc/encHelpers.ts";
import { getHoldUser, getKeychainObject, getKeyFromArmored, initStrholdClient, setKeychainObject } from "./enc/keyChain.ts";
import { User, MARBLE_STRONGHOLD_KEY } from "./internal/commonTtypes.ts";
import { initStoreClient } from "./store/storeMain.ts";


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

  const strongholdClient = await initStrholdClient(
    vaultKey,
    MARBLE_STRONGHOLD_KEY,
  );
  if (!strongholdClient) throw new Error("Failed to initialize Stronghold client");

  const existingUserData = await getHoldUser(strongholdClient)
  if (!existingUserData || Object.keys(existingUserData).length == 0 ||
    !existingUserData.primaryUser) return null

  const entry = existingUserData.users[existingUserData.primaryUser]
  if (!entry) return null

  const privateKey = await getKeyFromArmored(entry.identityKey.privateKey, null);
  if (!privateKey) throw new Error("Failed to decode primary user's private key");

  initStoreClient(entry.storagePath)
  return {
    config: entry,
    prvIdentKey: privateKey,
  };

}
