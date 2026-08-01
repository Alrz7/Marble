import { decryptDataFromDb, encryptData } from "@enc/encMaster";
import { Message, MessageStatus, Session } from "@internal/intrCmnTypes";
import { db } from "./dbMain";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseAllErr,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";

// ------- Messages --------
export async function InsertMessage(
  session: Session,
  message: Message,
  masterKey: CryptoKey,
): Promise<Result<number>> {
  const updateRes = await fromPromiseErr(
    db.select<{ message_sequence: number }[]>(
      `UPDATE session 
     SET message_sequence = message_sequence + 1 
     WHERE id = $1 
     RETURNING message_sequence`,
      [session.id],
    ),
    errEdtMessage(
      commonErrors.dbfailedToInsertData,
      "failed to increase id while inserting new Message",
    ),
  );
  if (!updateRes.ok) return err(updateRes.error);

  const updated = updateRes.value[0];
  if (!updated) {
    return err(
      errEdtMessage(commonErrors.dbfailedToInsertData, "Session not found"),
    );
  }

  const newSequence = updated.message_sequence;
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

  const res = await fromPromiseErr(
    db.select<{ id: number }[]>(
      `INSERT INTO message (seq, session_id, content, profile, sender_id, timestamp, status) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id`,
      encrypted,
    ),
    errEdtMessage(
      commonErrors.dbfailedToInsertData,
      "failed to insert message",
    ),
  );
  if (!res.ok) return err(res.error);

  if (!res.value[0])
    return err(
      errEdtMessage(
        commonErrors.dbfailedToInsertData,
        "error while inserting message, id was not found",
      ),
    );
  return ok(res.value[0].id);
}

// export async function InsertMocingMessage(
//   session: Session,
//   message: Message,
//   masterKey: CryptoKey,
// ): Promise<number> {
//   return Math.floor(Math.random() * 60);
// }

type dbMessages = {
  id: number;
  seq: number;
  session_id: number;
  content: number[];
  profile: number[];
  sender_id: number;
  timestamp: number[];
  status: number[];
};

export async function GetMessages(
  masterKey: CryptoKey,
  session: Session,
  count: number,
): Promise<Result<Message[]>> {
  const res = await fromPromiseErr(
    db.select<dbMessages[]>(
      `--sql
    SELECT * FROM message WHERE session_id = $1 ORDER BY seq DESC LIMIT $2`,
      [session.id, count],
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching messages from db",
    ),
  );
  if (!res.ok) return err(res.error);

  const existing = await decryptAllMessages(res.value, masterKey);
  if (!existing.ok) return err(existing.error);

  return ok(existing.value.reverse());
}

export async function GetMessageById(
  masterKey: CryptoKey,
  id: number,
): Promise<Result<Message>> {
  const res = await fromPromiseErr(
    db.select<dbMessages[]>(
      `--sql
    SELECT * FROM message WHERE id = $1`,
      [id],
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching message from db",
    ),
  );
  if (!res.ok) return err(res.error);

  const existing = await decryptAllMessages(res.value, masterKey);
  if (!existing.ok) return err(existing.error);

  if (existing.value.length === 0 || !existing.value[0]) {
    return err(commonErrors.noRecordFound);
  }

  return ok(existing.value[0]);
}

export async function dbDeleteMessge(message: Message): Promise<Result<void>> {
  const query = `--sql
  DELETE FROM message where session_id = $1 AND seq = $2`;
  const res = await fromPromiseErr(
    db.execute(query, [message.sessionId, message.seq]),
    errEdtMessage(
      commonErrors.dbfailedToDeleteData,
      "failed to delete message from db",
    ),
  );
  if (!res.ok) return err(res.error);
  return ok(undefined);
}

export async function dbUpdateMessageById(
  id: number,
  message: Message,
  masterKey: CryptoKey,
) {
  const encrypted = await fromPromiseErr(
    Promise.all([
      encryptData(message.content, masterKey),
      encryptData(message.profile, masterKey),
      encryptData(message.status, masterKey),
    ]),
    errEdtMessage(
      commonErrors.dbfailedToUpdateData,
      "error while updating message in db",
    ),
  );
  if (!encrypted.ok) return err(encrypted.error);

  const query = `--sql
  UPDATE message
  SET content = $2, profile = $3, status = $4
  WHERE id = $1`;
  const res = await fromPromiseErr(
    db.execute(query, [id, ...encrypted.value]),
    errEdtMessage(
      commonErrors.dbfailedToUpdateData,
      "error while updating message",
    ),
  );
  if (!res.ok) return err(res.error);
  return ok(res.value);
}

export async function decryptAllMessages(
  res: dbMessages[],
  masterKey: CryptoKey,
): Promise<Result<Message[]>> {
  const existing: Message[] = [];

  for (const msg of res) {
    const decrypted = await fromPromiseAllErr(
      [
        decryptDataFromDb<string>(msg.content, masterKey),
        decryptDataFromDb<number>(msg.sender_id, masterKey),
        decryptDataFromDb<string>(msg.profile, masterKey),
        decryptDataFromDb<string>(msg.timestamp, masterKey),
        decryptDataFromDb<string>(msg.status, masterKey),
      ],
      commonErrors.decryptionFailed,
    );
    if (!decrypted.ok) return err(decrypted.error);
    const [content, senderId, profile, createdAt, status] = decrypted.value;

    existing.push({
      id: msg.id,
      seq: msg.seq,
      sessionId: msg.session_id,
      content: content,
      senderId: senderId,
      profile: profile,
      createdAt: new Date(createdAt),
      status: status as MessageStatus,
    });
  }
  return ok(existing);
}
