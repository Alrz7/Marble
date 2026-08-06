import { fetch } from "@tauri-apps/plugin-http";
import {
  AuthMethod,
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
import { bytesToHex } from "@enc/encAuth";
import { genCryptoRandomValue } from "@enc/encHelpers";
import { AppUser } from "@user/stateUser";
import { setUserTokens } from "@db/dbAuthHelpers";

export async function onUserSignUp(
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

    const randomSalt = genCryptoRandomValue(32);
    const Master = await GetMasterKeyFromMasterString(
      finalRecoveryPhrase,
      randomSalt,
    );
    if (!Master.ok) {
      return err(Master.error);
    }

    const openpgpKeyGroup = await generateIdntKey(name, email);
    if (!openpgpKeyGroup.ok) {
      return err(openpgpKeyGroup.error);
    }

    const serverReqResult = await onSendSignUpRequest(
      name,
      username,
      email,
      Master.value.serverHash,
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
      MasterKey: Master.value.localKey,
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

    const user_id = await InsertUser(
      newUser,
      Master.value.localKey,
      WrappingKey.value,
      randomSalt,
    );
    if (!user_id.ok) {
      return err(user_id.error);
    }
    newUser.config.id = user_id.value;
    await SetActiveUserId(newUser.config.id);

    const { setAccessToken } = AppUser.getState();
    setAccessToken(serverReqResult.value.accessToken);
    const res = await setUserTokens(
      user_id.value,
      Master.value.localKey,
      serverReqResult.value.accessToken,
      serverReqResult.value.refreshToken,
    );
    if (!res.ok) return err(res.error);

    return ok(newUser);
  } finally {
    setIsLoading(false);
  }
}

async function onSendSignUpRequest(
  name: string,
  username: string,
  email: string,
  serverAuthKey: Uint8Array<ArrayBufferLike>,
  pgpPublicKey: string,
) {
  const passInHex = bytesToHex(serverAuthKey);

  const response = await fromPromiseErr(
    fetch("http://localhost:6280/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        task: "create",
      },
      body: JSON.stringify({
        name: name,
        username: username,
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

  const result: Result<
    {
      id: number;
      display_id: string;
      accessToken: string;
      refreshToken: string;
    },
    AppError
  > = await fromPromiseErr(
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
