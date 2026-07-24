import { InsertSession, UpdateSessionById } from "@db/dbSessions";
import { Message, Session, SessionId } from "@internal/intrCmnTypes";
import {  Request } from "@active/actTypes";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { actAddMessage } from "@messages/actMessageHandlers";
import { InsertAudience } from "@db/dbAudience";

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
    if (data.sessions.length === 0) return;
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
    (session) => session.sessionId === sessionId,
  );
}
