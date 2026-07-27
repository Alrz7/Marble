import { sessionsState } from "@sessions/sessionStates";
import { Message, Session } from "@internal/intrCmnTypes";
import { AppUser } from "@states/userMainStates";
import { InsertAudience } from "@db/dbAudience";
import { InsertSession } from "@db/dbSessions";
import { InsertMessage } from "@db/dbMessages";
import { messageState } from "@messages/stateMessage";
import { ResetSearchPrcs } from "@states/appCommonStates";

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

export async function onCreateSessionSavedMessages(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions, UpdateCurrentSession } =
    sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;

  const next: Session = { ...curSession, audience: { ...curSession.audience } };

  var audieceId = await InsertAudience(
    curSession.audience,
    currentUser.MasterKey,
  );
  next.audience.id = audieceId;

  const sessionId = await InsertSession(next, currentUser.MasterKey);
  next.id = sessionId;

  message.status = "read";
  const MessageId = await InsertMessage(next, message, currentUser.MasterKey);
  message.id = MessageId;

  UpdateCurrentSession(next);

  const { addMessage } = messageState.getState();
  addMessage(message);
  
  ResetSearchPrcs();
}
