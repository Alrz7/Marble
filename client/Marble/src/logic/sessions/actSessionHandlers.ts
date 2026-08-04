import { fromThrowableErr } from "./../internal/golog";
import { InsertSession, UpdateSessionById } from "@db/dbSessions";
import {
  Message,
  MessageEventResponse,
  Session,
  SessionId,
} from "@internal/intrCmnTypes";
import { Request } from "@active/actTypes";
import { sessionsState } from "@sessions/stateSession";
import { AppUser } from "@states/stateUser";
import { InsertAudience } from "@db/dbAudience";
import { addNewNotification } from "@states/stateNotif";
import { NotificationKeys } from "@internal/intrCmnVars";
import { actAddMessage, HandleMsgEvent } from "@messages/actMessageHandlers";
import { addAppErrNotif, commonErrors, err, ok, Result } from "@internal/golog";
import { searchResult } from "@states/stateCommon";

/** 
hndlAddSession is trigerd by server when ever it needs to add a session
to the client to save localy; it searchs for the adding session inside
existing sessions, if there was a session with same identity(meaning
the adding request was built by the same client's onCreateNewSession
fucntion) it just alters the existing one and updates the datas, &
if adding-session was new, it inserts it instead.
 */
export async function hndlAddSession(req: Request) {
  const data: { session: Session; message: Message } = JSON.parse(req.body);
  const res = await actAddSession([data.session]);
  if (res.ok) {
    const addMessage = await actAddMessage(data.session.sessionId, [
      data.message,
    ]);
    if (!addMessage.ok) addAppErrNotif(addMessage.error.err);
  } else {
    addAppErrNotif(res.error);
  }
}

export async function actAddSession(
  sessions: Session[],
): Promise<Result<void>> {
  const { currentUser } = AppUser.getState();
  const { addSession } = sessionsState.getState();
  if (!currentUser) return err(commonErrors.userNotValid);

  for (const session of sessions) {
    session.audience.ownerId = currentUser.config.id;
    session.ownerId = currentUser.config.id;

    const audience_id = await InsertAudience(
      session.audience,
      currentUser.MasterKey,
    );
    if (!audience_id.ok) {
      return err(audience_id.error);
    }
    session.audience.id = audience_id.value;
    const session_id = await InsertSession(session, currentUser.MasterKey);
    if (!session_id.ok) {
      return err(session_id.error);
    }
    session.id = session_id.value;
    addSession(session);
  }
  return ok(undefined);
}

export async function HandlSessionEventResponse(req: Request) {
  const { currentUser } = AppUser.getState();
  if (!currentUser) {
    addAppErrNotif(commonErrors.userNotFound);
    return;
  }

  const res = fromThrowableErr(
    (): {
      verified: boolean;
      sessionEventId: SessionId;
      registeredSession: Session;
      messageEventResponse: MessageEventResponse | undefined;
    } => JSON.parse(req.body),
    commonErrors.failedToParseJsonString,
  );

  if (!res.ok) return addAppErrNotif(res.error);
  if (!res.value.verified) {
    addNewNotification(
      "error",
      NotificationKeys.SESSION_REJECTED_BY_SERVER,
      "server refused to validate session!",
    );
    return;
  }
  const { sessions, updateSession } = sessionsState.getState();
  const existing = sessions.get(res.value.sessionEventId);

  if (existing) {
    const next: Session = {
      ...existing,
      sessionId: res.value.registeredSession.sessionId,
      seq: res.value.registeredSession.seq,
      onCreateStage: false,
    };
    updateSession(existing.id, next);

    await UpdateSessionById(
      existing.id,
      res.value.registeredSession.sessionId,
      currentUser.MasterKey,
      res.value.registeredSession.seq,
    );

    if (res.value.messageEventResponse) {
      await HandleMsgEvent(currentUser, next, res.value.messageEventResponse);
    }
    const { resetSearchResult } = searchResult.getState();
    resetSearchResult();
  }
}

export function getSessionBySessionId(sessionId: SessionId) {
  const { sessions } = sessionsState.getState();
  return Array.from(sessions.values()).find(
    (session) => session.sessionId === sessionId,
  );
}
