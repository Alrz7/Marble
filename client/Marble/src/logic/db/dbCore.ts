import Database from "@tauri-apps/plugin-sql";
import { MG1 } from "./dbMigrations";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
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
  const LocalFolder = "local";
  const appDir = await appLocalDataDir();
  const exists = await doesExist(LocalFolder);
  if (!exists.ok) return err(exists.error);
  if (exists.value == false) {
    const res = await createDir(LocalFolder);
    if (!res.ok) return err(res.error);
  }
  const rawDbPath = await join(appDir, LocalFolder, "app.db");
  const formattedDbPath = rawDbPath.replace(/\\/g, "/");

  const dbLoad = await fromPromiseErr(
    Database.load(`sqlite:${formattedDbPath}`),
    commonErrors.dbConnectionFailed,
  );
  if (!dbLoad.ok) return err(dbLoad.error);
  return ok(dbLoad.value);
}
