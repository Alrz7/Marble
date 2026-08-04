import {
  commonErrors,
  err,
  fromPromiseErr,
  newAppErr,
  ok,
  Result,
} from "@internal/golog";
import { argon2id, argon2Verify } from "hash-wasm";

export async function deriveRawKeyFromPassword(
  password: string,
  saltBuffer: Uint8Array,
): Promise<Result<Uint8Array>> {
  return await fromPromiseErr(
    argon2id({
      password,
      salt: saltBuffer,
      parallelism: 1,
      iterations: 3,
      memorySize: 2 ** 16,
      hashLength: 32,
      outputType: "binary",
    }),
    commonErrors.faildToHashPassword,
  );
}

export async function hashDailyPassphrase(
  passphrase: string,
): Promise<Result<string>> {
  const randomSalt = window.crypto.getRandomValues(new Uint8Array(16));
  return await fromPromiseErr(
    argon2id({
      password: passphrase,
      salt: randomSalt,
      parallelism: 1,
      iterations: 3,
      memorySize: 2 ** 16,
      hashLength: 32,
      outputType: "encoded",
    }),
    commonErrors.faildToHashPassword,
  );
}

export async function verifyDailyPassphrase(
  savedEncodedHash: string,
  inputPassphrase: string,
): Promise<Result<boolean>> {
  return await fromPromiseErr(
    argon2Verify({
      password: inputPassphrase,
      hash: savedEncodedHash,
    }),
    commonErrors.failedToVerifyPassword,
  );
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function deriveLocalKek(
  passphrase: string,
  saltBuffer: Uint8Array,
): Promise<Result<Uint8Array>> {
  const derivedKeyBuffer = await fromPromiseErr(
    argon2id({
      password: passphrase,
      salt: saltBuffer,
      parallelism: 1,
      iterations: 3,
      memorySize: 2 ** 16,
      hashLength: 32,
      outputType: "binary",
    }),
    newAppErr(
      "failedToDeriveFromKek",
      "failed to Derive cryptoKey from PassPhrase & Kek",
    ),
  );
  if (!derivedKeyBuffer.ok) return err(derivedKeyBuffer.error);

  return ok(derivedKeyBuffer.value);
}
