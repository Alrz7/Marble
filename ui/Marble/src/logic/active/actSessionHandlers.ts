import { encryptMessage } from "../enc/encHelpers";
import {
  Audience,
  MessageProps,
  Session,
  SessionId,
  UserConfig,
  UserId,
} from "../internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";

// ---- sessions ----

export async function onCreateNewSession(audience: Audience, message: MessageProps) {
  const MessageToJsonString: string = JSON.stringify(message)
  const encMessage = await encryptMessage(audience.armedPubKey, MessageToJsonString);
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
export async function onSyncSession(user: UserConfig) {
  const existing: Record<UserId, SessionId> = {};
  Object.entries(user.sessions).forEach(([, aud]) => {
    existing[aud.beta.userId] = aud.sessionId;
  });
  const struct: {
    existingSessions: Record<UserId, SessionId>;
  } = {
    existingSessions: existing,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "sync" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

export function hndlAddSession(
  req: Request,
  sessionList: Session[],
  addSession: (origin: Session[], sessions: Session[]) => void,
) {
  try {
    const data: { sessions: Session[] } = JSON.parse(req.body);
    addSession(sessionList, data.sessions);
  } catch (err) {
    console.error(err);
  }
}



// -----* messages *-----
export async function onSendMessage(session: Session, content: MessageProps) {
  const MessageToJsonString: string = JSON.stringify(content)
  const encMessage = await encryptMessage(session.beta.armedPubKey, MessageToJsonString);
  if (!encMessage) return;

  const struct: {
    audienceId: UserId
    sessionId: SessionId;
    message: String;
  } = {
    audienceId: session.beta.userId,
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
}
