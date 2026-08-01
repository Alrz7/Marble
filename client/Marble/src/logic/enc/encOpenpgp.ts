import {
  commonErrors,
  err,
  errEdtMessage,
  fromPromiseErr,
  newAppErr,
  ok,
  Result,
} from "@internal/golog";
import * as openpgp from "openpgp";
import { config } from "openpgp";
//---- Config ----
config.aeadProtect = true;
config.v6Keys = true;
config.preferredSymmetricAlgorithm = openpgp.enums.symmetric.aes256;

export async function generateIdntKey(
  name: string,
  email: string,
  // passphrase: string,
): Promise<
  Result<{
    privateKey: string;
    publicKey: string;
    revocationCertificate: string;
  }>
> {
  return await fromPromiseErr(
    openpgp.generateKey({
      type: "curve25519",
      userIDs: [{ name: name, email: email }],
      // passphrase: passphrase,
      format: "armored",
      // config: {
      //   preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256,
      //   aeadProtect: true,
      //   v6Keys: true,
      // },
    }),
    newAppErr(
      "pgpFailedToGenerateIdentityKey",
      "failed to generate private Identity Key-group",
    ),
  );
}
/**
 * @param armPublicKey the armored Public key of the receiver
 * @param message the message you want to encrypt as string
 * @param privateKey it signs the encrypted message if PrivateKey was provided
 * @description Encrypts the message and signs it if PrivateKey is provided.
 */
export async function encryptMessage(
  armPublicKey: string,
  message: string,
  privateKey?: openpgp.PrivateKey,
): Promise<Result<string>> {
  const publicKeyRes = await fromPromiseErr(
    openpgp.readKey({ armoredKey: armPublicKey }),
    commonErrors.failedToReadKey,
  );
  if (!publicKeyRes.ok) return err(publicKeyRes.error);

  const newMessageRes = await fromPromiseErr(
    openpgp.createMessage({
      text: message,
    }),
    newAppErr("pgpFailedToCreateMessage", "failed to create new Pgp Message"),
  );
  if (!newMessageRes.ok) return err(newMessageRes.error);

  const encOptions: any = {
    message: newMessageRes.value,
    encryptionKeys: publicKeyRes.value,
    format: "armored" as const,
  };

  if (privateKey) {
    encOptions.signingKeys = privateKey;
  }

  const encryptedRes = await fromPromiseErr(
    openpgp.encrypt(encOptions),
    errEdtMessage(
      commonErrors.encryptionFailed,
      "Pgp failed to encrypt Message",
    ),
  );
  if (!encryptedRes.ok) return err(encryptedRes.error);

  return ok(encryptedRes.value as string);
}

export async function decryptMessage(
  privateKey: openpgp.PrivateKey,
  encryptedMessage: string,
  armPublicKey?: string,
): Promise<Result<string>> {
  const messageRes = await fromPromiseErr(
    openpgp.readMessage({
      armoredMessage: encryptedMessage,
    }),
    newAppErr("failedToReadMessage", "failed to read pgp message"),
  );
  if (!messageRes.ok) return err(messageRes.error);

  const decOptions: openpgp.DecryptOptions = {
    message: messageRes.value,
    decryptionKeys: privateKey,
  };

  if (armPublicKey) {
    const verificationKeyRes = await fromPromiseErr(
      openpgp.readKey({
        armoredKey: armPublicKey,
      }),
      commonErrors.failedToReadKey,
    );
    if (!verificationKeyRes.ok) return err(verificationKeyRes.error);

    decOptions.verificationKeys = verificationKeyRes.value;
  }

  const decryptedRes = await fromPromiseErr(
    openpgp.decrypt(decOptions),
    errEdtMessage(
      commonErrors.decryptionFailed,
      "failed to decrypt pgp message",
    ),
  );
  if (!decryptedRes.ok) return err(decryptedRes.error);

  return ok(decryptedRes.value.data as string);
}

export async function getKeyFromArmored(
  armoredKey: string,
  password: string | null,
): Promise<Result<openpgp.PrivateKey>> {
  const privateKey = await fromPromiseErr(
    openpgp.readPrivateKey({ armoredKey }),
    commonErrors.failedToReadKey,
  );
  if (!privateKey.ok) return err(privateKey.error);

  if (password) {
    const decryptedPrivateKey = await fromPromiseErr(
      openpgp.decryptKey({
        privateKey: privateKey.value,
        passphrase: password,
      }),
      errEdtMessage(commonErrors.decryptionFailed, "failed to decrypt Pgp Key"),
    );
    if (!decryptedPrivateKey.ok) return err(decryptedPrivateKey.error);
    return ok(decryptedPrivateKey.value);
  }
  return ok(privateKey.value);
}
