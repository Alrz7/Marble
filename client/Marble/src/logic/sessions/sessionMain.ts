import { DeleteSessionFrmDb, InsertSession } from "@db/dbSessions";
import { encryptMessage } from "@enc/encOpenpgp";
import { Message, Session, SessionId } from "@internal/intrCmnTypes";
import { MessageStatus, Request } from "@active/actTypes";
import { sendRequest } from "@active/actWsCore";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { DeleteAudienceFromDb, InsertAudience } from "@db/dbAudience";
import { dbUpdateMessageById, InsertMessage } from "@db/dbMessages";
import { messageState } from "@messages/stateMessage";
import { isSessionLegit } from "./sessionHelpers";

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

  const MessageToJsonString: string = JSON.stringify(message.content);
  const encMessage = await encryptMessage(
    curSession.audience.armedPubKey,
    MessageToJsonString,
  );
  if (!encMessage) return;

  const struct: {
    audienceId: number;
    message: string;
    MessageEventId: number;
    sessionEventId: SessionId;
  } = {
    audienceId: curSession.audience.userId,
    message: encMessage,
    sessionEventId: -1, // going to be modified below
    MessageEventId: -1, // going to be modified below
  };

  // preSaving in database
  const next: Session = { ...curSession, audience: { ...curSession.audience } };

  var audieceId = await InsertAudience(
    curSession.audience,
    currentUser.MasterKey,
  );
  next.audience.id = audieceId;

  const sessionId = await InsertSession(next, currentUser.MasterKey);
  next.id = sessionId;
  struct.sessionEventId = sessionId;

  const MessageId = await InsertMessage(next, message, currentUser.MasterKey);
  message.id = MessageId;
  struct.MessageEventId = MessageId;

  UpdateCurrentSession(next);

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
export async function onSyncSession(sessions: Session[]) {
  const lastSessionSeq =
    sessions.length > 0
      ? Math.max(
          ...sessions.map((s) => {
            /** 
            we only need to send valid sessions for syncing process
             */
            if (isSessionLegit(s)) {
              return s.seq;
            } else {
              return 0;
            }
          }),
        )
      : 0;
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
