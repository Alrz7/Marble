import * as openpgp from "openpgp";
// import { app } from "../internal/config";
import { config } from "openpgp";
config.aeadProtect = true;
config.v6Keys = true;
config.preferredSymmetricAlgorithm = openpgp.enums.symmetric.aes256;

export async function generateIdntKey(
  name: string,
  email: string,
  // passphrase: string,
): Promise<{
  privateKey: string;
  publicKey: string;
  revocationCertificate: string;
}> {
  return await openpgp.generateKey({
    type: "curve25519",
    userIDs: [{ name: name, email: email }],
    // passphrase: passphrase,
    format: "armored",
    // config: {
    //   preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256,
    //   aeadProtect: true,
    //   v6Keys: true,
    // },
  });
}

/**
 @param armPublicKey the armored Public key of the reciver
 @param privateKey the message you want to encrypt as string
 @param privateKey it signs the encrypted message to if PrivateKey was provided
 @description EncryptMessage encrypts the message and signs it too if the PrivateKey was Provided & it Returns the Based64 Binary string.
 */
export async function encryptMessage(
  armPublicKey: string,
  message: any,
  privateKey?: openpgp.PrivateKey,
): Promise<string> {
  try {
    const publicKey = await openpgp.readKey({ armoredKey: armPublicKey });

    const encOptions: any = {
      message: await openpgp.createMessage({
        text: message,
        date: new Date(Date.now()),
      }),
      encryptionKeys: publicKey,
      format: "binary"
    }

    if (privateKey) {
      encOptions.signingKeys = privateKey
    }

    const encrypted = await openpgp.encrypt(encOptions);
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  } catch (err) {
    throw new Error(`there was an error while encrypting the message ${err}`)
  }
}

export async function decryptMessage(privateKey: openpgp.PrivateKey, encryptedBinaryMessage: string, armPublicKey?: string) {
  try {
    const decOptions: openpgp.DecryptOptions = {
      message: await openpgp.readMessage({ binaryMessage: encryptedBinaryMessage }),
      decryptionKeys: privateKey,
    }

    if (armPublicKey) {
      decOptions.verificationKeys = await openpgp.readKey({ armoredKey: armPublicKey })
    }
    return await openpgp.decrypt(decOptions);
  } catch (err) {
    throw new Error(`there was an error while decryptig a message ${err}`)
  }
}