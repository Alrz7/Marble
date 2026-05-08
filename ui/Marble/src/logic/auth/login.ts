import { fetch } from "@tauri-apps/plugin-http";
import { getHoldUser, addHoldUser, setPrimaryUser } from "../enc/encStoreManagement";
import { UserConfig } from "../internal/commonTtypes";

// on the login we need to set the Logging-user as Primary-user
export async function login(
    name: string,
    id: number,
    password: string,
): Promise<UserConfig | null> {
    const userList = await getHoldUser()
    const existingUser = userList?.users?.[`${name}-${id}`]
    if (!existingUser) throw new Error(`${name}-${id} is not found in UserList`)

    const response = await fetch("http://localhost:6280/account", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            task: "signin",
        },
        body: JSON.stringify({
            name: name,
            id: id,
            password: password,
        }),
    });
    const result = await response.json();

    if (!response.ok) {
        throw new Error("Failed to decode the http result");
    }
    // console.log(result)
    const currentUser: UserConfig = {
        name: name,
        id: id,
        email: result.email,
        address: result.address,
        identityKey: existingUser.identityKey,
    };
    setPrimaryUser(currentUser.address)
    addHoldUser(currentUser);
    return currentUser;
}


// while logging out there can be two approaches :-> we aither set the User's Primary parameter as Null (then on a reload there wont be any 
// auto Login) OR we Do NOT change the user's Primary property (which in this case the user will log back to the same Out-logged account
// i they don't Log in Another account before the reload)
export async function logOut() {

}