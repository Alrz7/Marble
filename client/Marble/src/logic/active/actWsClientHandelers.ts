import { Session, SessionId } from "@internal/intrCmnTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";
import { sessionsState } from "@sessions/sessionStates";
import { DeleteSessionFrmDb } from "@db/dbSessions";
import { DeleteAudienceFromDb } from "@db/dbAudience";

// --- Users ---
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

// --- Sessions ---
/** 
onSyncSession sends a sync request to pull any latest session changes
we call this method once at the begining including the existing sessions
then server will send update orders to client to update and sync changes
to the latest version in server.
then, when ever there was a need for update, the server pushes the changes
automaticaly.
 */
export async function onSyncSession(sessions: Session[]) {
  const lastSessionSeq =
    sessions.length > 0 ? Math.max(...sessions.map((s) => s.seq)) : 0;
  const struct: {
    lastSessionEvent: number;
  } = {
    lastSessionEvent: lastSessionSeq,
  };
  const req: Request = {
    status: MessageStatus.Request,
    channel: "sessions",
    headers: { task: "sync" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

export async function onDeleteSession(session: Session) {
  const { deleteSession } = sessionsState.getState();
  const req: Request = {
    status: MessageStatus.Request,
    channel: "sessions",
    headers: { task: "delete" },
    body: JSON.stringify({ sessionId: session.sessionId }),
  };
  Promise.all([
    sendRequest(req),
    await DeleteSessionFrmDb(session.id),
    await DeleteAudienceFromDb(session.audience),
  ]);
  deleteSession(session.id);
}

export async function onSyncMessage(
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
