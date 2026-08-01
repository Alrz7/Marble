import {
  decryptDataFromDb,
  decryptMasterKeyWithKEK,
  encryptData,
  encryptMasterKeyWithKEK,
} from "@enc/encMaster";
import {
  DefEncoder,
  pgpProfile,
  User,
  UserConfig,
  UserId,
} from "@internal/intrCmnTypes";
import { db } from "./dbMain";
import { getKeyFromArmored } from "@enc/encOpenpgp";
import { SignWithHmac } from "@enc/encHelpers";
import { blobFromDb } from "@internal/intrHelperfuncs";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseAllErr,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";

// ------- Users --------
export async function InsertUser(
  user: User,
  keychainKey: CryptoKey,
): Promise<Result<number>> {
  const encrypted = await fromPromiseAllErr(
    [
      encryptData(user.config.userId, keychainKey),
      encryptData(user.config.displayId, keychainKey),
      SignWithHmac(DefEncoder.encode(user.config.displayId).buffer),
      encryptData(user.config.name, keychainKey),
      encryptData(user.config.email, keychainKey),
      encryptMasterKeyWithKEK(user.MasterKey, keychainKey),
      encryptData(user.config.profile_avatar, keychainKey),
    ],
    commonErrors.encryptionFailed,
  );
  if (!encrypted.ok) return err(encrypted.error);

  const res = await fromPromiseErr(
    db.select<{ id: number }[]>(
      `INSERT INTO users (user_id, display_id, hmac_display_id, name, email, encrypted_master_key, profile_avatar) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
      encrypted.value,
    ),
    errEdtMessage(
      commonErrors.dbfailedToInsertData,
      "error while inserting User in Db",
    ),
  );
  if (!res.ok) return err(res.error);

  if (!res.value[0])
    return err(
      errEdtMessage(
        commonErrors.dbfailedToInsertData,
        "error while inserting audience, id was not found",
      ),
    );

  const pgpinsert = await InsertPgpProfile(
    user.Pgp,
    res.value[0].id,
    user.MasterKey,
  );
  if (!pgpinsert.ok) return err(pgpinsert.error);

  return ok(res.value[0].id);
}

export async function GetUser(
  keychainKey: CryptoKey,
  id: number | null,
  display_id: ArrayBuffer | null,
): Promise<Result<User>> {
  let selectBy: string;
  let targetVal: number | ArrayBuffer;

  if (id !== null) {
    selectBy = "id";
    targetVal = id;
  } else if (display_id !== null) {
    selectBy = "hmac_display_id";
    targetVal = display_id;
  } else {
    return err(
      errEdtMessage(
        commonErrors.unexpectedInput,
        "error while geting user from db: either id or display_id is expected",
      ),
    );
  }

  const res = await fromPromiseErr(
    db.select<
      {
        id: number;
        user_id: string;
        display_id: string;
        name: string;
        email: string;
        encrypted_master_key: string;
        profile_avatar: string;
      }[]
    >(
      `SELECT id, user_id, display_id, name, email, encrypted_master_key, profile_avatar FROM users WHERE ${selectBy} = $1`,
      [targetVal],
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching user from db",
    ),
  );
  if (!res.ok) return err(res.error);

  if (res.value.length === 0 || !res.value[0]) {
    return err(commonErrors.noRecordFound);
  }

  const decryprted = await fromPromiseAllErr([
    decryptDataFromDb<number>(res.value[0].user_id, keychainKey),
    decryptDataFromDb<string>(res.value[0].display_id, keychainKey),
    decryptDataFromDb<string>(res.value[0].name, keychainKey),
    decryptDataFromDb<string>(res.value[0].email, keychainKey),
    decryptDataFromDb<string>(res.value[0].profile_avatar, keychainKey),
  ]);
  if (!decryprted.ok) return err(decryprted.error);
  const [userId, displayId, name, email, profile_avatar] = decryprted.value;

  const config: UserConfig = {
    id: res.value[0].id,
    userId: userId,
    displayId: displayId,
    name: name,
    email: email,
    profile_avatar: profile_avatar,
  };
  const converted = blobFromDb(res.value[0].encrypted_master_key);
  if (!converted.ok) return err(converted.error);

  const masterKey = await decryptMasterKeyWithKEK(converted.value, keychainKey);
  if (!masterKey.ok) return err(masterKey.error);

  const pgpProfile = await GetPgpProfile(config.id, masterKey.value);
  if (!pgpProfile.ok) return err(pgpProfile.error);

  return ok({
    config,
    MasterKey: masterKey.value,
    Pgp: pgpProfile.value,
  });
}

export async function getActiveUserId(): Promise<Result<UserId>> {
  const res = await fromPromiseErr(
    db.select<{ value: number }[]>(
      "SELECT value FROM app_settings WHERE key = 'active_user_id'",
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "failed to get active-User-Id from Db",
    ),
  );
  if (!res.ok) return err(res.error);

  return ok(res.value[0]?.value ?? -1);
}

export async function SetActiveUserId(userId: UserId): Promise<void> {
  await db.execute(
    "UPDATE app_settings SET value = ? WHERE key = 'active_user_id'",
    [userId],
  );
}

// ----- Pgp Profile ------

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
