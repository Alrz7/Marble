import * as openpgp from "openpgp";
import * as signUp from "./auth/signUp";
import * as hold from "./enc/encStoreManagement";
import * as enc from "./enc/encMain.ts";

export type user =
  | (signUp.userConfig & {
      prvIdentKey: openpgp.PrivateKey;
    })
  | null;

export async function main() {}

export async function LoadConfig(): Promise<user> {
  let vaultKey = await hold.GetkeyChainObject(hold.MarbleStrongHold);
  // console.log(vaultKey);
  if (!vaultKey) {
    vaultKey = (await enc.GenerateIdntKey("chainKey", "marbledev@gmail.com"))
      .privateKey;
    await hold.SetkeyChainObject(hold.MarbleStrongHold, vaultKey);
  }
  const loadStrHold = await hold.initStrHoldClient(
    vaultKey,
    hold.MarbleStrongHold,
  );
  if (!loadStrHold) return null;
  const userConfig = await hold.GetStrHoldObject(
    loadStrHold,
    hold.DefualtObjectKey,
  );
  if (!userConfig) {
    return null;
  }
  const prvKey = await hold.GetKeyfromArmored(
    userConfig.identityKey.privateKey,
  );
  if (!prvKey) return null;
  console.log({ ...userConfig, prvIdentKey: prvKey });
  return { ...userConfig, prvIdentKey: prvKey };
}
