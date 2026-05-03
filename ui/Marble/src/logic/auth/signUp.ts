import * as enc from "../enc/encMain.ts";
import * as encHlp from "../enc/encHelpers.ts";
import { fetch } from "@tauri-apps/plugin-http";
// import { User } from "../internal/commonTtypes";

export type SignUpToken = {
  name: string;
  email: string;
  id: string;
  address: string;
  IdentityKey: {
    privateKey: string;
    publicKey: string;
    revocationCertificate: string;
  };
} | null;

export async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<SignUpToken> {
  const IdentityKey = await enc.GenerateAuthKey(name, email, password);
  const userInfo: {
    name: string;
    email: string;
    password: string;
    pubIdentKey: string;
  } = {
    name: name,
    email: email,
    password: password,
    pubIdentKey: IdentityKey.publicKey,
  };

  const response = await fetch("http://localhost:6280/account", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      task: "create",
    },
    body: JSON.stringify(userInfo),
  });

  const result = await response.json();

  if (!response.ok) {
    console.log("Error: Failed to create account", result);
    return null;
    // throw new Error("Failed to create account");
  }
  console.log(result);

  encHlp.SetkeyChainObject("prvIdentKey", IdentityKey.privateKey);
  encHlp.SetkeyChainObject("passphrase", password);
  encHlp.SetkeyChainObject(
    "revocationCertificate",
    IdentityKey.revocationCertificate,
  );

  return {
    name: name,
    email: email,
    id: result.id,
    address: result.address,
    IdentityKey: IdentityKey
  };
}
