import { decryptDataFromDb, encryptData } from "@enc/encMaster";
import { Session, SessionId, UserId } from "@internal/intrCmnTypes";
import { GetAudience } from "./dbAudience";
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

export async function DeleteSessionFrmDb(id: number) {
  const query = `
  DELETE FROM session
  WHERE id = $1`;
  db.execute(query, [id]);
}
