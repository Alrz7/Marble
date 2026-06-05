import { encryptMessage } from "../enc/encHelpers";
import {
  Audience,
  Session,
  SessionId,
  UserConfig,
  UserId,
} from "../internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";

// ---- sessions ----

export async function onSetCreateSession(audience: Audience, content: string) {
  const message = await encryptMessage(audience.armedPubKey, content);
  if (!message) return;

  const struct: {
    userId: number;
    content: string;
  } = {
    userId: audience.userId,
    content: message,
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
    existingSesions: Record<UserId, SessionId>;
  } = {
    existingSesions: existing,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "sync" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

// --- search ---
export function onSearchUser(param: string) {
  const struct: {
    param: string;
  } = {
    param: param,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "searchUser",
    headers: {},
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

// -----* messages *-----
export async function onSendMessage(session: Session, content: string) {
  const message = await encryptMessage(session.beta.armedPubKey, content);
  if (!message) return;

  const struct: {
    sessionId: number;
    message: String;
  } = {
    sessionId: session.sessionId,
    message: message,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "send" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}
