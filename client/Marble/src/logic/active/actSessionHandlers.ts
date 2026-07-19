import { InsertSession, UpdateSessionById } from "@db/dbSessions";
import { encryptMessage } from "@enc/encOpenpgp";
import { Message, Session, SessionId } from "@internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { actAddMessage } from "./actMessageHandlers";
import { InsertAudience } from "@db/dbAudience";
import { InsertMessage } from "@db/dbMessages";
import { ResetSearchPrcs } from "@states/appCommonStates";
/** 
onCreateNewSession trigers by sending the first message to the session,
it saves the current-onStage-session & its audience & the first message
inside the Db, then it sends a struct of session itself including
message<encrypted by the audience's public key> to the server.
 */
export async function onCreateNewSession(message: Message) {
  const { currentUser } = AppUser.getState();
  if (!currentUser) return;
  const { currentSessionId, sessions, UpdateCurrentSession } =
    sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession) return;

  const MessageToJsonString: string = JSON.stringify(message.content);
  const encMessage = await encryptMessage(
    curSession.audience.armedPubKey,
    MessageToJsonString,
  );
  if (!encMessage) return;

  const struct: {
    audienceId: number;
    content: string;
  } = {
    audienceId: curSession.audience.userId,
    content: encMessage,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "create" },
    body: JSON.stringify(struct),
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

  await InsertMessage(next, message, currentUser.MasterKey);
  UpdateCurrentSession(next);

  sendRequest(req);
  ResetSearchPrcs();
}

/** 
hndlAddSession is trigerd by server when ever it needs to add a session
to the client to save localy; it searchs for the adding session inside
existing sessions, if there was a session with same identity(meaning
the adding request was built by the same client's onCreateNewSession
fucntion) it just alters the existing one and updates the datas, &
if adding-session was new, it inserts it instead.
 */
export async function hndlAddSession(req: Request) {
  try {
    const data: { sessions: Session[]; message: Message | undefined } =
      JSON.parse(req.body);
    console.log(data);
    if (data.sessions.length == 0) return;
    await actAddSession(data.sessions, data.message ?? null);
  } catch (err) {
    console.error(err);
  }
}

export async function actAddSession(
  sessions: Session[],
  message: Message | null,
) {
  const { currentUser } = AppUser.getState();
  const { addSession, updateSession } = sessionsState.getState();
  if (!currentUser) return;
  try {
    for (let session of sessions) {
      session.audience.ownerId = currentUser.config.id;
      session.ownerId = currentUser.config.id;

      const existing = await SameOnStage(session);
      if (existing !== null) {
        console.log(session);
        await UpdateSessionById(
          existing.id,
          session.sessionId,
          currentUser.MasterKey,
          session.seq,
        );
        const next: Session = {
          ...existing,
          seq: session.seq,
          sessionId: session.sessionId,
          onCreateStage: false,
        };
        updateSession(existing.id, next);
      } else {
        var id = await InsertAudience(session.audience, currentUser.MasterKey);
        session.audience.id = id;
        id = await InsertSession(session, currentUser.MasterKey);
        session.id = id;
        addSession(session);
        if (message) actAddMessage(session.sessionId, [message]);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

/** 
SameOnStage checks for a new addingSession to be Unique and not
duplicate if there was a duplicate existing -> it returns that session,
otherwise if it was Unique -> it returns Null.
 */
export async function SameOnStage(
  addingSession: Session,
): Promise<Session | null> {
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);

  for (const ex of curSession
    ? [curSession, ...sessions.values()]
    : [...sessions.values()]) {
    if (ex.audience.userId === addingSession.audience.userId) {
      return ex;
    }
  }
  return null;
}

export function getSessionBySessionId(sessionId: SessionId) {
  const { sessions } = sessionsState.getState();
  return Array.from(sessions.values()).find(
    (session) => session.sessionId == sessionId,
  );
}
