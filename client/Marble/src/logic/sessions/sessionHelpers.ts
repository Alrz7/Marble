import { sessionsState } from "@sessions/sessionStates";
import { Session } from "@internal/intrCmnTypes";

export function reserveSessionId(): number {
  const { sessions } = sessionsState.getState();
  const existingIds = [...sessions.values()]
    .filter((s) => s.id < 0)
    .map((s) => s.id);
  return (existingIds.length ? Math.min(...existingIds) : 0) - 1;
}

export function isSessionLegit(session: Session | undefined): boolean {
  if (!session) return false;
  if (session.id < 0 || session.seq < 0 || session.sessionId < 0) return false;
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
