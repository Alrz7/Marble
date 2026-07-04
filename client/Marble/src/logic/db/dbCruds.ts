import { Session } from "../internal/commonTypes";
import { db } from "./dbMain";

export async function InsertSession(session: Session) {
  await db.execute(
    `INSERT INTO session (storage_id, last_sequence) VALUES ($1, 0)`,
    [session.storageId],
  );
}
export async function GetSession(StorageId: string) {
  const res = await db.select<{ id: number; last_sequence: number }[]>(
    `--sql
    SELECT id, last_sequence FROM Session WHERE storage_id = $1`,
    [StorageId],
  );
  if (!res || res.length == 0) {
    throw new Error("session Not Found");
  }
  return res[0];
}

export async function InsertMessage(
  session: Session,
  message: string,
  senderId: string,
) {
  const updateRes = await db.select<{ id: number; last_sequence: number }[]>(
    `UPDATE session 
     SET last_sequence = last_sequence + 1 
     WHERE storage_id = $1 
     RETURNING id, last_sequence`,
    [session.storageId],
  );
  
  if (!updateRes || updateRes.length === 0) {
    throw new Error("session Not Found");
  }

  const sessionId = updateRes[0]?.id;
  const guaranteedSequence = updateRes[0]?.last_sequence;

  await db.execute(
    `INSERT INTO message (seq, session_id, content, sender_id) VALUES ($1, $2, $3, $4)`,
    [guaranteedSequence, sessionId, message, senderId],
  );
}

export async function GetMessages(session: Session) {
  const sessionByDb = await GetSession(session.storageId);
  if (!sessionByDb || !sessionByDb.id) return;
  const res = await db.select<
    { seq: number; content: string; sender_id: number }[]
  >(
    `--sql
    SELECT seq, content, sender_id FROM message WHERE session_id = $1`,
    [sessionByDb.id],
  );
  return res;
}
