import { AuthMethod, DefEncoder, MAIN_KEY } from "@internal/intrCmnTypes";
import { getKeychainObject, setKeychainObject } from "./keyChain";
import {
  generateMasterKey,
  GetKeyFromRawData,
  GetKeyFromString,
  KeyToString,
} from "./encMaster";
import { commonErrors, err, errEdtMessage, ok, Result } from "@internal/golog";
import { deriveRawKeyFromPassword } from "./encAuth";

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

export async function GetMasterKeyFromMasterString(
  masterString: string,
): Promise<Result<CryptoKey>> {
  const localMasterHash = await deriveRawKeyFromPassword(
    masterString,
    DefEncoder.encode("local-masterKey-salt"),
  );
  if (!localMasterHash.ok) {
    return err(localMasterHash.error);
  }
  const localMasterKey = await GetKeyFromRawData(localMasterHash.value);
  if (!localMasterKey.ok) {
    return err(localMasterKey.error);
  }
  return ok(localMasterKey.value);
}

export async function GetWrappingKeyByMethod(
  authMethod: AuthMethod,
  passPhrase?: string,
) {
  if (authMethod == "keychain" || authMethod == "keychain-passphrase") {
    const existingKek = await GetOrCreateKeyChainKey();
    if (!existingKek.ok) {
      return err(existingKek.error);
    }
    if (existingKek.value == null) {
      return err(commonErrors.keychainKeyNotValid);
    }

    if (authMethod == "keychain-passphrase") {
      if (!passPhrase)
        return err(
          errEdtMessage(
            commonErrors.unexpectedInput,
            "error while getting Wrapping key: passPhrase is expected",
          ),
        );

      const KekInStr = await KeyToString(existingKek.value);
      if (!KekInStr.ok) return err(KekInStr.error);

      const finalHash = await deriveRawKeyFromPassword(
        passPhrase,
        DefEncoder.encode(KekInStr.value),
      );
      if (!finalHash.ok) return err(finalHash.error);

      const combinedKey = await GetKeyFromRawData(finalHash.value);
      if (!combinedKey.ok) return err(combinedKey.error);

      return ok(combinedKey.value);
    } else {
      return ok(existingKek.value);
    }
  } else {
    if (!passPhrase)
      return err(
        errEdtMessage(
          commonErrors.unexpectedInput,
          "error while getting Wrapping key: passPhrase is expected",
        ),
      );

    const salt = DefEncoder.encode("passphrase-wrapping-salt");
    const passPhraseHash = await deriveRawKeyFromPassword(passPhrase, salt);
    if (!passPhraseHash.ok) return err(passPhraseHash.error);

    return await GetKeyFromRawData(passPhraseHash.value);
  }
}
