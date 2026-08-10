import { db } from "./dbCore";
import { encryptData } from "@enc/encMaster";
import { commonErrors, err, fromPromiseErr, ok } from "@internal/golog";

export async function dbSaveUserSettings(
  user_id: number,
  settings: string,
  masterKey: CryptoKey,
) {
  if (!db) return err(commonErrors.dbNotConnected);
  const encrypted = await encryptData(settings, masterKey);
  if (!encrypted.ok) return err(encrypted.error);

  const res = await fromPromiseErr(
    db.execute(`UPDATE users SET user_settings = $2 WHERE id = $1`, [
      user_id,
      encrypted.value,
    ]),
    commonErrors.dbfailedToInsertData,
  );
  if (!res.ok) return err(res.error);
  return ok(undefined);
}
