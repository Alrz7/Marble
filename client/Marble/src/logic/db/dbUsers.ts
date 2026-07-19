import * as openpgp from "openpgp";
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
} from "@internal/commonTypes";
import { db } from "./dbMain";
import { getKeyFromArmored } from "@enc/encOpenpgp";
import { SignWithHmac } from "@enc/encHelpers";
import { blobFromDb } from "@internal/helperfuncs";

// ------- Users --------
export async function InsertUser(
  user: User,
  keychainKey: CryptoKey,
): Promise<number> {
  const encrypted = await Promise.all([
    encryptData(user.config.userId, keychainKey),
    encryptData(user.config.displayId, keychainKey),
    SignWithHmac(DefEncoder.encode(user.config.displayId).buffer),
    encryptData(user.config.name, keychainKey),
    encryptData(user.config.email, keychainKey),
    encryptMasterKeyWithKEK(user.MasterKey, keychainKey),
    encryptData(user.config.profile_avatar, keychainKey),
  ]);

  const ids = await db.select<{ id: number }[]>(
    `INSERT INTO users (user_id, display_id, hmac_display_id, name, email, encrypted_master_key, profile_avatar) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
    encrypted,
  );
  if (!ids[0]) throw new Error("there was an error while Inserting User");

  await InsertPgpProfile(user.Pgp, ids[0].id, user.MasterKey);
  return ids[0].id;
}

export async function GetUser(
  keychainKey: CryptoKey,
  id: number | null,
  display_id: ArrayBuffer | null,
): Promise<User | null> {
  var selectBy: string;
  if (id) {
    selectBy = "id";
  } else if (display_id) {
    selectBy = "hmac_display_id";
  } else {
    return null;
  }
  const res = await db.select<
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
    [id ?? display_id],
  );

  if (res.length == 0) return null;
  if (!res[0]) {
    throw new Error("User-Data is Invalid");
  }

  const config: UserConfig = {
    id: res[0].id,
    userId: await decryptDataFromDb<number>(res[0].user_id, keychainKey),
    displayId: await decryptDataFromDb<string>(res[0].display_id, keychainKey),
    name: await decryptDataFromDb<string>(res[0].name, keychainKey),
    email: await decryptDataFromDb<string>(res[0].email, keychainKey),
    profile_avatar: await decryptDataFromDb<string>(
      res[0].profile_avatar,
      keychainKey,
    ),
  };

  const masterKey: CryptoKey = await decryptMasterKeyWithKEK(
    blobFromDb(res[0].encrypted_master_key),
    keychainKey,
  );

  const pgpProfile: pgpProfile = await GetPgpProfile(config.id, masterKey);

  const user: User = {
    config: config,
    MasterKey: masterKey,
    Pgp: pgpProfile,
  };

  return user;
}

export async function getActiveUserId(): Promise<UserId> {
  const result = await db.select<{ value: number }[]>(
    "SELECT value FROM app_settings WHERE key = 'active_user_id'",
  );
  return result[0]?.value ?? -1;
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
) {
  const encrypted = await Promise.all([
    userId,
    encryptData(pgpProfile.PrivateKey, masterKey),
    encryptData(pgpProfile.PublicKey, masterKey),
    encryptData(pgpProfile.RevocationCertificate, masterKey),
  ]);
  await db.execute(
    `INSERT INTO pgp_profile (user_id, private_key, public_key, revocation_certificate) VALUES ($1, $2, $3, $4)`,
    encrypted,
  );
}

export async function GetPgpProfile(
  userId: UserId,
  masterKey: CryptoKey,
): Promise<pgpProfile> {
  const res = await db.select<
    {
      private_key: string;
      public_key: string;
      revocation_certificate: string;
    }[]
  >(
    `--sql
    SELECT private_key, public_key, revocation_certificate FROM pgp_profile WHERE user_id = $1`,
    [userId],
  );
  if (!res || !res[0]) {
    throw new Error("User Not Found");
  }
  const prvKey: string = await decryptDataFromDb<string>(
    res[0].private_key,
    masterKey,
  );

  const actvPrvKey: openpgp.PrivateKey | null = await getKeyFromArmored(
    prvKey,
    null,
  );

  const existing: pgpProfile = {
    PrivateKey: prvKey,
    PublicKey: await decryptDataFromDb<string>(res[0].public_key, masterKey),
    RevocationCertificate: await decryptDataFromDb<string>(
      res[0].revocation_certificate,
      masterKey,
    ),
    ActivePrvKey: actvPrvKey,
  };

  return existing;
}
