import {
  decryptDataFromDb,
  decryptMasterKeyFromDb,
  encryptData,
  encryptMasterKey,
} from "@enc/encMaster";
import {
  AuthMethod,
  DefEncoder,
  User,
  UserConfig,
  UserId,
} from "@internal/intrCmnTypes";
import { db } from "./dbCore";
import { createUsernameLookupHash, SignWithHmac } from "@enc/encHelpers";
import { areUint8ArraysEqual, blobFromDb } from "@internal/intrHelperfuncs";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseAllErr,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";
import { GetPgpProfile, InsertPgpProfile } from "./dbOpenPgp";
import { AppState } from "@states/stateCommon";
import { loadSettingFromSaved } from "@states/stateSettings";

// ------- Users --------
export async function InsertUser(
  user: User,
  masterKey: CryptoKey,
  wrappingKey: CryptoKey,
  masterSalt: Uint8Array<ArrayBufferLike>,
  hmac_salt: Uint8Array<ArrayBuffer>,
  serverUrl: string,
  userSettings: string,
): Promise<Result<number>> {
  const encrypted = await fromPromiseAllErr(
    [
      encryptData(serverUrl, masterKey),
      encryptData(userSettings, masterKey),
      encryptData(user.config.userId, masterKey),
      encryptData(user.config.displayId, masterKey),
      SignWithHmac(DefEncoder.encode(user.config.displayId).buffer, hmac_salt),
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
      `INSERT INTO users (auth_method, master_salt, hmac_salt, server_url, user_settings, user_id, display_id, hmac_display_id, name, email, encrypted_master_key, profile_avatar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id`,
      [user.authMethod, masterSalt, hmac_salt, ...encrypted.value],
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

export async function dbFindUserByDisplayId(DisplayId: string) {
  const res = await fromPromiseErr(
    db.select<{ id: number; hmac_display_id: number[]; hmac_salt: number[] }[]>(
      `SELECT id, hmac_display_id, hmac_salt FROM users`,
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching user from db",
    ),
  );
  if (!res.ok) return err(res.error);

  for (const user of res.value) {
    const hmacDisplayId = blobFromDb(user.hmac_display_id);
    if (!hmacDisplayId.ok) return err(hmacDisplayId.error);
    const hmacSalt = blobFromDb(user.hmac_salt);
    if (!hmacSalt.ok) return err(hmacSalt.error);

    const newHash = await createUsernameLookupHash(DisplayId, hmacSalt.value);
    if (!newHash.ok) return err(newHash.error);

    if (areUint8ArraysEqual(newHash.value, hmacDisplayId.value)) {
      return ok(user.id);
    }
  }
  return ok(-1);
}

type dbUserConfig = {
  server_url: number[];
  user_settings: number[];
  auth_method: string;
  id: number;
  user_id: number[];
  display_id: number[];
  name: number[];
  email: number[];
  encrypted_master_key: number[];
  profile_avatar: number[];
};

export async function getUserByWrappingKey(
  wrappingKey: CryptoKey,
  id: number | null,
): Promise<Result<User>> {
  const res = await fromPromiseErr(
    db.select<dbUserConfig[]>(
      `SELECT server_url, user_settings, auth_method, id, user_id, display_id, name, email, encrypted_master_key, profile_avatar FROM users WHERE id = $1`,
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

  const masterKey = await decryptMasterKeyFromDb(
    res.value[0].encrypted_master_key,
    wrappingKey,
  );
  if (!masterKey.ok) return err(masterKey.error);

  const decryptedMetaData = await fromPromiseAllErr([
    decryptDataFromDb<string>(res.value[0].server_url, masterKey.value),
    decryptDataFromDb<string>(res.value[0].user_settings, masterKey.value),
  ]);
  if (!decryptedMetaData.ok) return err(decryptedMetaData.error);
  const [serverUrl, userSettings] = decryptedMetaData.value;
  const { setServerUrl } = AppState.getState();
  setServerUrl(serverUrl);
  loadSettingFromSaved(userSettings);

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
      `SELECT server_url, user_settings, auth_method, id, user_id, display_id, name, email, encrypted_master_key, profile_avatar FROM users WHERE ${selectBy} = $1`,
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

  const decryptedMetaData = await fromPromiseAllErr([
    decryptDataFromDb<string>(res.value[0].server_url, masterKey),
    decryptDataFromDb<string>(res.value[0].user_settings, masterKey),
  ]);
  if (!decryptedMetaData.ok) return err(decryptedMetaData.error);
  const [serverUrl, userSettings] = decryptedMetaData.value;
  const { setServerUrl } = AppState.getState();
  setServerUrl(serverUrl);
  loadSettingFromSaved(userSettings);

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
export async function setUserServerUrl(
  user_id: number,
  newUrl: string,
  masterKey: CryptoKey,
) {
  const encrypted = await encryptData(newUrl, masterKey);
  if (!encrypted.ok) return err(encrypted.error);
  const res = await fromPromiseErr(
    db.execute(`UPDATE users SET server_url = $2 WHERE id = $1`, [
      user_id,
      encrypted.value,
    ]),
    commonErrors.dbfailedToInsertData,
  );
  if (!res.ok) return err(res.error);
  return ok(undefined);
}
