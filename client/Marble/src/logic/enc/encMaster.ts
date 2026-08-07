import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseErr,
  fromThrowableErr,
  newAppErr,
  ok,
  Result,
} from "@internal/golog";
import { DefDecoder, DefEncoder } from "@internal/intrCmnTypes";
import { blobFromDb } from "@internal/intrHelperfuncs";

export async function generateMasterKey(): Promise<Result<CryptoKey>> {
  return await fromPromiseErr(
    window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    ),
    newAppErr("failedToGenerateKey", "failed to generate new masterKey"),
  );
}

export async function KeyToString(
  cryptoKey: CryptoKey,
): Promise<Result<string>> {
  const rawMasterKeyBuffer = await fromPromiseErr(
    window.crypto.subtle.exportKey("raw", cryptoKey),
    commonErrors.faildToExportKey,
  );
  if (!rawMasterKeyBuffer.ok) return err(rawMasterKeyBuffer.error);

  const converted = fromThrowableErr(
    () => {
      const bytes = new Uint8Array(rawMasterKeyBuffer.value);
      let binary = "";
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return btoa(binary);
    },
    errEdtMessage(
      commonErrors.conversionFailed,
      "Error while converting key to string",
    ),
  );

  if (!converted.ok) return err(converted.error);
  return ok(converted.value);
}

export async function encryptData<T>(
  data: T,
  key: CryptoKey,
): Promise<Result<Uint8Array>> {
  const jsonString = fromThrowableErr(
    () => JSON.stringify(data),
    commonErrors.failedToStringifyObject,
  );
  if (!jsonString.ok) return err(jsonString.error);

  const dataBytes = DefEncoder.encode(jsonString.value);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await fromPromiseErr(
    window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      dataBytes,
    ),
    commonErrors.encryptionFailed,
  );
  if (!cipherBuffer.ok) return err(cipherBuffer.error);

  const cipherBytes = new Uint8Array(cipherBuffer.value);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  return ok(combined);
}

export async function decryptDataFromDb<T>(
  dbValue: unknown,
  key: CryptoKey,
): Promise<Result<T>> {
  const converted = blobFromDb(dbValue);
  if (!converted.ok) return err(converted.error);

  return decryptData<T>(converted.value, key);
}

export async function decryptData<T>(
  encryptedData: Uint8Array,
  key: CryptoKey,
): Promise<Result<T>> {
  if (encryptedData.byteLength < 12) {
    return err(
      errEdtMessage(
        commonErrors.decryptionFailed,
        "encrypted data is too short to contain IV",
      ),
    );
  }

  const iv = encryptedData.slice(0, 12);
  const cipherBytes = encryptedData.slice(12);

  const decryptedBuffer = await fromPromiseErr(
    window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, cipherBytes),
    commonErrors.decryptionFailed,
  );
  if (!decryptedBuffer.ok) return err(decryptedBuffer.error);

  const jsonString = DefDecoder.decode(decryptedBuffer.value);
  const res = fromThrowableErr(
    () => JSON.parse(jsonString) as T,
    commonErrors.failedToParseJsonString,
  );
  if (!res.ok) return err(res.error);
  return ok(res.value);
}

export async function encryptMasterKey(
  masterKey: CryptoKey,
  encryptionKey: CryptoKey,
): Promise<Result<Uint8Array>> {
  const rawMasterKeyBuffer = await fromPromiseErr(
    window.crypto.subtle.exportKey("raw", masterKey),
    commonErrors.faildToExportKey,
  );
  if (!rawMasterKeyBuffer.ok) return err(rawMasterKeyBuffer.error);

  const rawMasterKeyBytes = new Uint8Array(rawMasterKeyBuffer.value);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await fromPromiseErr(
    window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      encryptionKey,
      rawMasterKeyBytes,
    ),
    errEdtMessage(commonErrors.encryptionFailed, "failed to encrypt MasterKey"),
  );
  if (!encryptedBuffer.ok) return err(encryptedBuffer.error);

  const encryptedBytes = new Uint8Array(encryptedBuffer.value);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv, 0);
  combined.set(encryptedBytes, iv.length);

  return ok(combined);
}

export async function decryptMasterKeyFromDb(
  dbValue: unknown,
  key: CryptoKey,
): Promise<Result<CryptoKey>> {
  const converted = blobFromDb(dbValue);
  if (!converted.ok) return err(converted.error);

  return decryptMasterKey(converted.value, key);
}

export async function decryptMasterKey(
  encryptedMasterKey: Uint8Array,
  encryptionKey: CryptoKey,
): Promise<Result<CryptoKey>> {
  if (encryptedMasterKey.byteLength < 12) {
    return err(
      errEdtMessage(
        commonErrors.decryptionFailed,
        "encrypted master key data is too short to contain IV",
      ),
    );
  }

  const iv = encryptedMasterKey.slice(0, 12);
  const cipherBytes = encryptedMasterKey.slice(12);

  const rawMasterKeyBuffer = await fromPromiseErr(
    window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      encryptionKey,
      cipherBytes,
    ),
    errEdtMessage(commonErrors.decryptionFailed, "failed to decrypt MasterKey"),
  );
  if (!rawMasterKeyBuffer.ok) return err(rawMasterKeyBuffer.error);

  return await GetKeyFromRawData(rawMasterKeyBuffer.value);
}

export async function GetKeyFromRawData(
  raw: Uint8Array | ArrayBuffer,
): Promise<Result<CryptoKey>> {
  const bufferSource = (
    raw instanceof Uint8Array ? raw.buffer : raw
  ) as ArrayBuffer;

  return await fromPromiseErr(
    window.crypto.subtle.importKey(
      "raw",
      bufferSource,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    ),
    newAppErr("failedToImportKey", "failed to Import CryptoKey from Raw-Data"),
  );
}

export async function GetKeyFromString(
  key: string,
): Promise<Result<CryptoKey>> {
  const parsedBytes = fromThrowableErr(
    () => {
      const binary = atob(key);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    },
    errEdtMessage(commonErrors.conversionFailed, "Invalid Base64 key string"),
  );

  if (!parsedBytes.ok) return err(parsedBytes.error);

  return GetKeyFromRawData(parsedBytes.value.buffer);
}
