import { Audience, Message, Session, SessionId } from "../internal/commonTypes";
import { notifState, searchResult } from "../states/appCommonStates";
import { actAddSession, hndlAddSession } from "./actSessionHandlers";
import { Request } from "./actTypes";
import { stateCommon } from "../states/appCommonStates";
import { MessageStatus } from "./actTypes";
import {
  onCLearSyncedMessage,
  onSyncMessage,
  onSyncSession,
} from "./actWsClientHandelers";
import { sessionsState } from "../states/sessionStates";
import { actAddMessage, HndlAddMessage } from "./actMessageHandlers";

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
export function HndlMessages(req: Request) {
  if (!req.headers) {
    console.error("request has no methods");
    return;
  }
  switch (req.headers.task) {
    case "add":
      HndlAddMessage(req);
      break;
    case "sync":
      hndlSyncMessage(req);
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
      await actAddSession(data.changes.add, null);
    }

  }
  const { sessions } = sessionsState.getState();
  if (data.hasMore) {
    onSyncSession(Array.from(sessions.values()));
  } else {
    for (const session of sessions.values()) {
      await onSyncMessage(session.sessionId, 0);
    }
  }
}

export async function hndlSyncMessage(req: Request) {
  const data: {
    sessionId: SessionId;
    changes: Record<string, Message[]> | null;
    hasMore: boolean;
  } = JSON.parse(req.body);
  if (data.changes) {
    if (data.changes.add) {
      console.log(data.changes.add);
      const lastMessageSavedSeq = await actAddMessage(
        data.sessionId,
        data.changes.add,
      );
      if (data.hasMore) {
        console.log(lastMessageSavedSeq);
        onSyncMessage(data.sessionId, lastMessageSavedSeq);
      } else {
        onCLearSyncedMessage(data.sessionId, lastMessageSavedSeq);
      }
    }
  }
}
