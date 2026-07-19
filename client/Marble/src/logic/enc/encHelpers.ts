import { DefEncoder } from "@internal/commonTypes";
import { GetOrCreateKeyChainKey } from "./encMain";

export async function SignWithHmac(data: ArrayBuffer, kek?: CryptoKey | null) {
  if (!kek) {
    kek = await GetOrCreateKeyChainKey();
    if (!kek) throw new Error("kechainKey was not Valid");
  }

  const Hmac_key = await deriveHmacFromKek(kek);
  const signature: ArrayBuffer = await crypto.subtle.sign(
    "HMAC",
    Hmac_key,
    data,
  );
  return signature;
}

export async function VerifyWithHmac(
  data: ArrayBuffer,
  existing: ArrayBuffer,
): Promise<boolean> {
  const KEK = await GetOrCreateKeyChainKey();
  if (!KEK) throw new Error("kechainKey was not");

  const Hmac_key = await deriveHmacFromKek(KEK);
  return await crypto.subtle.verify("HMAC", Hmac_key, existing, data);
}

export async function deriveKeyFromPin(
  pin: string,
  saltString: string,
): Promise<CryptoKey> {
  // Convert PIN and Salt to bytes
  const pinBytes = DefEncoder.encode(pin);
  const saltBytes = DefEncoder.encode(saltString);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    pinBytes,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function deriveHmacFromKek(
  KEK: CryptoKey,
  infoString?: string,
): Promise<CryptoKey> {
  const rawKek = await window.crypto.subtle.exportKey("raw", KEK);
  const hkdfKey = await window.crypto.subtle.importKey(
    "raw",
    rawKek,
    "HKDF",
    false,
    ["deriveKey"],
  );

  const hmacKey = await window.crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(),
      info: DefEncoder.encode(infoString ?? "display-id-hmac"),
    },
    hkdfKey,
    {
      name: "HMAC",
      hash: "SHA-256",
      length: 256,
    },
    false,
    ["sign", "verify"],
  );
  return hmacKey;
}
