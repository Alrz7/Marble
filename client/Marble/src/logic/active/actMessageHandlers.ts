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
  const { currentSession } = sessionsState.getState();
  if (!currentUser || !currentSession) return;

  const MessageToJsonString: string = JSON.stringify(message);
  const encMessage = await encryptMessage(
    currentSession.audience.armedPubKey,
    MessageToJsonString,
  );
  if (!encMessage) return;

  const struct: {
    audienceId: UserId;
    sessionId: SessionId;
    message: String;
  } = {
    audienceId: currentSession.audience.userId,
    sessionId: currentSession.sessionId,
    message: encMessage,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "messages",
    headers: { task: "send" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);

  saveNewMessage(currentSession, currentUser.MasterKey, message);
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
  const { currentSession } = sessionsState.getState();
  if (!currentUser || !currentSession) return;

  const existing = await GetMessages(currentUser.MasterKey, currentSession, 10);
  return existing;
}
