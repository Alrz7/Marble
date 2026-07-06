import * as openpgp from "openpgp";
import {
  decryptData,
  decryptMasterKeyWithKEK,
  encryptData,
  encryptMasterKeyWithKEK,
} from "../enc/encMaster";
import {
  Audience,
  DefEncoder,
  Message,
  MessageStatus,
  pgpProfile,
  Session,
  User,
  UserConfig,
  UserId,
} from "../internal/commonTypes";
import { db } from "./dbMain";
import { getKeyFromArmored } from "../enc/encOpenpgp";
import { SignWithHmac } from "../enc/encHelpers";

// ------- Users --------
export async function InsertUser(
  user: User,
  keychainKey: CryptoKey,
): Promise<number> {
  const encrypted = await Promise.all([
    encryptData(user.config.userId, keychainKey),
    SignWithHmac(DefEncoder.encode(user.config.displayId).buffer),
    encryptData(user.config.name, keychainKey),
    encryptData(user.config.email, keychainKey),
    encryptMasterKeyWithKEK(user.MasterKey, keychainKey),
    encryptData(user.config.profile_avatar, keychainKey),
  ]);

  const ids = await db.select<{ id: number }[]>(
    `INSERT INTO users (user_id, display_id, name, email, encrypted_master_key, profile_avatar) VALUES ($1, $2, $3, $4, $5, $6)
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
    selectBy = "display_id";
  } else {
    return null;
  }
  const res = await db.select<
    {
      id: number;
      user_id: number[];
      display_id: number[];
      name: number[];
      email: number[];
      encrypted_master_key: number[];
      profile_avatar: number[];
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
    userId: await decryptData<number>(
      new Uint8Array(res[0].user_id),
      keychainKey,
    ),
    displayId: await decryptData<string>(
      new Uint8Array(res[0].display_id),
      keychainKey,
    ),
    name: await decryptData<string>(new Uint8Array(res[0].name), keychainKey),
    email: await decryptData<string>(new Uint8Array(res[0].email), keychainKey),
    profile_avatar: await decryptData<string>(
      new Uint8Array(res[0].profile_avatar),
      keychainKey,
    ),
  };

  const masterKey: CryptoKey = await decryptMasterKeyWithKEK(
    new Uint8Array(res[0].encrypted_master_key),
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
      private_key: number[];
      public_key: number[];
      revocation_certificate: number[];
    }[]
  >(
    `--sql
    SELECT private_key, public_key, revocation_certificate FROM pgp_profile WHERE user_id = $1`,
    [userId],
  );
  if (!res || !res[0]) {
    throw new Error("User Not Found");
  }
  const prvKey: string = await decryptData<string>(
    new Uint8Array(res[0].private_key),
    masterKey,
  );

  const actvPrvKey: openpgp.PrivateKey | null = await getKeyFromArmored(
    prvKey,
    null,
  );

  const existing: pgpProfile = {
    PrivateKey: prvKey,
    PublicKey: await decryptData<string>(
      new Uint8Array(res[0].public_key),
      masterKey,
    ),
    RevocationCertificate: await decryptData<string>(
      new Uint8Array(res[0].revocation_certificate),
      masterKey,
    ),
    ActivePrvKey: actvPrvKey,
  };

  return existing;
}

// ----- Sessions -----
export async function InsertSession(session: Session): Promise<number> {
  const res = await db.select<{ id: number }[]>(
    `INSERT INTO session (owner_id, audience_id, last_sequence) VALUES ($1, $2, $3)
    RETURNING id`,
    [session.ownerId, session.audience.id, 0],
  );
  if (!res[0]) throw new Error("there was an error while inserting session");
  return res[0].id;
}

export async function GetSessions(
  userId: UserId,
  masterKey: CryptoKey,
): Promise<Session[]> {
  const res = await db.select<{ id: number; audience_id: number }[]>(
    `--sql
    SELECT id, audience_id FROM Session WHERE owner_id = $1`,
    [userId],
  );
  const existing: Session[] = [];
  for (const val of res) {
    const audience = await GetAudience(val.audience_id, null, masterKey);
    if (!audience) throw Error("audiece-data was not valid");
    existing.push({ id: val.id, audience: audience, ownerId: userId });
  }
  return existing;
}

// -------- Audience --------

export async function InsertAudience(
  audience: Audience,
  masterKey: CryptoKey,
): Promise<number> {
  const encrypted = await Promise.all([
    encryptData(audience.userId, masterKey),
    encryptData(audience.displayId, masterKey),
    audience.ownerId,
    encryptData(audience.name, masterKey),
    encryptData(audience.armedPubKey, masterKey),
    encryptData(audience.ProfileAvatar, masterKey),
  ]);
  const res = await db.select<{ id: number }[]>(
    `INSERT INTO audience (user_id, display_id, owner_id, name, public_key, profile_avatar) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id`,
    encrypted,
  );
  if (!res[0]) throw new Error("there was an error while inserting audience");
  return res[0].id;
}

export async function GetAudience(
  id: number | null,
  ownerId: number | null,
  masterKey: CryptoKey,
): Promise<Audience | null> {
  var selectBy: string;
  if (id) {
    selectBy = "id";
  } else if (ownerId) {
    selectBy = "owner_id";
  } else {
    return null;
  }
  const res = await db.select<
    {
      id: number;
      user_id: number[];
      display_id: number[];
      owner_id: number;
      name: number[];
      public_key: number[];
      profile_avatar: number[];
    }[]
  >(
    `--sql
    SELECT * FROM audience WHERE ${selectBy} = $1`,
    [ownerId],
  );
  if (!res || !res[0]) {
    throw new Error("User Not Found");
  }

  const existing: Audience = {
    id: res[0].id,
    userId: await decryptData<number>(
      new Uint8Array(res[0].user_id),
      masterKey,
    ),
    displayId: await decryptData<string>(
      new Uint8Array(res[0].display_id),
      masterKey,
    ),
    ownerId: res[0].owner_id,
    name: await decryptData<string>(new Uint8Array(res[0].name), masterKey),
    armedPubKey: await decryptData<string>(
      new Uint8Array(res[0].public_key),
      masterKey,
    ),
    ProfileAvatar: await decryptData<string>(
      new Uint8Array(res[0].profile_avatar),
      masterKey,
    ),
    isOnline: false,
  };

  return existing;
}

// ------- Messages --------
export async function InsertMessage(
  session: Session,
  message: Message,
  masterKey: CryptoKey,
): Promise<number> {
  const updateRes = await db.select<{ last_sequence: number }[]>(
    `UPDATE session 
     SET last_sequence = last_sequence + 1 
     WHERE storage_id = $1 
     RETURNING id, last_sequence`,
    [session.id],
  );

  if (!updateRes || updateRes.length === 0) {
    throw new Error("session Not Found");
  }
  const newSequence = updateRes[0]?.last_sequence;
  const encrypted = await Promise.all([
    newSequence,
    session.id,
    encryptData(message.content, masterKey),
    encryptData(message.senderId, masterKey),
    encryptData(message.timestamp.toUTCString(), masterKey),
    encryptData(message.status, masterKey),
  ]);

  const res = await db.select<{ id: number }[]>(
    `INSERT INTO message (seq, session_id, content, sender_id, timestamp, status) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id`,
    encrypted,
  );
  if (!res[0]) throw new Error("there was an error while inserting message");
  return res[0].id;
}

export async function GetMessages(
  masterKey: CryptoKey,
  session: Session,
  count: number,
) {
  const res = await db.select<
    {
      id: number;
      seq: number;
      session_id: number;
      content: number[];
      sender_id: number;
      timestamp: number[];
      status: number[];
    }[]
  >(
    `--sql
    SELECT * FROM message FETCH FIRST $1 ROW ONLY WHERE session_id = $2 `,
    [count, session.id],
  );
  const existing: Message[] = [];

  for (const msg of res) {
    existing.push({
      id: msg.id,
      seq: msg.seq,
      sessionId: msg.sender_id,
      content: await decryptData<string>(
        new Uint8Array(msg.content),
        masterKey,
      ),
      senderId: await decryptData<number>(
        new Uint8Array(msg.sender_id),
        masterKey,
      ),
      timestamp: new Date(
        await decryptData<string>(new Uint8Array(msg.timestamp), masterKey),
      ),
      status: (await decryptData<string>(
        new Uint8Array(msg.status),
        masterKey,
      )) as MessageStatus,
    });
  }
  return existing;
}
