import { signIn } from "../auth/login.ts";
import { User } from "../internal/commonTypes.ts";
import { InitAndMigrate } from "../db/dbMain.ts";
import { getActiveUserId, GetUser } from "../db/dbCruds.ts";
import { GetOrCreateKeyChainKey } from "../enc/encMain.ts";

export async function loadConfig(): Promise<User | null> {
  const kek = await GetOrCreateKeyChainKey();
  if (!kek) throw new Error("kechainKey was not Valid");

  InitAndMigrate();
  const actvUserId = await getActiveUserId();
  const currentUser = await GetUser(kek, actvUserId, null);
  if (!currentUser) return null;
  signIn(currentUser.config.displayId, "testingg!"); // this is gonna be replaced with autoSignIn() later
  return currentUser;
}
