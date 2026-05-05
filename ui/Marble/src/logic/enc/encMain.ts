import * as openpgp from "openpgp";
// import { app } from "../internal/config";
import { config } from "openpgp";
config.aeadProtect = true;
config.v6Keys = true;
config.preferredSymmetricAlgorithm = openpgp.enums.symmetric.aes256;


export async function GenerateIdntKey(
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

export async function EncryptMessage(
  armPublicKey: string,
  message: string,
  armPrivateKey?: string,
) {
  const publicKey = await openpgp.readKey({ armoredKey: armPublicKey });

  const privateKey = armPrivateKey
    ? await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: armPrivateKey }),
        // passphrase
      })
    : undefined;

  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({
      text: message,
      date: new Date(Date.now()),
    }),
    encryptionKeys: publicKey,
    signingKeys: privateKey, // optional
  });
  console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'

  const encMessage = await openpgp.readMessage({
    armoredMessage: encrypted, // parse armored message
  });
  console.log(encMessage);
}

// const s = await GenerateAuthKey(
//   "navid",
//   "navid@gmail.com",
//   "lkjlfsdlfdsjkffkj",
// );
// EncryptMessage(s.publicKey, "this is a message");
