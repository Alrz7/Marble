import { dbUpdateMessageById } from "@db/dbMessages";
import { encryptMessage } from "@enc/encOpenpgp";
import { Message, Session, SessionId, UserId } from "@internal/intrCmnTypes";
import { MessageStatus, Request } from "@active/actTypes";
import { sendRequest } from "@active/actWsCore";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { isSessionLegit } from "@sessions/sessionHelpers";
import { addNewNotification } from "@states/stateNotif";
import { ResendQueue, saveNewMessage } from "./msgHelpers";
import { dbDeleteMessge, GetMessages } from "@db/dbMessages";
import { messageState } from "./stateMessage";
import { NotificationKeys } from "@internal/intrCmnVars";
import { addAppErrNotif } from "@internal/golog";

export async function onSendNewMessage(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;

  await saveNewMessage(curSession, currentUser.MasterKey, message);
  const throwMessage = await onSendMessage(message, curSession);

  const { addMessage } = messageState.getState();
  addMessage(message);

  if (!throwMessage) {
    await dbUpdateMessageById(message.id, message, currentUser.MasterKey);
  }
}

export async function onResendMessage(message: Message) {
  if (ResendQueue.has(message.id)) return;
  ResendQueue.set(message.id, message);
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;

  const throwMessage = await onSendMessage(message, curSession, true);
  if (!throwMessage) {
    dbUpdateMessageById(message.id, message, currentUser.MasterKey);
  }
}

export async function onSendMessage(
  message: Message,
  curSession: Session,
  Resend?: boolean,
): Promise<boolean> {
  const isLegit = isSessionLegit(curSession);

  if (isLegit) {
    const sent = await onRequestSendMessage(message, curSession);
    if (!sent) {
      message.status = "notSend";
      addNewNotification(
        "error",
        NotificationKeys.REQUEST_NOT_SENT,
        "Message not send!, failed to send request!",
      );
    }
    return sent;
  } else {
    if (Resend) {
      const Recreated = await reCreateSessionViaMessage(message, curSession);
      return Recreated;
    }
    message.status = "notSend";
    addNewNotification(
      "error",
      NotificationKeys.SESSION_NOT_VALID,
      "Message not send!, session is not verified by server",
    );
    return false;
  }
}

async function reCreateSessionViaMessage(
  message: Message,
  session: Session,
): Promise<boolean> {
  const MessageToJsonString: string = JSON.stringify(message.content);
  const encMessage = await encryptMessage(
    session.audience.armedPubKey,
    MessageToJsonString,
  );
  const struct: {
    audienceId: number;
    message: string;
    MessageEventId: number;
    sessionEventId: SessionId;
  } = {
    audienceId: session.audience.userId,
    message: encMessage,
    MessageEventId: message.id,
    sessionEventId: session.id,
  };

  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "create" },
    body: JSON.stringify(struct),
  };

  const sent = sendRequest(req);
  if (!sent) {
    message.status = "notSend";
  }
  return sent;
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
    message: string;
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

export async function loadSavedMessages(): Promise<Message[] | null> {
  const { currentUser } = AppUser.getState();
  if (!currentUser) return null;
  const { currentSessionId, sessions } = sessionsState.getState();

  const curSession = sessions.get(currentSessionId);
  if (!curSession) return null;

  const existing = await GetMessages(currentUser.MasterKey, curSession, 10);
  if (existing.ok) {
    return existing.value;
  }else{
    addAppErrNotif(existing.error)
  }
  return null
}

export async function DeleteMessage(message: Message) {
  const { deleteMessage } = messageState.getState();
  deleteMessage(message.id);
  await dbDeleteMessge(message);
}

export async function onSyncMessage(
  sessionId: SessionId,
  lastMessageSeq: number,
) {
  const struct: {
    sessionId: SessionId;
    lastMessageSeq: number;
  } = {
    sessionId: sessionId,
    lastMessageSeq: lastMessageSeq,
  };
  const req: Request = {
    status: MessageStatus.Request,
    channel: "messages",
    headers: { task: "sync" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

export async function onCLearSyncedMessage(
  sessionId: SessionId,
  lastMessageSeq: number,
) {
  const struct: {
    sessionId: number;
    lastMessageSeq: number;
  } = {
    sessionId: sessionId,
    lastMessageSeq: lastMessageSeq,
  };
  const req: Request = {
    status: MessageStatus.Request,
    channel: "messages",
    headers: { task: "clear" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}
