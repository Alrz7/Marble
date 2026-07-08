import {
  GetMessages,
  InsertAudience,
  InsertMessage,
  InsertSession,
  UpdateSession,
} from "../db/dbSessions";
import { encryptMessage } from "../enc/encOpenpgp";
import { Message, Session, SessionId, UserId } from "../internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";
import { sessionsState } from "../states/sessionStates";
import { AppUser } from "../states/userMainStates";

// ---- sessions ----

export async function onCreateNewSession(message: Message) {
  const { currentSession, setCurrentSession } = sessionsState.getState();
  const { currentUser } = AppUser.getState();
  if (!currentUser || !currentSession) return;
  if (!currentSession) return;

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
  setCurrentSession(currentSession);
  await InsertMessage(currentSession, message, currentUser.MasterKey);
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

export async function hndlAddSession(req: Request) {
  const { currentUser } = AppUser.getState();
  const { addSession } = sessionsState.getState();
  if (!currentUser) return;

  try {
    const data: { sessions: Session[] } = JSON.parse(req.body);
    for (let session of data.sessions) {
      session.audience.ownerId = currentUser.config.id;
      session.ownerId = currentUser.config.id;

      const existing = await SameOnStage(session);
      console.log(existing);
      if (existing) {
        UpdateSession(currentUser.config.id, session.audience.id, session.id);
      } else {
        var id = await InsertAudience(session.audience, currentUser.MasterKey);
        session.audience.id = id;
        id = await InsertSession(session, currentUser.MasterKey);
        session.id = id;
        addSession(session);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

export async function SameOnStage(addingSession: Session): Promise<boolean> {
  const { sessionlist, currentSession } = sessionsState.getState();

  for (const ex of currentSession
    ? [currentSession, ...sessionlist]
    : sessionlist) {
    if (ex.audience.userId === addingSession.audience.userId) {
      return true;
    }
  }

  return false;
}

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
