import { AuthMethod } from "@internal/intrCmnTypes";
import { db } from "./dbMain";
import { blobFromDb } from "@internal/intrHelperfuncs";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseAllErr,
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

export async function setUserTokens(
  id: number,
  masterKey: CryptoKey,
  accessToken?: string,
  refreshToken?: string,
) {
  if (!accessToken && !refreshToken)
    return err(
      errEdtMessage(
        commonErrors.unexpectedInput,
        "expecting accessToken, refreshToken or Both, but nither was given",
      ),
    );
  const addings: string[] = [];
  const tokens: Uint8Array[] = [];

  if (accessToken) {
    addings.push("access_token");
    const encrypted = await encryptData(accessToken, masterKey);
    if (!encrypted.ok) return err(encrypted.error);
    tokens.push(encrypted.value);
  }

  if (refreshToken) {
    addings.push("refresh_token");
    const encrypted = await encryptData(refreshToken, masterKey);
    if (!encrypted.ok) return err(encrypted.error);
    tokens.push(encrypted.value);
  }

  const query = `UPDATE users
    SET ${addings.at(0) ? `${addings.at(0)} = $2` : ""}, ${addings.at(1) ? `${addings.at(1)} = $3` : ""}
    WHERE id = $1`;
  const res = await fromPromiseErr(
    db.execute(query, [id, ...tokens]),
    commonErrors.dbfailedToUpdateData,
  );

  return res;
}

export async function getUserTokens(id: number, MasterKey: CryptoKey) {
  const res = await fromPromiseErr(
    db.select<
      {
        access_token: number[] | null;
        refresh_token: number[] | null;
      }[]
    >(`SELECT access_token, refresh_token FROM users WHERE id = $1`, [id]),
    errEdtMessage(
      commonErrors.dbfailedToGetData,
      "err while fetching user from db",
    ),
  );
  if (!res.ok) return err(res.error);

  if (res.value.length === 0 || !res.value[0]) {
    return err(commonErrors.noRecordFound);
  }
  const existings = [];

  if (res.value[0].access_token != null) {
    existings.push(
      decryptDataFromDb<string>(res.value[0].access_token, MasterKey),
    );
  }
  if (res.value[0].refresh_token != null) {
    existings.push(
      decryptDataFromDb<string>(res.value[0].refresh_token, MasterKey),
    );
  }
  const decrypted = await fromPromiseAllErr(existings);

  if (!decrypted.ok) return err(decrypted.error);
  const [accessToken, refreshToken] = decrypted.value;

  return ok({
    accessToken: accessToken ?? null,
    refreshToken: refreshToken ?? null,
  });
}
