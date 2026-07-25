import { InsertSession, UpdateSessionById } from "@db/dbSessions";
import { Session, SessionId } from "@internal/intrCmnTypes";
import { Request } from "@active/actTypes";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { InsertAudience } from "@db/dbAudience";
import { addNewNotification } from "@states/stateNotif";
import { SESSION_REJECTED_BY_SERVER } from "@internal/intrCmnVars";

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
    const data: { session: Session } = JSON.parse(req.body);
    await actAddSession([data.session]);
  } catch (err) {
    console.error(err);
  }
}

export async function actAddSession(sessions: Session[]) {
  const { currentUser } = AppUser.getState();
  const { addSession } = sessionsState.getState();
  if (!currentUser) return;

  try {
    for (let session of sessions) {
      session.audience.ownerId = currentUser.config.id;
      session.ownerId = currentUser.config.id;

      var id = await InsertAudience(session.audience, currentUser.MasterKey);
      session.audience.id = id;
      id = await InsertSession(session, currentUser.MasterKey);
      session.id = id;
      addSession(session);
    }
  } catch (err) {
    console.error(err);
  }
}

export async function HandlSessionEventResponse(req: Request) {
  const { currentUser } = AppUser.getState();
  if (!currentUser) return;

  try {
    const resp: {
      sessionEventId: SessionId;
      registeredSession: Session;
      verified: boolean;
    } = JSON.parse(req.body);
    if (!resp.verified) {
      addNewNotification(
        "error",
        SESSION_REJECTED_BY_SERVER,
        "server refused to validate session!",
      );
      return;
    }
    const { sessions, updateSession } = sessionsState.getState();
    const existing = sessions.get(resp.sessionEventId);

    if (existing) {
      await UpdateSessionById(
        existing.id,
        resp.registeredSession.sessionId,
        currentUser.MasterKey,
        resp.registeredSession.seq,
      );
      const next: Session = {
        ...existing,
        sessionId: resp.registeredSession.sessionId,
        seq: resp.registeredSession.seq,
        onCreateStage: false,
      };
      updateSession(existing.id, next);
    }
  } catch (err) {
    console.error(err);
  }
}

export function getSessionBySessionId(sessionId: SessionId) {
  const { sessions } = sessionsState.getState();
  return Array.from(sessions.values()).find(
    (session) => session.sessionId === sessionId,
  );
}
