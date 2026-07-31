import { decryptDataFromDb, encryptData } from "@enc/encMaster";
import { Audience } from "@internal/intrCmnTypes";
import { sessionsState } from "@sessions/sessionStates";
import { db } from "./dbMain";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";

export async function InsertAudience(
  audience: Audience,
  masterKey: CryptoKey,
): Promise<Result<number>> {
  const encrypted = await fromPromiseErr(
    Promise.all([
      encryptData(audience.userId, masterKey),
      encryptData(audience.displayId, masterKey),
      audience.ownerId,
      encryptData(audience.name, masterKey),
      encryptData(audience.armedPubKey, masterKey),
      encryptData(audience.profileAvatar, masterKey),
    ]),
    commonErrors.encryptionFailed,
  );
  if (!encrypted.ok) return err(encrypted.error);

  const res = await fromPromiseErr(
    db.select<{ id: number }[]>(
      `INSERT INTO audience (user_id, display_id, owner_id, name, public_key, profile_avatar) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id`,
      encrypted.value,
    ),
    errEdtMessage(
      commonErrors.dbfailedToInsertData,
      "error while inserting audience",
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
  return ok(res.value[0].id);
}
// function doesAlreadyExist(audiece: Audience): number | null {
//   const { sessions } = sessionsState.getState();
//   console.log(sessions)
//   for (const session of sessions.values()) {
//     if (session.audience.userId === audiece.userId && session.id != -1) {
//       return session.audience.id;
//     }
//   }
//   return null;
// }

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
): Promise<Result<Audience>> {
  let selectBy: string;
  let targetVal: number;

  if (id !== null) {
    selectBy = "id";
    targetVal = id;
  } else if (ownerId !== null) {
    selectBy = "owner_id";
    targetVal = ownerId;
  } else {
    return err(
      errEdtMessage(
        commonErrors.unexpectedInput,
        "expected an id or an ownerId, nither was valid",
      ),
    );
  }

  const res = await fromPromiseErr(
    db.select<
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
      [targetVal],
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching audience from db",
    ),
  );
  if (!res.ok) return err(res.error);

  if (res.value.length === 0 || !res.value[0]) {
    return err(commonErrors.noRecordFound);
  }

  const decrypted = await fromPromiseErr(
    Promise.all([
      decryptDataFromDb<number>(res.value[0].user_id, masterKey),
      decryptDataFromDb<string>(res.value[0].display_id, masterKey),
      decryptDataFromDb<string>(res.value[0].name, masterKey),
      decryptDataFromDb<string>(res.value[0].public_key, masterKey),
      decryptDataFromDb<string>(res.value[0].profile_avatar, masterKey),
    ]),
    commonErrors.decryptionFailed,
  );
  if (!decrypted.ok) return err(decrypted.error);

  const existing: Audience = {
    id: res.value[0].id,
    userId: decrypted.value[0],
    displayId: decrypted.value[1],
    ownerId: res.value[0].owner_id,
    name: decrypted.value[2],
    armedPubKey: decrypted.value[3],
    profileAvatar: decrypted.value[4],
    isOnline: false,
  };

  return ok(existing);
}

export async function DeleteAudienceFromDb(
  audience: Audience,
): Promise<Result<void>> {
  const { sessions } = sessionsState.getState();
  let ac = 0;
  for (const session of sessions.values()) {
    if (session.audience.id === audience.id) ac++;
  }
  if (ac >= 2) return ok(undefined);

  const query = `DELETE FROM audience WHERE id = $1`;
  const res = await fromPromiseErr(
    db.execute(query, [audience.id]),
    commonErrors.dbfailedToDeleteData,
  );
  if (!res.ok) return err(res.error);

  return ok(undefined);
}
