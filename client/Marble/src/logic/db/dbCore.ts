import Database from "@tauri-apps/plugin-sql";
import { MG1 } from "./dbMigrations";
import { appDataDir } from "@tauri-apps/api/path";
import { commonErrors, err, fromPromiseErr, ok } from "@internal/golog";
import { createDir, doesExist } from "./dbHelpers";

export let db: Database | null = null;

export let beenInited: boolean = false;
let Initting: boolean = false;

export async function InitAndMigrate() {
  if (Initting) {
    while (Initting) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return;
  }
  Initting = true;

  const load = await LoadDb();
  if (!load.ok) return err(load.error);

  db = load.value;

  const res = await db.select<{ user_version: number }[]>(
    "PRAGMA user_version;",
  );
  let currentVersion = res[0]?.user_version;

  switch (currentVersion) {
    case 0:
      await db.execute(MG1);
      await db.execute("PRAGMA user_version = 1;");
      currentVersion = 1;
      break;
  }
  Initting = false;
  beenInited = true;
  return ok(undefined);
}

async function LoadDb() {
  const Local = "local";
  const appDir = await appDataDir();
  const exists = await doesExist(Local);
  if (!exists.ok) return err(exists.error);
  if (exists.value == false) {
    const res = await createDir(Local);
    if (!res.ok) return err(res.error);
  }
  const dbLoad = await fromPromiseErr(
    Database.load(`sqlite:${appDir}/local/app.db`),
    commonErrors.dbConnectionFailed,
  );
  if (!dbLoad.ok) return err(dbLoad.error);
  return ok(dbLoad.value);
}
