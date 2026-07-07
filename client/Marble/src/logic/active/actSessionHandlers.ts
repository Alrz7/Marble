import {
  GetMessages,
  InsertMessage,
  InsertSession,
} from "../db/dbSessions";
import { encryptMessage } from "../enc/encOpenpgp";
import {
  Audience,
  Message,
  Session,
  SessionId,
  UserId,
} from "../internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";

// ---- sessions ----

export async function onCreateNewSession(audience: Audience, message: Message) {
  const MessageToJsonString: string = JSON.stringify(message);
  const encMessage = await encryptMessage(
    audience.armedPubKey,
    MessageToJsonString,
  );
  if (!encMessage) return;

  const struct: {
    audienceId: number;
    content: string;
  } = {
    audienceId: audience.userId,
    content: encMessage,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "create" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

/** 
onSyncSession sends a sync request to pull any latest session changes
we call this method once at the begining including the existing sessions
then server will send update orders to client to update and sync changes
to the latest version in server.
then, when ever there was a need for update, the server pushes the changes
automaticaly.
 */
export async function onSyncSession(existingSessions: Session[]) {
  const record: Record<UserId, SessionId> = {};
  Object.entries(existingSessions).forEach(([, val]) => {
    record[val.audience.id] = val.id;
  });
  const struct: {
    existingSessions: Record<UserId, SessionId>;
  } = {
    existingSessions: record,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "sync" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

export async function hndlAddSession(
  req: Request,
  masterKey: CryptoKey,
  origin: Session[],
  addSession: (origin: Session[], sessions: Session) => void,
) {
  try {
    const data: { sessions: Session[] } = JSON.parse(req.body);
    for (let session of data.sessions) {
      const id = await InsertSession(session, masterKey);
      session.id = id;
      addSession(origin, session);
    }
  } catch (err) {
    console.error(err);
  }
}

// -----* messages *-----
export async function onSendMessage(
  session: Session,
  masterKey: CryptoKey,
  message: Message,
) {
  const MessageToJsonString: string = JSON.stringify(message);
  const encMessage = await encryptMessage(
    session.audience.armedPubKey,
    MessageToJsonString,
  );
  if (!encMessage) return;

  const struct: {
    audienceId: UserId;
    sessionId: SessionId;
    message: String;
  } = {
    audienceId: session.audience.userId,
    sessionId: session.sessionId,
    message: encMessage,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "messages",
    headers: { task: "send" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);

  saveNewMessage(session, masterKey, message);
}

export async function saveNewMessage(
  session: Session,
  masterKey: CryptoKey,
  message: Message,
) {
  const id = await InsertMessage(session, message, masterKey);
  message.id = id;
}

export async function loadSavedMessages(
  masterKey: CryptoKey,
  session: Session,
) {
  const existing = await GetMessages(masterKey, session, 10);
  if (!existing) return;
  const MessageList: Message[] = [];
  return MessageList;
}
