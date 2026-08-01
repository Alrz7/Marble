import { DefEncoder } from "@internal/intrCmnTypes";
import { GetOrCreateKeyChainKey } from "./encMain";
import {
  commonErrors,
  err,
  fromPromiseErr,
  newAppErr,
  ok,
  Result,
} from "@internal/golog";

export async function SignWithHmac(
  data: ArrayBuffer,
  kek?: CryptoKey | null,
): Promise<Result<ArrayBuffer>> {
  if (!kek) {
    const existing = await GetOrCreateKeyChainKey();
    if (!existing.ok) return err(existing.error);
    if (!existing.value) return err(commonErrors.keychainKeyNotValid);
    kek = existing.value;
  }

  const hmacKeyRes = await deriveHmacFromKek(kek);
  if (!hmacKeyRes.ok) return err(hmacKeyRes.error);

  return await fromPromiseErr(
    crypto.subtle.sign("HMAC", hmacKeyRes.value, data),
    newAppErr("HMACfailedToSignData", "failed to sign data by HMAC"),
  );
}

export async function VerifyWithHmac(
  data: ArrayBuffer,
  signature: ArrayBuffer,
): Promise<Result<boolean>> {
  const kekRes = await GetOrCreateKeyChainKey();
  if (!kekRes.ok) return err(kekRes.error);
  if (!kekRes.value) return err(commonErrors.keychainKeyNotValid);

  const hmacKeyRes = await deriveHmacFromKek(kekRes.value);
  if (!hmacKeyRes.ok) return err(hmacKeyRes.error);

  return await fromPromiseErr(
    crypto.subtle.verify("HMAC", hmacKeyRes.value, signature, data),
    newAppErr("HMACfailedToVerifyData", "failed to verify data by HMAC"),
  );
}

export async function deriveKeyFromPin(
  pin: string,
  saltString: string,
): Promise<Result<CryptoKey>> {
  const pinBytes = DefEncoder.encode(pin);
  const saltBytes = DefEncoder.encode(saltString);

  const baseKeyRes = await fromPromiseErr(
    window.crypto.subtle.importKey(
      "raw",
      pinBytes,
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    ),
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

export async function deriveHmacFromKek(
  KEK: CryptoKey,
  infoString?: string,
): Promise<Result<CryptoKey>> {
  const rawKek = await fromPromiseErr(
    window.crypto.subtle.exportKey("raw", KEK),
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