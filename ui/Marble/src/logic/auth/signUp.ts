import { fetch } from "@tauri-apps/plugin-http";
import { User } from "../commonTtypes";
// const response = await fetch("http://localhost:3003/users/2", {
//   method: "GET",
//   timeout: 30,
// });

export async function createAccount(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const userInfo = { name, email, password };

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
    console.log("Error:", result);
    throw new Error("Failed to create account");
  }
  console.log(result);
  return {
    user_address: result.user_address,
    identity_key: result.identity_key,
  };
}
