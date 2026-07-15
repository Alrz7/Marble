import { Audience, Session } from "../internal/commonTypes";
import { notifState, searchResult } from "../states/appCommonStates";
import { actAddSession, hndlAddSession } from "./actSessionHandlers";
import { Request } from "./actTypes";
import { stateCommon } from "../states/appCommonStates";
import { MessageStatus } from "./actTypes";
import { onSyncSession } from "./actWsClientHandelers";
import { sessionsState } from "../states/sessionStates";

export function HndlSessions(req: Request) {
  if (!req.headers) {
    console.error("request has no methods");
    return;
  }
  switch (req.headers.task) {
    case "add":
      hndlAddSession(req);
      break;
    case "sync":
      HndlSyncSession(req);
      break;
  }
}

export function HndlSearchResult(req: Request) {
  const { setUsers } = searchResult.getState();

  if (!req.body) return;
  const data: { results: Audience[] } = JSON.parse(req.body);
  if (data.results) {
    setUsers(data.results);
  }
}

export function HndlNotifs(req: Request) {
  const { addNotification } = notifState.getState();
  if (!req.notif) return;
  addNotification(req.notif);
}

export async function HndlAuthStatus(request: any) {
  const { states, setState } = stateCommon.getState();
  if (request.status == MessageStatus.Approved) {
    setState("authorized", true);
    const { sessions } = sessionsState.getState();
    if (!states.get("syncedSession")) {
      // console.log(Array.from(sessions.values()));
      onSyncSession(Array.from(sessions.values()));
      setState("syncedSession", true);
    }
  }
}

export async function HndlSyncSession(req: Request) {
  const data: { changes: Record<string, Session[]> | null; hasMore: boolean } =
    JSON.parse(req.body);
  if (data.changes) {
    if (data.changes.add) {
      await actAddSession(data.changes.add);
      console.log(data.changes.add);
    }
    if (data.hasMore) {
      const { sessions } = sessionsState.getState();
      onSyncSession(Object.values(sessions));
    }
  }
}
