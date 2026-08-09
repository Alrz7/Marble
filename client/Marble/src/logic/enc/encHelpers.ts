import { DefEncoder } from "@internal/intrCmnTypes";
import {
  commonErrors,
  err,
  fromPromiseErr,
  newAppErr,
  ok,
  Result,
} from "@internal/golog";

export async function createUsernameLookupHash(
  username: string,
  salt: Uint8Array,
): Promise<Result<Uint8Array>> {
  const usernameBytes = DefEncoder.encode(username);

  const hmacRes = await SignWithHmac(usernameBytes.buffer as ArrayBuffer, salt);
  if (!hmacRes.ok) return err(hmacRes.error);

  return ok(new Uint8Array(hmacRes.value));
}

export async function SignWithHmac(
  data: BufferSource,
  key: Uint8Array,
): Promise<Result<ArrayBuffer>> {
  const hmacKeyRes = await getHmacKeyFromKeyPhrase(key);
  if (!hmacKeyRes.ok) return err(hmacKeyRes.error);

  return await fromPromiseErr(
    crypto.subtle.sign("HMAC", hmacKeyRes.value, data),
    newAppErr("HMACfailedToSignData", "failed to sign data by HMAC"),
  );
}

export async function VerifyWithHmac(
  data: BufferSource,
  key: Uint8Array,
  signature: ArrayBuffer,
): Promise<Result<boolean>> {
  const hmacKeyRes = await getHmacKeyFromKeyPhrase(key);
  if (!hmacKeyRes.ok) return err(hmacKeyRes.error);

  return await fromPromiseErr(
    crypto.subtle.verify("HMAC", hmacKeyRes.value, signature, data),
    newAppErr("HMACfailedToVerifyData", "failed to verify data by HMAC"),
  );
}

export async function getHmacKeyFromKeyPhrase(
  key: Uint8Array,
): Promise<Result<CryptoKey>> {
  const hmacKey = await fromPromiseErr(
    window.crypto.subtle.importKey(
      "raw",
      key as BufferSource,
      {
        name: "HMAC",
        hash: "SHA-256",
        length: 256,
      },
      false,
      ["sign", "verify"],
    ),
    newAppErr("failedToDeriveKey", "failed to Derive Crypto Key"),
  );
  if (!hmacKey.ok) return err(hmacKey.error);

  return ok(hmacKey.value);
}

export function genCryptoRandomValue(length: number = 32) {
  const keyArray = new Uint8Array(length);
  window.crypto.getRandomValues(keyArray);
  return keyArray;
}

// this was the old version for displayId HMAC proccess
export async function deriveHmacFromKey(
  key: CryptoKey,
  infoString?: string,
): Promise<Result<CryptoKey>> {
  const rawKek = await fromPromiseErr(
    window.crypto.subtle.exportKey("raw", key),
    commonErrors.faildToExportKey,
  );
  if (!rawKek.ok) return err(rawKek.error);

  const hkdfKey = await fromPromiseErr(
    window.crypto.subtle.importKey("raw", rawKek.value, "HKDF", false, [
      "deriveKey",
    ]),
    commonErrors.faildToImportKey,
  );
  if (!hkdfKey.ok) return err(hkdfKey.error);

  const hmacKey = await fromPromiseErr(
    window.crypto.subtle.deriveKey(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: new Uint8Array(),
        info: DefEncoder.encode(infoString ?? "display-id-hmac"),
      },
      hkdfKey.value,
      {
        name: "HMAC",
        hash: "SHA-256",
        length: 256,
      },
      false,
      ["sign", "verify"],
    ),
    newAppErr("failedToDeriveKey", "failed to Derive Crypto Key"),
  );
  if (!hmacKey.ok) return err(hmacKey.error);

  return ok(hmacKey.value);
}

export async function deriveKeyFromPin(
  pin: string,
  saltString: string,
): Promise<Result<CryptoKey>> {
  const pinBytes = DefEncoder.encode(pin);
  const saltBytes = DefEncoder.encode(saltString);

  const baseKeyRes = await fromPromiseErr(
    window.crypto.subtle.importKey("raw", pinBytes, { name: "PBKDF2" }, false, [
      "deriveKey",
    ]),
    commonErrors.faildToImportKey,
  );
  if (!baseKeyRes.ok) return err(baseKeyRes.error);

  const derivedKeyRes = await fromPromiseErr(
    window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 600000,
        hash: "SHA-256",
      },
      baseKeyRes.value,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    ),
    newAppErr(
      "failedToDeriveKeyFromPin",
      "failed to derive key from PIN using PBKDF2",
    ),
  );
  if (!derivedKeyRes.ok) return err(derivedKeyRes.error);

  return ok(derivedKeyRes.value);
}
