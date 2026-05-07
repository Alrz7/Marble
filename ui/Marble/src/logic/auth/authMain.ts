import { generateIdntKey } from "../enc/encMain.ts";
import { getHoldUser, getKeychainObject, getKeyFromArmored, initStrholdClient, setKeychainObject } from "../enc/encStoreManagement.ts";
import { User, MARBLE_STRONGHOLD_KEY, DEFAULT_OBJECT_KEY } from "../internal/commonTtypes.ts";



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
  if (!strongholdClient) {
    throw new Error("Failed to initialize Stronghold client");
  }

  const configEntries = await getHoldUser(
    DEFAULT_OBJECT_KEY,
    strongholdClient
  );
  if (!configEntries) {
    // throw new Error("No configuration found");
    return null
  }

  for (const [, entry] of configEntries) {
    if (!entry.primary) continue;

    const privateKey = await getKeyFromArmored(
      entry.identityKey.privateKey,
      null,
    );
    if (!privateKey) {
      throw new Error("Failed to decode primary user's private key");
    }

    return {
      config: entry,
      prvIdentKey: privateKey,
    };
  }

  throw new Error("No primary user found in configuration");
}
