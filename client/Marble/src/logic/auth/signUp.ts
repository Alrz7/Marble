import { fetch } from "@tauri-apps/plugin-http";
import { pgpProfile, User, UserConfig } from "@internal/intrCmnTypes";
import { generateIdntKey, getKeyFromArmored } from "@enc/encOpenpgp";
import { InsertUser, SetActiveUserId } from "@db/dbUsers";
import { generateMasterKey } from "@enc/encMaster";
import { GetOrCreateKeyChainKey } from "@enc/encMain";
import { addAppErrNotif, commonErrors } from "@internal/golog";

// the openpgpKeyGroup & strongHoldKey Key-Groups are going to be saved in the StrongHold
// there are save there but i'll add encryption to these keys later too

export async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<User | null> {
  const kek = await GetOrCreateKeyChainKey();
  if (!kek.ok) {
    addAppErrNotif(kek.error);
    return null;
  }
  if (kek.value == null) {
    addAppErrNotif(commonErrors.keychainKeyNotValid);
    return null;
  }

  const openpgpKeyGroup = await generateIdntKey(name, email);
  if (!openpgpKeyGroup.ok) {
    addAppErrNotif(openpgpKeyGroup.error);
    return null;
  }
  const userMasterKey = await generateMasterKey();
  if (!userMasterKey.ok) {
    addAppErrNotif(userMasterKey.error);
    return null;
  }
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
      pubIdentKey: openpgpKeyGroup.value.publicKey,
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

  const actPrvKey = await getKeyFromArmored(
    openpgpKeyGroup.value.privateKey,
    null,
  );
  if (!actPrvKey.ok) {
    addAppErrNotif(actPrvKey.error);
    return null;
  }

  const pgpProfile: pgpProfile = {
    PrivateKey: openpgpKeyGroup.value.privateKey,
    PublicKey: openpgpKeyGroup.value.publicKey,
    RevocationCertificate: openpgpKeyGroup.value.revocationCertificate,
    ActivePrvKey: actPrvKey.value,
  };

  const newUser: User = {
    MasterKey: userMasterKey.value,
    config: newConfig,
    Pgp: pgpProfile,
  };

  const res = await InsertUser(newUser, kek.value);
  if (!res.ok) {
    addAppErrNotif(res.error);
    return null;
  }
  newUser.config.id = res.value;
  await SetActiveUserId(newUser.config.id);
  return newUser;
}
