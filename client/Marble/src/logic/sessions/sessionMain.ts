import {
  DeleteSessionFrmDb,
  GetLastSessionSeq,
  InsertSession,
} from "@db/dbSessions";
import { encryptMessage } from "@enc/encOpenpgp";
import { Message, Session, SessionId } from "@internal/intrCmnTypes";
import { MessageStatus, Request } from "@active/actTypes";
import { sendRequest } from "@active/actWsCore";
import { sessionsState } from "@sessions/stateSession";
import { AppUser } from "../user/stateUser";
import { DeleteAudienceFromDb, InsertAudience } from "@db/dbAudience";
import { dbUpdateMessageById, InsertMessage } from "@db/dbMessages";
import { messageState } from "@messages/stateMessage";
import { isSessionLegit } from "./sessionHelpers";
import { addAppErrNotif, commonErrors, newAppErr } from "@internal/golog";

/** 
onCreateNewSession trigers by sending the first message to the session,
it saves the current-onStage-session & its audience & the first message
inside the Db, then it sends a struct of session itself including
message<encrypted by the audience's public key> to the server.
 */
export async function onCreateNewSession(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions, UpdateCurrentSession } =
    sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;

  const encMessage = await encryptMessage(
    curSession.audience.armedPubKey,
    message.content,
  );
  if (!encMessage.ok) {
    addAppErrNotif(encMessage.error);
    message.status = "notSend";
    return;
  }
  if (!encMessage.value) {
    addAppErrNotif(
      newAppErr("encMessageNotValid", "encrypted message is not Valid"),
    );
    return;
  }

  const struct: {
    audienceId: number;
    message: string;
    MessageEventId: number;
    sessionEventId: SessionId;
  } = {
    audienceId: curSession.audience.userId,
    message: encMessage.value,
    sessionEventId: -1, // going to be modified below
    MessageEventId: -1, // going to be modified below
  };

  // preSaving in database
  const next: Session = { ...curSession, audience: { ...curSession.audience } };

  const audience_id = await InsertAudience(
    curSession.audience,
    currentUser.MasterKey,
  );
  if (!audience_id.ok) {
    addAppErrNotif(audience_id.error);
    return;
  }
  next.audience.id = audience_id.value;

  const session_id = await InsertSession(next, currentUser.MasterKey);
  if (!session_id.ok) {
    addAppErrNotif(session_id.error);
    return;
  }
  next.id = session_id.value;
  struct.sessionEventId = session_id.value;

  UpdateCurrentSession(next);

  const message_id = await InsertMessage(next, message, currentUser.MasterKey);
  if (!message_id.ok) {
    addAppErrNotif(message_id.error);
    return;
  }
  message.id = message_id.value;
  struct.MessageEventId = message_id.value;

  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "create" },
    body: JSON.stringify(struct),
  };

  const sent = sendRequest(req);
  if (!sent) {
    message.status = "notSend";
    dbUpdateMessageById(message.id, message, currentUser.MasterKey);
  }
  const { addMessage } = messageState.getState();
  addMessage(message);
}

/** 
onSyncSession sends a sync request to pull any latest session changes
we call this method once at the begining including the existing sessions
then server will send update orders to client to update and sync changes
to the latest version in server.
then, when ever there was a need for update, the server pushes the changes
automaticaly.
 */
export async function onSyncSession() {
  const { currentUser } = AppUser.getState();
  if (!currentUser || !currentUser.config) {
    addAppErrNotif(commonErrors.userNotValid);
    return;
  }

  const sessionLastSeq = await GetLastSessionSeq(currentUser.config.id);
  if (!sessionLastSeq.ok) {
    addAppErrNotif(sessionLastSeq.error);
    return;
  }
  const struct: {
    lastSessionEvent: number;
  } = {
    lastSessionEvent: sessionLastSeq.value,
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
  const { setMessages } = messageState.getState();
  if (isSessionLegit(session) && !session.isSavedMessages) {
    const req: Request = {
      status: MessageStatus.Request,
      channel: "sessions",
      headers: { task: "delete" },
      body: JSON.stringify({ sessionId: session.sessionId }),
    };
    sendRequest(req);
    // const sentRequest = sendRequest(req);
    // if (!sentRequest) return;             // No Connection No session Deleting
  }
  await Promise.all([
    DeleteSessionFrmDb(session.id),
    DeleteAudienceFromDb(session.audience),
  ]);
  deleteSession(session.id);
  setMessages([]);
}
