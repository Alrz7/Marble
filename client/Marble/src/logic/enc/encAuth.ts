import { invoke } from "@tauri-apps/api/core";
import { commonErrors, fromPromiseErr, Result } from "@internal/golog";

export async function deriveRawKeyFromPassword(
  password: string,
  saltBuffer: Uint8Array,
  hashLength = 32,
): Promise<Result<Uint8Array>> {
  const promise = invoke<number[]>("derive_raw_key_from_password", {
    password,
    saltBuffer: Array.from(saltBuffer),
    hashLength: hashLength,
  }).then((res) => new Uint8Array(res));

  return await fromPromiseErr(promise, commonErrors.faildToHashPassword);
}

export async function deriveDecodedKeyFromPassword(
  passphrase: string,
): Promise<Result<string>> {
  return await fromPromiseErr(
    invoke<string>("derive_decoded_key_from_password", {
      passphrase,
    }),
    commonErrors.faildToHashPassword,
  );
}

export async function verifyDailyPassphrase(
  savedEncodedHash: string,
  inputPassphrase: string,
): Promise<Result<boolean>> {
  return await fromPromiseErr(
    invoke<boolean>("verify_daily_passphrase", {
      savedEncodedHash: savedEncodedHash,
      inputPassphrase: inputPassphrase,
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
