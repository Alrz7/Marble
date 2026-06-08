import * as openpgp from "openpgp";
import { config } from "openpgp";
import { MessageProps } from "../internal/commonTypes";

//---- Config ----
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
  message: string,
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
      format: "armored",
    };

    if (privateKey) {
      encOptions.signingKeys = privateKey;
    }

    return (await openpgp.encrypt(encOptions)) as string; // encrypted
    // return btoa(String.fromCharCode(...new Uint8Array(encrypted))); // last aproach,
    //  need more researh and development to choode best one
  } catch (err) {
    throw new Error(`there was an error while encrypting the message ${err}`);
  }
}

export async function decryptMessage(
  privateKey: openpgp.PrivateKey,
  encryptMessage: string,
  armPublicKey?: string,
) {
  try {
    // const binaryString = atob(encryptedBinaryMessage);
    // const uint8Array = new Uint8Array(binaryString.length);
    const decOptions: openpgp.DecryptOptions = {
      message: await openpgp.readMessage({
        armoredMessage: encryptMessage,
      }),
      decryptionKeys: privateKey,
    };

    if (armPublicKey) {
      decOptions.verificationKeys = await openpgp.readKey({
        armoredKey: armPublicKey,
      });
    }
    const { data: decryptedJsonString } = await openpgp.decrypt(decOptions);
    return JSON.parse(decryptedJsonString) as MessageProps;
  } catch (err) {
    throw new Error(`there was an error while decryptig a message ${err}`);
  }
}

export async function getKeyFromArmored(
  armoredKey: string,
  password: string | null,
): Promise<openpgp.PrivateKey | null> {
  try {
    let privateKey = await openpgp.readPrivateKey({ armoredKey });
    if (password) {
      privateKey = await openpgp.decryptKey({
        privateKey,
        passphrase: password,
      });
    }
    return privateKey;
  } catch {
    return null;
  }
}
