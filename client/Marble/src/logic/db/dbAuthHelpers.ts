import { AuthMethod } from "@internal/intrCmnTypes";
import { db } from "./dbMain";
import { blobFromDb } from "@internal/intrHelperfuncs";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseErr,
  ok,
  Result,
} from "@internal/golog";
import { decryptDataFromDb, encryptData } from "@enc/encMaster";

export async function getUserSaltArray(
  id: number | null,
  display_id: ArrayBuffer | null,
) {
  let selectBy: string;
  let targetVal: number | ArrayBuffer;

  if (id !== null) {
    selectBy = "id";
    targetVal = id;
  } else if (display_id !== null) {
    selectBy = "hmac_display_id";
    targetVal = display_id;
  } else {
    return err(
      errEdtMessage(
        commonErrors.unexpectedInput,
        "error while geting user from db: either id or display_id is expected",
      ),
    );
  }
  const res = await fromPromiseErr(
    db.select<{ master_salt: number[] }[]>(
      `SELECT master_salt FROM users WHERE ${selectBy} = $1`,
      [targetVal],
    ),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching user from db",
    ),
  );
  if (!res.ok) return err(res.error);

  if (res.value.length === 0 || !res.value[0]) {
    return err(commonErrors.noRecordFound);
  }
  return blobFromDb(res.value[0].master_salt);
}

export async function GetUserAuthMethod(
  id: number,
): Promise<Result<AuthMethod>> {
  const res = await fromPromiseErr(
    db.select<
      {
        auth_method: string;
      }[]
    >(`SELECT auth_method FROM users WHERE id = $1`, [id]),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching user from db",
    ),
  );
  if (!res.ok) return err(res.error);

  if (res.value.length === 0 || !res.value[0]) {
    return err(commonErrors.noRecordFound);
  }
  return ok(res.value[0].auth_method as AuthMethod);
}

export async function setUserRefreshToken(
  id: number,
  token: string,
  masterKey: CryptoKey,
) {
  const encrypted = await encryptData(token, masterKey);
  if (!encrypted.ok) return err(encrypted.error);
  const query = `UPDATE users
    SET refresh_token = $2
    WHERE id = $1`;

  const res = await fromPromiseErr(
    db.execute(query, [id, encrypted.value]),
    commonErrors.dbfailedToUpdateData,
  );

  return res;
}

export async function getUserRefreshToken(id: number, MasterKey: CryptoKey) {
  const res = await fromPromiseErr(
    db.select<
      {
        refresh_token: number[] | null;
      }[]
    >(`SELECT refresh_token FROM users WHERE id = $1`, [id]),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching user from db",
    ),
  );
  if (!res.ok) return err(res.error);

  if (res.value.length === 0 || !res.value[0]) {
    return err(commonErrors.noRecordFound);
  }
  if (res.value[0].refresh_token == null) return ok(null);

  const decrypted = await decryptDataFromDb<string>(
    res.value[0].refresh_token,
    MasterKey,
  );
  if (!decrypted.ok) return err(decrypted.error);
  return ok(decrypted.value);
}
