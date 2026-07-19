import { DeleteMessge, GetMessages, InsertMessage } from "@db/dbMessages";
import {
  decryptMessage,
  encryptMessage,
  getKeyFromArmored,
} from "@enc/encOpenpgp";
import { Message, Session, SessionId, UserId } from "@internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { getSessionBySessionId } from "./actSessionHandlers";
import { isSessionLegit } from "@sessions/sessionHelpers";
import { messageState } from "@messages/stateMessage";

// -----* messages *-----
export async function onSendMessage(message: Message) {
  const { currentUser } = AppUser.getState();
  if (!currentUser) return;
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  const isLegit = isSessionLegit(curSession);
  if (!curSession || !isLegit) return;

  const MessageToJsonString: string = JSON.stringify(message.content);
  const encMessage = await encryptMessage(
    curSession.audience.armedPubKey,
    MessageToJsonString,
  );
  const struct: {
    audienceId: UserId;
    sessionId: SessionId;
    message: String;
  } = {
    audienceId: curSession.audience.userId,
    sessionId: curSession.sessionId,
    message: encMessage,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "messages",
    headers: { task: "send" },
    body: JSON.stringify(struct),
  };
  console.log(req);
  sendRequest(req);

  saveNewMessage(curSession, currentUser.MasterKey, message);
}

export async function HndlAddMessage(req: Request) {
  try {
    const data: { sessionId: SessionId; messages: Message[] } = JSON.parse(
      req.body,
    );
    if (data.messages.length == 0) return;
    if (!data.sessionId) throw new Error("sessionId was Not Valid");
    console.log(data.sessionId, data.messages);
    await actAddMessage(data.sessionId, data.messages);
  } catch (err) {
    console.error(err);
  }
}

export async function actAddMessage(
  sessionId: SessionId,
  messages: Message[],
): Promise<number> {
  const { currentUser } = AppUser.getState();
  if (!currentUser) return messages.at(0)?.seq ?? 0;
  const { currentSessionId, sessions } = sessionsState.getState();
  const { addMessage } = messageState.getState();
  const curSession = sessions.get(currentSessionId);

  const PrvKey = await getKeyFromArmored(currentUser.Pgp.PrivateKey, null);
  if (!PrvKey) {
    throw new Error("there was an error while recovering Prv-Key");
  }
  let session = getSessionBySessionId(sessionId);
  if (!session) {
    console.warn("session does Not Exist");
    return messages.at(0)?.seq ?? 0;
  }
  for (const message of messages) {
    let decryptedContent: string;
    try {
      decryptedContent = await decryptMessage(PrvKey, message.content);
    } catch (err) {
      console.error(err);
      decryptedContent = "*** Error While Decrypting Message ***";
    }
    console.log(message);
    message.content = decryptedContent;
    message.createdAt = new Date(message.createdAt);
    saveNewMessage(session, currentUser.MasterKey, message);
    if (curSession && sessionId == curSession.sessionId) {
      addMessage(message);
    }
  }

  return messages.at(-1)?.seq ?? 0;
}

export async function saveNewMessage(
  session: Session,
  masterKey: CryptoKey,
  message: Message,
) {
  const id = await InsertMessage(session, message, masterKey);
  message.id = id;
}

export async function loadSavedMessages(): Promise<Message[] | null> {
  const { currentUser } = AppUser.getState();
  if (!currentUser) return null;
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession) return null;

  const existing = await GetMessages(currentUser.MasterKey, curSession, 10);
  return existing;
}

export async function DeleteMessage(message: Message) {
  const { Messagelist, DeleteMessage } = messageState.getState();
  const indx = Messagelist.indexOf(message);
  if (indx !== -1) {
    DeleteMessage(indx);
    await DeleteMessge(message);
  }
}
