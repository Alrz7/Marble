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
    `INSERT INTO session (session_id, seq, owner_id, audience_id, last_sequence) VALUES ($1, $2, $3, $4, $5)
    RETURNING id`,
    [encSessionId, session.seq, session.ownerId, session.audience.id, 0],
  );

  if (!res[0]) throw new Error("there was an error while inserting session");
  return res[0].id;
}

// export async function InsertMocingSession(
//   session: Session,
//   masterKey: CryptoKey,
// ): Promise<number> {
//   return Math.floor(Math.random() * 60);
// }

export async function GetSessions(
  ownerId: UserId,
  masterKey: CryptoKey,
): Promise<Session[]> {
  const res = await db.select<
    { id: number; seq: number; session_id: number[]; audience_id: number }[]
  >(
    `--sql
    SELECT id, seq, session_id, audience_id FROM Session WHERE owner_id = $1`,
    [ownerId],
  );
  const existing: Session[] = [];
  for (const val of res) {
    const audience = await GetAudience(null, ownerId, masterKey);
    const decSessionId = await decryptDataFromDb<SessionId>(
      val.session_id,
      masterKey,
    );
    if (!audience) throw Error("audiece-data was not valid");
    existing.push({
      id: val.id,
      seq: val.seq,
      sessionId: decSessionId,
      audience: audience,
      ownerId: ownerId,
    });
  }
  return existing;
}

export async function UpdateSessionById(
  id: SessionId,
  sessionId?: SessionId,
  masterKey?: CryptoKey,
  seq?: number,
  lastSeq?: number,
) {
  if (
    !(
      (sessionId !== undefined && masterKey) ||
      seq !== undefined ||
      lastSeq !== undefined
    )
  )
    return;

  const queryComb: string[] = [];
  type comb = Uint8Array<ArrayBufferLike> | number;
  const valueComb: comb[] = [];

  if (sessionId !== undefined && masterKey) {
    queryComb.push(`session_id = $${queryComb.length + 2}`);
    const encSessionId = await encryptData(sessionId, masterKey);
    valueComb.push(encSessionId);
  }
  if (seq !== undefined) {
    queryComb.push(`seq = $${queryComb.length + 2}`);
    valueComb.push(seq);
  }
  if (lastSeq !== undefined) {
    queryComb.push(`last_sequence = $${queryComb.length + 2}`);
    valueComb.push(lastSeq);
  }
  try {
    const query = `--sql
  UPDATE session
  SET ${queryComb.join(",")}
  WHERE id = $1`;
    await db.execute(query, [id, ...valueComb]);
  } catch (err) {
    console.warn(err);
  }
}

export async function DoesSessionExist(
  ownerId: number,
  audieceId: number,
): Promise<boolean> {
  const query = `--sql
  SELECT EXISTS(
    SELECT 1
    FROM session
    WHERE owner_id = $1 AND audience_id = $2
  ) AS found`;
  const res = await db.select<{ found: number }[]>(query, [ownerId, audieceId]);
  return res[0]?.found == 1;
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
    encryptData(audience.profileAvatar, masterKey),
  ]);
  const res = await db.select<{ id: number }[]>(
    `INSERT INTO audience (user_id, display_id, owner_id, name, public_key, profile_avatar) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id`,
    encrypted,
  );
  if (!res[0]) throw new Error("there was an error while inserting audience");
  return res[0].id;
}

// export async function InsertMocingAudience(
//   audience: Audience,
//   masterKey: CryptoKey,
// ): Promise<number> {
//   return Math.floor(Math.random() * 60);
// }

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
    profileAvatar: await decryptDataFromDb<string>(
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
     WHERE id = $1 
     RETURNING last_sequence`,
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
    encryptData(message.createdAt.toUTCString(), masterKey),
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

// export async function InsertMocingMessage(
//   session: Session,
//   message: Message,
//   masterKey: CryptoKey,
// ): Promise<number> {
//   return Math.floor(Math.random() * 60);
// }

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
    SELECT * FROM message WHERE session_id = $1 ORDER BY seq DESC LIMIT $2`,
    [session.id, count],
  );
  const existing: Message[] = [];

  for (const msg of res) {
    existing.push({
      id: msg.id,
      seq: msg.seq,
      sessionId: msg.session_id,
      content: await decryptDataFromDb<string>(msg.content, masterKey),
      senderId: await decryptDataFromDb<number>(msg.sender_id, masterKey),
      profile: "openpgp",
      createdAt: new Date(
        await decryptDataFromDb<string>(msg.timestamp, masterKey),
      ),
      status: (await decryptDataFromDb<string>(
        msg.status,
        masterKey,
      )) as MessageStatus,
    });
  }
  return existing.reverse();
}

export async function DeleteMessge(message: Message) {
  const query = `--sql
  DELETE FROM message where session_id = $1 AND seq = $2`;
  db.execute(query, [message.sessionId, message.seq]);
}
