import { fetch } from "@tauri-apps/plugin-http";
import { pgpProfile, User, UserConfig } from "@internal/intrCmnTypes";
import { generateIdntKey, getKeyFromArmored } from "@enc/encOpenpgp";
import { InsertUser, SetActiveUserId } from "@db/dbUsers";
import { generateMasterKey } from "@enc/encMaster";
import { GetOrCreateKeyChainKey } from "@enc/encMain";
import { addAppErrNotif } from "@internal/golog";

// the openpgpKeyGroup & strongHoldKey Key-Groups are going to be saved in the StrongHold
// there are save there but i'll add encryption to these keys later too

export async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<User | null> {
  const Kek = await GetOrCreateKeyChainKey();
  if (!Kek) throw new Error(" there Was an Error while trying to get the KEK");

  const openpgpKeyGroup = await generateIdntKey(name, email);
  const userMasterKey: CryptoKey = await generateMasterKey();
  const response = await fetch("http://localhost:6280/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "create",
    },
    body: JSON.stringify({
      name: name,
      email: email,
      password: password,
      pubIdentKey: openpgpKeyGroup.publicKey,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error("Failed to decode the http result");
  }

  const newConfig: UserConfig = {
    id: -1,
    userId: result.id,
    displayId: result.display_id,
    name: name,
    email: email,
    profile_avatar: "NMG",
  };
  const pgpProfile: pgpProfile = {
    PrivateKey: openpgpKeyGroup.privateKey,
    PublicKey: openpgpKeyGroup.publicKey,
    RevocationCertificate: openpgpKeyGroup.revocationCertificate,
    ActivePrvKey: await getKeyFromArmored(openpgpKeyGroup.privateKey, null),
  };

  const newUser: User = {
    MasterKey: userMasterKey,
    config: newConfig,
    Pgp: pgpProfile,
  };

  const res = await InsertUser(newUser, Kek);
  if (!res.ok) {
    addAppErrNotif(res.error);
    return null;
  }
  newUser.config.id = res.value;
  await SetActiveUserId(newUser.config.id);
  return newUser;
}
