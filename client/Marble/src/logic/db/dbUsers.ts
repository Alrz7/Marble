import {
  decryptDataFromDb,
  decryptMasterKey,
  encryptData,
  encryptMasterKey,
} from "@enc/encMaster";
import {
  AuthMethod,
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
  masterKey: CryptoKey,
  wrappingKey: CryptoKey,
): Promise<Result<number>> {
  const encrypted = await fromPromiseAllErr(
    [
      encryptData(user.config.userId, masterKey),
      encryptData(user.config.displayId, masterKey),
      SignWithHmac(DefEncoder.encode(user.config.displayId).buffer),
      encryptData(user.config.name, masterKey),
      encryptData(user.config.email, masterKey),
      encryptMasterKey(user.MasterKey, wrappingKey),
      encryptData(user.config.profile_avatar, masterKey),
    ],
    commonErrors.encryptionFailed,
  );
  if (!encrypted.ok) return err(encrypted.error);

  const res = await fromPromiseErr(
    db.select<{ id: number }[]>(
      `INSERT INTO users (auth_method, user_id, display_id, hmac_display_id, name, email, encrypted_master_key, profile_avatar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id`,
      [user.authMethod, ...encrypted.value],
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

type dbUserConfig = {
  auth_method: string;
  id: number;
  user_id: string;
  display_id: string;
  name: string;
  email: string;
  encrypted_master_key: string;
  profile_avatar: string;
};

export async function getUserByWrappingKey(
  wrappingKey: CryptoKey,
  id: number | null,
): Promise<Result<User>> {
  const res = await fromPromiseErr(
    db.select<dbUserConfig[]>(
      `SELECT auth_method, id, user_id, display_id, name, email, encrypted_master_key, profile_avatar FROM users WHERE id = $1`,
      [id],
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

  const converted = blobFromDb(res.value[0].encrypted_master_key);
  if (!converted.ok) return err(converted.error);

  const masterKey = await decryptMasterKey(converted.value, wrappingKey);
  if (!masterKey.ok) return err(masterKey.error);

  const config = await getDataFromEncrypted(res.value[0], masterKey.value);
  if (!config.ok) return err(config.error);

  const pgpProfile = await GetPgpProfile(config.value.id, masterKey.value);
  if (!pgpProfile.ok) return err(pgpProfile.error);

  return ok({
    config: config.value,
    MasterKey: masterKey.value,
    Pgp: pgpProfile.value,
    authMethod: res.value[0].auth_method as AuthMethod,
  });
}

export async function getUserByMasterKey(
  masterKey: CryptoKey,
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
    db.select<dbUserConfig[]>(
      `SELECT auth_method, id, user_id, display_id, name, email, encrypted_master_key, profile_avatar FROM users WHERE ${selectBy} = $1`,
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

  const config = await getDataFromEncrypted(res.value[0], masterKey);
  if (!config.ok) return err(config.error);

  const pgpProfile = await GetPgpProfile(config.value.id, masterKey);
  if (!pgpProfile.ok) return err(pgpProfile.error);

  return ok({
    config: config.value,
    MasterKey: masterKey,
    Pgp: pgpProfile.value,
    authMethod: res.value[0].auth_method as AuthMethod,
  });
}

async function getDataFromEncrypted(
  encryptData: dbUserConfig,
  masterKey: CryptoKey,
): Promise<Result<UserConfig>> {
  const decryprted = await fromPromiseAllErr([
    decryptDataFromDb<number>(encryptData.user_id, masterKey),
    decryptDataFromDb<string>(encryptData.display_id, masterKey),
    decryptDataFromDb<string>(encryptData.name, masterKey),
    decryptDataFromDb<string>(encryptData.email, masterKey),
    decryptDataFromDb<string>(encryptData.profile_avatar, masterKey),
  ]);
  if (!decryprted.ok) return err(decryprted.error);
  const [userId, displayId, name, email, profile_avatar] = decryprted.value;

  const config: UserConfig = {
    id: encryptData.id,
    userId: userId,
    displayId: displayId,
    name: name,
    email: email,
    profile_avatar: profile_avatar,
  };
  return ok(config);
}

export async function GetUserAuthMethod(
  id: number,
): Promise<Result<AuthMethod>> {
  const res = await fromPromiseErr(
    db.select<
      {
        auth_method: string;
      }[]
    >(`SELECT auth_method FROM users WHERE id = $1`, [id]),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching user from db",
    ),
  );
  if (!res.ok) return err(res.error);

  if (res.value.length === 0 || !res.value[0]) {
    return err(commonErrors.noRecordFound);
  }
  return ok(res.value[0].auth_method as AuthMethod);
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
