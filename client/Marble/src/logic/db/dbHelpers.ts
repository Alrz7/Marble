import { fromPromiseErr, newAppErr } from "@internal/golog";
import { exists, mkdir, BaseDirectory } from "@tauri-apps/plugin-fs";

export async function createDir(adrs: string) {
  return await fromPromiseErr(
    mkdir(adrs, {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    }),
    newAppErr("fsCreateFailed", "error creating file or dir"),
  );
}
export async function doesExist(adrs: string) {
  return await fromPromiseErr(
    exists(adrs, {
      baseDir: BaseDirectory.AppLocalData,
    }),
    newAppErr("fsCheckFailed", "error while checking for file or dir"),
  );
}
