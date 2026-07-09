import {
  InsertAudience,
  InsertMessage,
  InsertSession,
  UpdateSessionById,
} from "../db/dbSessions";
import { encryptMessage } from "../enc/encOpenpgp";
import { Message, Session } from "../internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";
import { sessionsState } from "../states/sessionStates";
import { AppUser } from "../states/userMainStates";

// ---- sessions ----

export async function onCreateNewSession(message: Message) {
  const { currentSession, setCurrentSession } = sessionsState.getState();
  const { currentUser } = AppUser.getState();
  if (!currentUser || !currentSession) return;

  const MessageToJsonString: string = JSON.stringify(message);
  const encMessage = await encryptMessage(
    currentSession.audience.armedPubKey,
    MessageToJsonString,
  );
  if (!encMessage) return;

  const struct: {
    audienceId: number;
    content: string;
  } = {
    audienceId: currentSession.audience.userId,
    content: encMessage,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "create" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);
  var id = await InsertAudience(currentSession.audience, currentUser.MasterKey);
  currentSession.audience.id = id;
  id = await InsertSession(currentSession, currentUser.MasterKey);
  currentSession.id = id;
  await InsertMessage(currentSession, message, currentUser.MasterKey);
  setCurrentSession({ ...currentSession });
}

export async function hndlAddSession(req: Request) {
  const { currentUser } = AppUser.getState();
  const { addSession } = sessionsState.getState();
  if (!currentUser) return;

  try {
    const data: { sessions: Session[] } = JSON.parse(req.body);
    for (let session of data.sessions) {
      session.audience.ownerId = currentUser.config.id;
      session.ownerId = currentUser.config.id;
      // console.log(session);

      const existing = await SameOnStage(session);
      if (existing !== null) {
        UpdateSessionById(
          existing.id,
          session.sessionId,
          currentUser.MasterKey,
        );
      } else {
        var id = await InsertAudience(session.audience, currentUser.MasterKey);
        session.audience.id = id;
        id = await InsertSession(session, currentUser.MasterKey);
        session.id = id;
        addSession(session);
      }
      // console.log(existing?.id, existing?.sessionId);
    }
  } catch (err) {
    console.error(err);
  }
}

export async function SameOnStage(
  addingSession: Session,
): Promise<Session | null> {
  const { sessionlist, currentSession } = sessionsState.getState();

  for (const ex of currentSession
    ? [currentSession, ...sessionlist]
    : sessionlist) {
    if (ex.audience.userId === addingSession.audience.userId) {
      ex.sessionId = addingSession.sessionId;
      return ex;
    }
  }
  return null;
}

/** 
onSyncSession sends a sync request to pull any latest session changes
we call this method once at the begining including the existing sessions
then server will send update orders to client to update and sync changes
to the latest version in server.
then, when ever there was a need for update, the server pushes the changes
automaticaly.
 */
// export async function onSyncSession(existingSessions: Session[]) {
//   const record: Record<UserId, SessionId> = {};
//   Object.entries(existingSessions).forEach(([, val]) => {
//     record[val.audience.id] = val.id;
//   });
//   const struct: {
//     existingSessions: Record<UserId, SessionId>;
//   } = {
//     existingSessions: record,
//   };
//   const req: Request = {
//     status: MessageStatus.Pending,
//     channel: "sessions",
//     headers: { task: "sync" },
//     body: JSON.stringify(struct),
//   };
//   sendRequest(req);
// }
