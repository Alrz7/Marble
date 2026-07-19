import { DefDecoder, DefEncoder } from "@internal/intrCmnTypes";
import { blobFromDb } from "@internal/intrHelperfuncs";

export async function generateMasterKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function KeyToString(cryptoKey: CryptoKey): Promise<string> {
  const rawMasterKeyBuffer = await window.crypto.subtle.exportKey(
    "raw",
    cryptoKey,
  );
  const rawMasterKeyBytes = new Uint8Array(rawMasterKeyBuffer);

  let binary = "";
  for (let i = 0; i < rawMasterKeyBytes.length; i++) {
    const rbi = rawMasterKeyBytes[i];
    if (!rbi) throw new Error("Error while converting key to string");
    binary += String.fromCharCode(rbi);
  }
  return btoa(binary);
}

export async function encryptData<T>(
  data: T,
  key: CryptoKey,
): Promise<Uint8Array> {
  const jsonString = JSON.stringify(data);
  const dataBytes = DefEncoder.encode(jsonString);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    dataBytes,
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  return combined;
}

export async function decryptDataFromDb<T>(
  dbValue: unknown,
  key: CryptoKey,
): Promise<T> {
  return decryptData<T>(blobFromDb(dbValue), key);
}

export async function decryptData<T>(
  encryptedData: Uint8Array,
  key: CryptoKey,
): Promise<T> {
  try {
    const iv = encryptedData.slice(0, 12);
    const cipherBytes = encryptedData.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      cipherBytes,
    );

    const jsonString = DefDecoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch {
    throw new Error("there was an error while decrypting");
  }
}

export async function encryptMasterKeyWithKEK(
  masterKey: CryptoKey,
  kek: CryptoKey,
): Promise<Uint8Array> {
  const rawMasterKeyBuffer = await window.crypto.subtle.exportKey(
    "raw",
    masterKey,
  );
  const rawMasterKeyBytes = new Uint8Array(rawMasterKeyBuffer);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    kek,
    rawMasterKeyBytes,
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv, 0);
  combined.set(encryptedBytes, iv.length);

  return combined;
}

export async function decryptMasterKeyWithKEK(
  encryptedMasterKey: Uint8Array,
  kek: CryptoKey,
): Promise<CryptoKey> {
  const iv = encryptedMasterKey.slice(0, 12);
  const cipherBytes = encryptedMasterKey.slice(12);

  const rawMasterKeyBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    kek,
    cipherBytes,
  );

  return await GetKeyFromRawData(rawMasterKeyBuffer);
}

export async function GetKeyFromRawData(raw: ArrayBuffer): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function GetKeyFromString(key: string): Promise<CryptoKey> {
  const binary = atob(key);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return GetKeyFromRawData(bytes.buffer);
}
