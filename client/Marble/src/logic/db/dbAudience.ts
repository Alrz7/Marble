import { decryptDataFromDb, encryptData } from "@enc/encMaster";
import { Audience } from "@internal/intrCmnTypes";
import { sessionsState } from "@sessions/sessionStates";
import { db } from "./dbMain";

export async function InsertAudience(
  audience: Audience,
  masterKey: CryptoKey,
): Promise<number> {
  // const alreadyThere = doesAlreadyExist(audience);
  // if (alreadyThere) return alreadyThere;
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
): Promise<Audience | null> {
  let selectBy: string;
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

export async function DeleteAudienceFromDb(audience: Audience) {
  const { sessions } = sessionsState.getState();
  let ac = 0;
  for (const session of sessions.values()) {
    if (session.audience.id === audience.id) ac++;
  }
  if (ac >= 2) return;

  const query = `DELETE FROM audience WHERE id = $1`;
  db.execute(query, [audience.id]);
}
