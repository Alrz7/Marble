import { Session } from "../internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";

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
  const lastSessionSeq = Math.max(...sessions.map((session) => session.seq));
  const struct: {
    lastSessionEvent: number;
  } = {
    lastSessionEvent: lastSessionSeq,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "sync" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}
