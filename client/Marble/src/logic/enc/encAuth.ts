import {
  commonErrors,
  err,
  fromPromiseErr,
  newAppErr,
  ok,
  Result,
} from "@internal/golog";
import * as argon2 from "argon2";

export async function hashPassword(password: string): Promise<Result<string>> {
  return await fromPromiseErr(
    argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    }),
    commonErrors.faildToHashPassword,
  );
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<Result<boolean>> {
  return await fromPromiseErr(
    argon2.verify(hash, password),
    commonErrors.failedToVerifyPassword,
  );
}

export async function deriveLocalKek(
  passphrase: string,
  saltBuffer: Uint8Array,
): Promise<Result<Uint8Array>> {
  const derivedKeyBuffer = await fromPromiseErr(
    argon2.hash(passphrase, {
      raw: true,
      type: argon2.argon2id,
      salt: saltBuffer,
      memoryCost: 2 ** 16,
      timeCost: 3,
      hashLength: 32,
    }),
    newAppErr(
      "failedToDeriveFromKek",
      "failed to Derive cryptoKey from PassPhrase & Kek",
    ),
  );
  if (!derivedKeyBuffer.ok) return err(derivedKeyBuffer.error);

  return ok(new Uint8Array(derivedKeyBuffer.value));
}
