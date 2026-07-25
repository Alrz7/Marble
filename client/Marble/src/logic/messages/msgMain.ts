import { dbUpdateMessageById } from "@db/dbMessages";
import { encryptMessage } from "@enc/encOpenpgp";
import { Message, Session, SessionId, UserId } from "@internal/intrCmnTypes";
import { MessageStatus, Request } from "@active/actTypes";
import { sendRequest } from "@active/actWebsocket";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { isSessionLegit } from "@sessions/sessionHelpers";
import { addNewNotification } from "@states/stateNotif";
import { REQUEST_NOT_SENT, SESSION_NOT_VALID } from "@internal/intrCmnVars";
import { saveNewMessage } from "./msgHelpers";
import { DeleteMessge, GetMessages } from "@db/dbMessages";
import { messageState } from "./stateMessage";

// -----* messages *-----
export async function onSendNewMessage(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;

  await saveNewMessage(curSession, currentUser.MasterKey, message);
  const throwMessage = await onSendMessage(message, curSession);
  if (!throwMessage) saveNewMessage(curSession, currentUser.MasterKey, message);

  const {addMessage} = messageState.getState()
  addMessage(message);
}

export async function onSendMessage(
  message: Message,
  curSession: Session,
): Promise<boolean> {
  const isLegit = isSessionLegit(curSession);

  if (isLegit) {
    const sent = await onRequestSendMessage(message, curSession);
    if (!sent) {
      message.status = "notSend";
      addNewNotification(
        "error",
        REQUEST_NOT_SENT,
        "Message not send!, failed to send request!",
      );
    }
    return sent;
    
  } else {
    message.status = "notSend";
    addNewNotification(
      "error",
      SESSION_NOT_VALID,
      "Message not send!, session is not verified by server",
    );
    return false;
  }
}

export async function onRequestSendMessage(
  message: Message,
  curSession: Session,
) {
  const MessageToJsonString: string = JSON.stringify(message.content);
  const encMessage = await encryptMessage(
    curSession.audience.armedPubKey,
    MessageToJsonString,
  );
  const struct: {
    audienceId: UserId;
    sessionId: SessionId;
    message: String;
    messageEventId: number;
  } = {
    audienceId: curSession.audience.userId,
    sessionId: curSession.sessionId,
    message: encMessage,
    messageEventId: message.id,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "messages",
    headers: { task: "send" },
    body: JSON.stringify(struct),
  };
  return sendRequest(req);
}

export async function onResendMessage(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;

  const throwMessage = await onSendMessage(message, curSession);
  if (!throwMessage) {
    dbUpdateMessageById(message.id, message, currentUser.MasterKey);
  }
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
