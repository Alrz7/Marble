import { Session } from "@internal/intrCmnTypes";
import { sessionsState } from "./sessionStates";

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
