import { decryptDataFromDb, encryptData } from "@enc/encMaster";
import { pgpProfile, UserId } from "@internal/intrCmnTypes";
import { db } from "./dbCore";
import { getKeyFromArmored } from "@enc/encOpenpgp";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseAllErr,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";

export async function InsertPgpProfile(
  pgpProfile: pgpProfile,
  userId: UserId,
  masterKey: CryptoKey,
): Promise<Result<void>> {
  const encrypted = await fromPromiseAllErr(
    [
      encryptData(pgpProfile.PrivateKey, masterKey),
      encryptData(pgpProfile.PublicKey, masterKey),
      encryptData(pgpProfile.RevocationCertificate, masterKey),
    ],
    commonErrors.encryptionFailed,
  );
  if (!encrypted.ok) return err(encrypted.error);

  const res = await fromPromiseErr(
    db.execute(
      `INSERT INTO pgp_profile (user_id, private_key, public_key, revocation_certificate) VALUES ($1, $2, $3, $4)`,
      [userId, ...encrypted.value],
    ),
    errEdtMessage(
      commonErrors.dbfailedToInsertData,
      "error while inserting PgpProfile to Db",
    ),
  );
  if (!res.ok) return err(res.error);
  return ok(undefined);
}

export async function GetPgpProfile(
  userId: UserId,
  masterKey: CryptoKey,
): Promise<Result<pgpProfile>> {
  const res = await fromPromiseErr(
    db.select<
      {
        private_key: string;
        public_key: string;
        revocation_certificate: string;
      }[]
    >(
      `--sql
    SELECT private_key, public_key, revocation_certificate FROM pgp_profile WHERE user_id = $1`,
      [userId],
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching user's PgpProfile from db",
    ),
  );
  if (!res.ok) return err(res.error);

  if (res.value.length === 0 || !res.value[0]) {
    return err(commonErrors.noRecordFound);
  }

  const prvKey = await decryptDataFromDb<string>(
    res.value[0].private_key,
    masterKey,
  );
  if (!prvKey.ok) return err(prvKey.error);

  const actvPrvKey = await getKeyFromArmored(prvKey.value, null);
  if (!actvPrvKey.ok) return err(actvPrvKey.error);

  const decrypted = await fromPromiseAllErr([
    decryptDataFromDb<string>(res.value[0].public_key, masterKey),
    decryptDataFromDb<string>(res.value[0].revocation_certificate, masterKey),
  ]);
  if (!decrypted.ok) return err(decrypted.error);

  const existing: pgpProfile = {
    PrivateKey: prvKey.value,
    PublicKey: decrypted.value[0],
    RevocationCertificate: decrypted.value[1],
    ActivePrvKey: actvPrvKey.value,
  };

  return ok(existing);
}
