import { commonErrors, fromPromiseErr, Result } from "@internal/golog";
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
