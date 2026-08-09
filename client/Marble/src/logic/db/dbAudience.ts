import { decryptDataFromDb, encryptData } from "@enc/encMaster";
import { Audience } from "@internal/intrCmnTypes";
import { sessionsState } from "@sessions/stateSession";
import { db } from "./dbCore";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseAllErr,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";

export async function InsertAudience(
  audience: Audience,
  masterKey: CryptoKey,
): Promise<Result<number>> {
  const encrypted = await fromPromiseAllErr(
    [
      encryptData(audience.userId, masterKey),
      encryptData(audience.displayId, masterKey),
      encryptData(audience.name, masterKey),
      encryptData(audience.armedPubKey, masterKey),
      encryptData(audience.profileAvatar, masterKey),
    ],
    commonErrors.encryptionFailed,
  );
  if (!encrypted.ok) return err(encrypted.error);

  const res = await fromPromiseErr(
    db.select<{ id: number }[]>(
      `INSERT INTO audience (owner_id, user_id, display_id, name, public_key, profile_avatar) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id`,
      [audience.ownerId, ...encrypted.value],
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

type dbAudienceData = {
  id: number;
  user_id: number[];
  display_id: number[];
  owner_id: number;
  name: number[];
  public_key: number[];
  profile_avatar: number[];
};

export async function GetAudienceById(
  id: number | null,
  masterKey: CryptoKey,
): Promise<Result<Audience>> {
  const res = await fromPromiseErr(
    db.select<dbAudienceData[]>(
      `--sql
    SELECT * FROM audience WHERE id = $1`,
      [id],
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

  const decrypted = await decypAudienceData(res.value[0], masterKey);
  if (!decrypted.ok) return err(decrypted.error);

  const [userId, displayId, name, armedPubKey, profileAvatar] = decrypted.value;

  const existing: Audience = {
    id: res.value[0].id,
    userId,
    displayId,
    ownerId: res.value[0].owner_id,
    name,
    armedPubKey,
    profileAvatar,
    isOnline: false,
  };
  return ok(existing);
}

export async function GetAudienceByOwnerId(
  ownerId: number | null,
  masterKey: CryptoKey,
): Promise<Result<Audience[]>> {
  const res = await fromPromiseErr(
    db.select<dbAudienceData[]>(
      `--sql
    SELECT * FROM audience WHERE owner_id = $1`,
      [ownerId],
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

  const existings: Audience[] = [];

  for (const aud of res.value) {
    const decrypted = await decypAudienceData(aud, masterKey);
    if (!decrypted.ok) return err(decrypted.error);

    const [userId, displayId, name, armedPubKey, profileAvatar] =
      decrypted.value;

    const audience: Audience = {
      id: aud.id,
      userId,
      displayId,
      ownerId: aud.owner_id,
      name,
      armedPubKey,
      profileAvatar,
      isOnline: false,
    };
    existings.push(audience);
  }
  return ok(existings);
}

const decypAudienceData = async (
  data: dbAudienceData,
  masterKey: CryptoKey,
) => {
  return await fromPromiseAllErr(
    [
      decryptDataFromDb<number>(data.user_id, masterKey),
      decryptDataFromDb<string>(data.display_id, masterKey),
      decryptDataFromDb<string>(data.name, masterKey),
      decryptDataFromDb<string>(data.public_key, masterKey),
      decryptDataFromDb<string>(data.profile_avatar, masterKey),
    ],
    errEdtMessage(
      commonErrors.decryptionFailed,
      "failed to decrypt audience data",
    ),
  );
};

export async function DeleteAudienceFromDb(
  audience: Audience,
): Promise<Result<void>> {
  const { sessions } = sessionsState.getState();
  let ac = 0;
  for (const session of sessions.values()) {
    if (session.audience.id === audience.id) ac++;
    if (ac >= 2) return ok(undefined);
  }

  const query = `DELETE FROM audience WHERE id = $1`;
  const res = await fromPromiseErr(
    db.execute(query, [audience.id]),
    commonErrors.dbfailedToDeleteData,
  );
  if (!res.ok) return err(res.error);

  return ok(undefined);
}
