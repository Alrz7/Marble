import { sessionsState } from "@sessions/stateSession";
import { Audience, Message, Session } from "@internal/intrCmnTypes";
import { AppUser } from "../user/stateUser";
import { InsertAudience } from "@db/dbAudience";
import { InsertSession } from "@db/dbSessions";
import { InsertMessage } from "@db/dbMessages";
import { messageState } from "@messages/stateMessage";
import { addAppErrNotif, commonErrors, err, ok } from "@internal/golog";
import { searchResult } from "@states/stateCommon";
import {
  savedMessagesAudience,
  SavedMessagesSesionId,
} from "@internal/intrCmnVars";

export function reserveSessionId(): number {
  const { sessions } = sessionsState.getState();
  const existingIds = [...sessions.values()]
    .filter((s) => s.id < 0)
    .map((s) => s.id);

  existingIds.push(-1); // -1 is reserved for Saved messges

  return Math.min(...existingIds) - 1;
}

export function isSessionLegit(session: Session | undefined): boolean {
  if (session?.isSavedMessages) return true;
  if (!session || session.id < 0 || session.seq < 0 || session.sessionId < 0) {
    return false;
  }
  return true;
}

/** 
IsAlreadyInTouch checks for a new addingSession to be Unique and not
duplicate if there was a duplicate existing -> it returns that session,
otherwise if it was Unique -> it returns Null.
 */
export function IsAlreadyInTouch(audience: Audience): Session | null {
  const { sessions } = sessionsState.getState();
  const session = Array.from(sessions.values()).find(
    (s) => s.audience.userId == audience.userId,
  );
  return session ?? null;
}

export async function onCreateSessionSavedMessages(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions, UpdateCurrentSession } =
    sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;

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

  message.status = "read";
  const message_id = await InsertMessage(next, message, currentUser.MasterKey);
  if (!message_id.ok) {
    addAppErrNotif(message_id.error);
    return;
  }
  message.id = message_id.value;

  UpdateCurrentSession(next);

  const { addMessage } = messageState.getState();
  addMessage(message);

  const { resetSearchResult } = searchResult.getState();
  resetSearchResult();
}

export function onCreateSavedMessage() {
  const { currentUser } = AppUser.getState();
  if (!currentUser?.config) return err(commonErrors.userNotValid);
  const { addSession, setCurrentSessionId } = sessionsState.getState();

  const audience: Audience = {
    ...savedMessagesAudience,
    ownerId: currentUser.config.id,
  };

  const existing = IsAlreadyInTouch(audience);
  if (existing !== null) {
    setCurrentSessionId(existing.id);
    return ok(undefined);
  } else {
    const newReservedId = reserveSessionId();
    const preReservedSession: Session = {
      id: newReservedId,
      seq: newReservedId,
      ownerId: currentUser.config.id,
      sessionId: SavedMessagesSesionId,
      onCreateStage: true,
      audience: audience,
      message_sequence: 0,
      isSavedMessages: true,
    };
    addSession(preReservedSession);
    setCurrentSessionId(newReservedId);
  }
  return ok(undefined);
}
