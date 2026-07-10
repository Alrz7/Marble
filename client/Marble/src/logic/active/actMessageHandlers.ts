import { GetMessages, InsertMessage } from "../db/dbSessions";
import { encryptMessage } from "../enc/encOpenpgp";
import { Message, Session, SessionId, UserId } from "../internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";
import { sessionsState } from "../states/sessionStates";
import { AppUser } from "../states/userMainStates";

// -----* messages *-----
export async function onSendMessage(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions } = sessionsState.getState();
  if (!currentUser) return;
  const curSession = sessions.get(currentSessionId);
  if (!curSession) return;

  console.log(curSession);
  const MessageToJsonString: string = JSON.stringify(message);
  const encMessage = await encryptMessage(
    curSession.audience.armedPubKey,
    MessageToJsonString,
  );
  if (!encMessage) return;

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

export async function saveNewMessage(
  session: Session,
  masterKey: CryptoKey,
  message: Message,
) {
  const id = await InsertMessage(session, message, masterKey);
  message.id = id;
}

export async function loadSavedMessages() {
  const { currentUser } = AppUser.getState();
  if (!currentUser) return;
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession) return;

  const existing = await GetMessages(currentUser.MasterKey, curSession, 10);
  return existing;
}
