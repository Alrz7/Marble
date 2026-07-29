import { decryptDataFromDb, encryptData } from "@enc/encMaster";
import { Message, MessageStatus, Session } from "@internal/intrCmnTypes";
import { db } from "./dbMain";

// ------- Messages --------
export async function InsertMessage(
  session: Session,
  message: Message,
  masterKey: CryptoKey,
): Promise<number> {
  const updateRes = await db.select<{ message_sequence: number }[]>(
    `UPDATE session 
     SET message_sequence = message_sequence + 1 
     WHERE id = $1 
     RETURNING message_sequence`,
    [session.id],
  );

  if (!updateRes || updateRes.length === 0) {
    throw new Error("session Not Found");
  }
  const newSequence = updateRes[0]?.message_sequence;
  if (newSequence) {
    message.seq = newSequence;
    session.message_sequence = newSequence;
  }
  const encrypted = await Promise.all([
    newSequence,
    session.id,
    encryptData(message.content, masterKey),
    encryptData(message.profile, masterKey),
    encryptData(message.senderId, masterKey),
    encryptData(message.createdAt.toUTCString(), masterKey),
    encryptData(message.status, masterKey),
  ]);

  const res = await db.select<{ id: number }[]>(
    `INSERT INTO message (seq, session_id, content, profile, sender_id, timestamp, status) VALUES ($1, $2, $3, $4, $5, $6, $7)
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
      profile: number[];
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
      profile: await decryptDataFromDb<string>(msg.profile, masterKey),
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

export async function GetMessageById(masterKey: CryptoKey, id: number) {
  const res = await db.select<
    {
      id: number;
      seq: number;
      session_id: number;
      content: number[];
      profile: number[];
      sender_id: number;
      timestamp: number[];
      status: number[];
    }[]
  >(
    `--sql
    SELECT * FROM message WHERE id = $1`,
    [id],
  );
  const existing: Message[] = [];

  for (const msg of res) {
    existing.push({
      id: msg.id,
      seq: msg.seq,
      sessionId: msg.session_id,
      content: await decryptDataFromDb<string>(msg.content, masterKey),
      senderId: await decryptDataFromDb<number>(msg.sender_id, masterKey),
      profile: await decryptDataFromDb<string>(msg.profile, masterKey),
      createdAt: new Date(
        await decryptDataFromDb<string>(msg.timestamp, masterKey),
      ),
      status: (await decryptDataFromDb<string>(
        msg.status,
        masterKey,
      )) as MessageStatus,
    });
  }
  return existing[0] ?? null;
}

export async function dbDeleteMessge(message: Message) {
  const query = `--sql
  DELETE FROM message where session_id = $1 AND seq = $2`;
  db.execute(query, [message.sessionId, message.seq]);
}

export async function dbUpdateMessageById(
  id: number,
  message: Message,
  masterKey: CryptoKey,
) {
  const encrypted = await Promise.all([
    encryptData(message.content, masterKey),
    encryptData(message.profile, masterKey),
    encryptData(message.status, masterKey),
  ]);
  try {
    const query = `--sql
  UPDATE message
  SET content = $2, profile = $3, status = $4
  WHERE id = $1`;
    await db.execute(query, [id, ...encrypted]);
  } catch (err) {
    console.warn(err);
  }
}
