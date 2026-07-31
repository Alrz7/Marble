import { InsertSession, UpdateSessionById } from "@db/dbSessions";
import {
  MessageEventResponse,
  Session,
  SessionId,
} from "@internal/intrCmnTypes";
import { Request } from "@active/actTypes";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { InsertAudience } from "@db/dbAudience";
import { addNewNotification } from "@states/stateNotif";
import { NotificationKeys } from "@internal/intrCmnVars";
import { HandleMsgEvent } from "@messages/actMessageHandlers";
import { ResetSearchPrcs } from "@states/appCommonStates";
import { addAppErrNotif } from "@internal/golog";

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
    for (const session of sessions) {
      session.audience.ownerId = currentUser.config.id;
      session.ownerId = currentUser.config.id;

      const audience_id = await InsertAudience(
        session.audience,
        currentUser.MasterKey,
      );
      if (!audience_id.ok) {
        addAppErrNotif(audience_id.error);
        return;
      }
      session.audience.id = audience_id.value;
      const session_id = await InsertSession(session, currentUser.MasterKey);
      if (!session_id.ok) {
        addAppErrNotif(session_id.error);
        return;
      }
      session.id = session_id.value;
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
      verified: boolean;
      sessionEventId: SessionId;
      registeredSession: Session;
      messageEventResponse: MessageEventResponse | undefined;
    } = JSON.parse(req.body);
    if (!resp.verified) {
      addNewNotification(
        "error",
        NotificationKeys.SESSION_REJECTED_BY_SERVER,
        "server refused to validate session!",
      );
      return;
    }
    const { sessions, updateSession } = sessionsState.getState();
    const existing = sessions.get(resp.sessionEventId);

    if (existing) {
      const next: Session = {
        ...existing,
        sessionId: resp.registeredSession.sessionId,
        seq: resp.registeredSession.seq,
        onCreateStage: false,
      };
      updateSession(existing.id, next);

      await UpdateSessionById(
        existing.id,
        resp.registeredSession.sessionId,
        currentUser.MasterKey,
        resp.registeredSession.seq,
      );

      if (resp.messageEventResponse) {
        await HandleMsgEvent(currentUser, next, resp.messageEventResponse);
      }
      ResetSearchPrcs();
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
