import { fetch } from "@tauri-apps/plugin-http";
import {
  AuthMethod,
  DefEncoder,
  pgpProfile,
  User,
  UserConfig,
} from "@internal/intrCmnTypes";
import { generateIdntKey, getKeyFromArmored } from "@enc/encOpenpgp";
import { InsertUser, SetActiveUserId } from "@db/dbUsers";
import {
  GetMasterKeyFromMasterString,
  GetWrappingKeyByMethod,
} from "@enc/encMain";
import {
  AppError,
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseErr,
  newAppErr,
  ok,
  Result,
} from "@internal/golog";
import { stateSignUp } from "@states/stateAuth";
import { bytesToHex, deriveRawKeyFromPassword } from "@enc/encAuth";

export async function onSignUp(
  selectedMethod?: AuthMethod,
  passphraseVal?: string,
) {
  const {
    setIsLoading,
    authMethod,
    passphrase,
    recoveryMode,
    name,
    email,
    customRecoveryKey,
    username,
    generatedRecoveryKey,
  } = stateSignUp.getState();
  setIsLoading(true);
  try {
    const finalMethod = selectedMethod || authMethod;
    const finalPassphrase =
      passphraseVal !== undefined ? passphraseVal : passphrase;
    const finalRecoveryPhrase: string =
      recoveryMode == "custom" ? customRecoveryKey : generatedRecoveryKey;

    const openpgpKeyGroup = await generateIdntKey(name, email);
    if (!openpgpKeyGroup.ok) {
      return err(openpgpKeyGroup.error);
    }

    const serverReqResult = await onSendSignupRequest(
      name,
      username,
      email,
      finalRecoveryPhrase,
      openpgpKeyGroup.value.publicKey,
    );
    if (!serverReqResult.ok) {
      return err(serverReqResult.error);
    }
    const newConfig: UserConfig = {
      id: -1,
      userId: serverReqResult.value.id,
      displayId: serverReqResult.value.display_id,
      name: name,
      email: email,
      profile_avatar: "NMG",
    };

    const localMasterKey =
      await GetMasterKeyFromMasterString(finalRecoveryPhrase);
    if (!localMasterKey.ok) {
      return err(localMasterKey.error);
    }

    const actPrvKey = await getKeyFromArmored(
      openpgpKeyGroup.value.privateKey,
      null,
    );
    if (!actPrvKey.ok) {
      return err(actPrvKey.error);
    }

    const pgpProfile: pgpProfile = {
      PrivateKey: openpgpKeyGroup.value.privateKey,
      PublicKey: openpgpKeyGroup.value.publicKey,
      RevocationCertificate: openpgpKeyGroup.value.revocationCertificate,
      ActivePrvKey: actPrvKey.value,
    };

    const newUser: User = {
      MasterKey: localMasterKey.value,
      config: newConfig,
      Pgp: pgpProfile,
      authMethod: finalMethod,
    };

    const WrappingKey = await GetWrappingKeyByMethod(
      finalMethod,
      finalPassphrase,
    );
    if (!WrappingKey.ok) {
      return err(WrappingKey.error);
    }

    const res = await InsertUser(newUser, localMasterKey.value, WrappingKey.value);
    if (!res.ok) {
      return err(res.error);
    }
    newUser.config.id = res.value;
    await SetActiveUserId(newUser.config.id);

    return ok(newUser);
  } finally {
    setIsLoading(false);
  }
}

async function onSendSignupRequest(
  name: string,
  username: string,
  email: string,
  masterKeyPrase: string,
  pgpPublicKey: string,
) {
  const ServerAuthHash = await deriveRawKeyFromPassword(
    masterKeyPrase,
    DefEncoder.encode("server-auth-salt"),
  );
  if (!ServerAuthHash.ok) {
    return err(ServerAuthHash.error);
  }
  const passInHex = bytesToHex(ServerAuthHash.value);

  const response = await fromPromiseErr(
    fetch("http://localhost:6280/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        task: "create",
      },
      body: JSON.stringify({
        name: name,
        // username: username,
        email: email,
        password: passInHex,
        pubIdentKey: pgpPublicKey,
      }),
    }),
    newAppErr("FailedToSignUp", "failed to send signup request"),
  );
  if (!response.ok) {
    return err(response.error);
  }
  if (!response.value.ok) {
    return err(newAppErr("signUpFailed", "server rejected the Signup Request"));
  }

  const result: Result<{ id: number; display_id: string }, AppError> =
    await fromPromiseErr(
      response.value.json(),
      errEdtMessage(
        commonErrors.conversionFailed,
        "failed to proccess signup response",
      ),
    );
  if (!result.ok) {
    return err(result.error);
  }
  return ok(result.value);
}

// // the openpgpKeyGroup & strongHoldKey Key-Groups are going to be saved in the StrongHold
// // there are save there but i'll add encryption to these keys later too

// export async function createAccount(
//   name: string,
//   email: string,
//   password: string,
// ): Promise<User | null> {
//   const kek = await GetOrCreateKeyChainKey();
//   if (!kek.ok) {
//     addAppErrNotif(kek.error);
//     return null;
//   }
//   if (kek.value == null) {
//     addAppErrNotif(commonErrors.keychainKeyNotValid);
//     return null;
//   }

//   const openpgpKeyGroup = await generateIdntKey(name, email);
//   if (!openpgpKeyGroup.ok) {
//     addAppErrNotif(openpgpKeyGroup.error);
//     return null;
//   }
//   const userMasterKey = await generateMasterKey();
//   if (!userMasterKey.ok) {
//     addAppErrNotif(userMasterKey.error);
//     return null;
//   }
//   const response = await fetch("http://localhost:6280/account", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       task: "create",
//     },
//     body: JSON.stringify({
//       name: name,
//       email: email,
//       password: password,
//       pubIdentKey: openpgpKeyGroup.value.publicKey,
//     }),
//   });

//   const result = await response.json();

//   if (!response.ok) {
//     throw new Error("Failed to decode the http result");
//   }

//   const newConfig: UserConfig = {
//     id: -1,
//     userId: result.id,
//     displayId: result.display_id,
//     name: name,
//     email: email,
//     profile_avatar: "NMG",
//   };

//   const actPrvKey = await getKeyFromArmored(
//     openpgpKeyGroup.value.privateKey,
//     null,
//   );
//   if (!actPrvKey.ok) {
//     addAppErrNotif(actPrvKey.error);
//     return null;
//   }

//   const pgpProfile: pgpProfile = {
//     PrivateKey: openpgpKeyGroup.value.privateKey,
//     PublicKey: openpgpKeyGroup.value.publicKey,
//     RevocationCertificate: openpgpKeyGroup.value.revocationCertificate,
//     ActivePrvKey: actPrvKey.value,
//   };

//   const newUser: User = {
//     MasterKey: userMasterKey.value,
//     config: newConfig,
//     Pgp: pgpProfile,
//   };

//   const res = await InsertUser(newUser, kek.value);
//   if (!res.ok) {
//     addAppErrNotif(res.error);
//     return null;
//   }
//   newUser.config.id = res.value;
//   await SetActiveUserId(newUser.config.id);
//   return newUser;
// }
