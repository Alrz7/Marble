import { InsertMessage } from "@db/dbMessages";
import { Message, Session } from "@internal/intrCmnTypes";

export async function saveNewMessage(
  session: Session,
  masterKey: CryptoKey,
  message: Message,
) {
  const id = await InsertMessage(session, message, masterKey);
  message.id = id;
}

export function getMessageFromListById(
  list: Message[],
  id: number,
): { indx: number; message: Message | null } {
  const targetIndx = list.findIndex((m) => m.id === id) ?? null;
  return { indx: targetIndx, message: list[targetIndx] ?? null };
}
