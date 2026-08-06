import { decryptDataFromDb, encryptData } from "@enc/encMaster";
import { Audience, Session, SessionId, UserId } from "@internal/intrCmnTypes";
import { GetAudienceById } from "./dbAudience";
import { db } from "./dbMain";
import { isItSavedMessages } from "@internal/intrHelperfuncs";
import { savedMessagesAudience } from "@internal/intrCmnVars";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";
// ----- Sessions -----
export async function InsertSession(
  session: Session,
  masterKey: CryptoKey,
): Promise<Result<number>> {
  const encSessionId = await encryptData(session.sessionId, masterKey);
  if (!encSessionId.ok) return err(encSessionId.error);

  const res = await fromPromiseErr(
    db.select<{ id: number }[]>(
      `INSERT INTO session (session_id, seq, owner_id, audience_id, message_sequence) VALUES ($1, $2, $3, $4, $5)
    RETURNING id`,
      [
        encSessionId.value,
        session.seq,
        session.ownerId,
        session.audience.id,
        0,
      ],
    ),
    errEdtMessage(
      commonErrors.dbfailedToInsertData,
      "error while inserting session",
    ),
  );
  if (!res.ok) return err(res.error);
  if (res.value.length == 0 || !res.value[0]) {
    return err(commonErrors.noRecordFound);
  }
  return ok(res.value[0].id);
}

// export async function InsertMocingSession(
//   session: Session,
//   masterKey: CryptoKey,
// ): Promise<number> {
//   return Math.floor(Math.random() * 60);
// }

export async function GetLastSessionSeq(
  user_id: number,
): Promise<Result<number>> {
  const result = await fromPromiseErr(
    db.select<{ seq: number }[]>(
      `SELECT COALESCE(MAX(seq), 0) AS seq FROM session WHERE owner_id = $1`,
      [user_id],
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching session-last-seq from db",
    ),
  );
  if (!result.ok) return err(result.error);
  return ok(result.value[0]?.seq ?? 0);
}

export async function GetSessions(
  ownerId: UserId,
  masterKey: CryptoKey,
): Promise<Result<Session[]>> {
  const res = await fromPromiseErr(
    db.select<
      {
        id: number;
        seq: number;
        session_id: number[];
        audience_id: number;
        message_sequence: number;
      }[]
    >(
      `--sql
    SELECT id, seq, session_id, audience_id, message_sequence FROM Session WHERE owner_id = $1`,
      [ownerId],
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching session from db",
    ),
  );
  if (!res.ok) return err(res.error);

  const existing: Session[] = [];

  for (const val of res.value) {
    const decSessionId = await decryptDataFromDb<SessionId>(
      val.session_id,
      masterKey,
    );

    if (!decSessionId.ok) return err(decSessionId.error);

    let audience: Audience | null;
    if (isItSavedMessages(decSessionId.value)) {
      audience = { ...savedMessagesAudience, ownerId: ownerId };
    } else {
      const audByDb = await GetAudienceById(val.audience_id, masterKey);
      if (!audByDb.ok) return err(audByDb.error);
      audience = audByDb.value;
    }

    const newExistingSession: Session = {
      id: val.id,
      seq: val.seq,
      sessionId: decSessionId.value,
      audience: audience,
      ownerId: ownerId,
      message_sequence: val.message_sequence,
    };
    if (audience.isSavedMessages) newExistingSession.isSavedMessages = true;
    existing.push(newExistingSession);
  }
  return ok(existing);
}

export async function UpdateSessionById(
  id: SessionId,
  sessionId?: SessionId,
  masterKey?: CryptoKey,
  seq?: number,
  message_sequence?: number,
): Promise<Result<void>> {
  if (
    !(
      (sessionId !== undefined && masterKey) ||
      seq !== undefined ||
      message_sequence !== undefined
    )
  ) {
    return ok(undefined);
  }

  const queryComb: string[] = [];
  type comb = Uint8Array<ArrayBufferLike> | number;
  const valueComb: comb[] = [];

  if (sessionId !== undefined && masterKey) {
    queryComb.push(`session_id = $${queryComb.length + 2}`);
    const encSessionId = await encryptData(sessionId, masterKey);

    if (!encSessionId.ok) return err(encSessionId.error);
    valueComb.push(encSessionId.value);
  }

  if (seq !== undefined) {
    queryComb.push(`seq = $${queryComb.length + 2}`);
    valueComb.push(seq);
  }

  if (message_sequence !== undefined) {
    queryComb.push(`message_sequence = $${queryComb.length + 2}`);
    valueComb.push(message_sequence);
  }

  const query = `--sql
  UPDATE session
  SET ${queryComb.join(",")}
  WHERE id = $1`;
  const res = await fromPromiseErr(
    db.execute(query, [id, ...valueComb]),
    errEdtMessage(
      commonErrors.dbfailedToUpdateData,
      "error while updating session data",
    ),
  );
  if (!res.ok) return err(res.error);
  return ok(undefined);
}

export async function DoesSessionExist(
  ownerId: number,
  audieceId: number,
): Promise<Result<boolean>> {
  const query = `--sql
  SELECT EXISTS(
    SELECT 1
    FROM session
    WHERE owner_id = $1 AND audience_id = $2
  ) AS found`;
  const res = await fromPromiseErr(
    db.select<{ found: number }[]>(query, [ownerId, audieceId]),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching session from db",
    ),
  );
  if (!res.ok) return err(res.error);
  return ok(res.value[0]?.found == 1);
}

export async function DeleteSessionFrmDb(id: number) {
  const query = `
  DELETE FROM session
  WHERE id = $1`;
  const res = await fromPromiseErr(
    db.execute(query, [id]),
    commonErrors.dbfailedToDeleteData,
  );
  if (!res.ok) return err(res.error);

  return ok(undefined);
}
