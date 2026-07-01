import Database from "@tauri-apps/plugin-sql";
import { MG1 } from "./dbMigrations";
import { appDataDir } from "@tauri-apps/api/path";

const dbPath = await appDataDir();

export const db = await Database.load(`sqlite:${dbPath}/local/db/app.db`);
// await db.execute("INSERT INTO ...");

export let beenInited: boolean = false;
let Initting: boolean = false;

export async function InitAndMigrate() {
  while (Initting) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  Initting = true;
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
}
