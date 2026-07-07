import { decryptDataFromDb, encryptData } from "../enc/encMaster";
import {
  Audience,
  Message,
  MessageStatus,
  Session,
  SessionId,
  UserId,
} from "../internal/commonTypes";
import { db } from "./dbMain";

// ----- Sessions -----
export async function InsertSession(
  session: Session,
  masterKey: CryptoKey,
): Promise<number> {
  const encSessionId = await encryptData(session.sessionId, masterKey);
  const res = await db.select<{ id: number }[]>(
    `INSERT INTO session (session_id, owner_id, audience_id, last_sequence) VALUES ($1, $2, $3, $4)
    RETURNING id`,
    [encSessionId, session.ownerId, session.audience.id, 0],
  );
  if (!res[0]) throw new Error("there was an error while inserting session");
  return res[0].id;
}

export async function GetSessions(
  userId: UserId,
  masterKey: CryptoKey,
): Promise<Session[]> {
  const res = await db.select<
    { id: number; session_id: number[]; audience_id: number }[]
  >(
    `--sql
    SELECT id, session_id, audience_id FROM Session WHERE owner_id = $1`,
    [userId],
  );
  const existing: Session[] = [];
  for (const val of res) {
    const audience = await GetAudience(val.audience_id, null, masterKey);
    const decSessionId = await decryptDataFromDb<SessionId>(
      val.session_id,
      masterKey,
    );
    if (!audience) throw Error("audiece-data was not valid");
    existing.push({
      id: val.id,
      sessionId: decSessionId,
      audience: audience,
      ownerId: userId,
    });
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
    userId: await decryptDataFromDb<number>(res[0].user_id, masterKey),
    displayId: await decryptDataFromDb<string>(res[0].display_id, masterKey),
    ownerId: res[0].owner_id,
    name: await decryptDataFromDb<string>(res[0].name, masterKey),
    armedPubKey: await decryptDataFromDb<string>(res[0].public_key, masterKey),
    ProfileAvatar: await decryptDataFromDb<string>(
      res[0].profile_avatar,
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
      content: await decryptDataFromDb<string>(msg.content, masterKey),
      senderId: await decryptDataFromDb<number>(msg.sender_id, masterKey),
      timestamp: new Date(
        await decryptDataFromDb<string>(msg.timestamp, masterKey),
      ),
      status: (await decryptDataFromDb<string>(
        msg.status,
        masterKey,
      )) as MessageStatus,
    });
  }
  return existing;
}
