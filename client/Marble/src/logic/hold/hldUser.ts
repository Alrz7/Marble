import {
  UserConfig,
  STRONGHOLD_OBJECT_KEYS,
  UserHold,
} from "../internal/commonTypes";
import { getData, Load, setData } from "./hldMain";

// StrongHold's USER CRUD Methods...
export async function setUser(
  newUser: UserConfig,
  load?: Load | null,
): Promise<void> {
  let existingData = await getUser(load);
  if (!existingData) existingData = { users: {}, primaryUser: null };

  // we currently set user as Primary
  existingData.primaryUser = newUser.display_id;
  existingData.users[newUser.display_id] = newUser;
  setData(JSON.stringify(existingData), STRONGHOLD_OBJECT_KEYS.Users, load);
}

export async function editUser(
  newUser: UserConfig,
  targetId?: string,
  load?: Load | null,
): Promise<void> {
  let existingData = await getUser(load);
  if (!existingData) existingData = { users: {}, primaryUser: null };

  existingData.users[newUser.display_id] = newUser;
  if (targetId && newUser.display_id !== targetId) {
    delete existingData.users[targetId];
    existingData.primaryUser = newUser.display_id;
  }
  setData(JSON.stringify(existingData), STRONGHOLD_OBJECT_KEYS.Users, load);
}

export async function getUser(load?: Load | null): Promise<UserHold | null> {
  const jsonString = await getData(STRONGHOLD_OBJECT_KEYS.Users, load);
  if (!jsonString) return null;
  const parsedObject = JSON.parse(jsonString) as UserHold;
  return parsedObject;
}

export async function deleteUser(
  userAddress: string,
  load?: Load | null,
): Promise<void> {
  let existingData = await getUser(load);
  if (existingData) {
    delete existingData.users[userAddress];
  }
  setData(JSON.stringify(existingData), STRONGHOLD_OBJECT_KEYS.Users, load);
}

//---------------------------------------
// --- Primary-User Methods ---

export async function setPrimaryUser(
  displayId: string,
  load?: Load | null,
): Promise<void> {
  let existingData = await getUser(load);
  if (!existingData) existingData = { users: {}, primaryUser: null };
  existingData.primaryUser = displayId;
  setData(JSON.stringify(existingData), STRONGHOLD_OBJECT_KEYS.Users, load);
}
export async function getPrimaryUser(
  load?: Load | null,
): Promise<string | null> {
  let existingData = await getUser(load);
  if (!existingData) return null;
  return existingData.primaryUser;
}

export async function deletePrimaryUser(load?: Load | null): Promise<void> {
  let existingData = await getUser(load);
  if (!existingData) existingData = { users: {}, primaryUser: null };
  existingData.primaryUser = null;
  setData(JSON.stringify(existingData), STRONGHOLD_OBJECT_KEYS.Users, load);
}
