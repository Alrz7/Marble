import { Audience, Message, Session, SessionId } from "@internal/intrCmnTypes";
import { AppState, searchResult } from "@states/stateCommon";
import {
  actAddSession,
  HandlSessionEventResponse,
  hndlAddSession,
} from "../sessions/actSessionHandlers";
import { Request } from "./actTypes";
import { stateCommon } from "@states/stateCommon";
import { MessageStatus } from "./actTypes";
import { sessionsState } from "@sessions/stateSession";
import {
  actAddMessage,
  HandleMsgEventResponse,
  HndlAddMessage,
} from "../messages/actMessageHandlers";
import { notifState } from "@states/stateNotif";
import { isSessionLegit } from "@sessions/sessionHelpers";
import { onSyncSession } from "@sessions/sessionMain";
import { onCLearSyncedMessage, onSyncMessage } from "@messages/msgMain";
import { AppUser } from "@states/stateUser";
import { addAppErrNotif } from "@internal/golog";

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
    case "event":
      HandlSessionEventResponse(req);
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
    case "event":
      HandleMsgEventResponse(req);
      break;
  }
}

export function HndlSearchResult(req: Request) {
  const { currentUser } = AppUser.getState();
  const { setUsers } = searchResult.getState();
  if (!currentUser || !req.body) return;
  const data: { results: Audience[] } = JSON.parse(req.body);
  if (data.results) {
    setUsers(
      data.results.filter((aud) => aud.userId !== currentUser.config.userId),
    );
  }
}

export function HndlNotifs(req: Request) {
  const { addNotification } = notifState.getState();
  if (!req.notif || !req.notif.shouldRender) return;
  addNotification(req.notif);
}

export async function HndlAuthStatus(request: any) {
  const { setConnTitle } = AppState.getState();
  const { states, setState } = stateCommon.getState();
  if (request.status === MessageStatus.Approved) {
    setState("authorized", true);
    const { sessions } = sessionsState.getState();
    if (!states.get("syncedSession")) {
      onSyncSession(Array.from(sessions.values()));
      setState("syncedSession", true);
      setConnTitle("Marble");
    }
  }
}

export async function HndlSyncSession(req: Request) {
  const data: { changes: Record<string, Session[]> | null; hasMore: boolean } =
    JSON.parse(req.body);
  if (data.changes) {
    if (data.changes.add) {
      await actAddSession(data.changes.add);
    }
  }
  const { sessions } = sessionsState.getState();
  if (data.hasMore) {
    onSyncSession(Array.from(sessions.values()));
  } else {
    /** 
    when we are done syncing sessions we start syncing thir messages,
    we send `0` as the first `lastMessageSeq` pointer cuz inside server's
    db, messages get Removed Perminently after being recived by the audience
    successfully, so we try from the less id to wrap all remaining messages
    with less complexity.
     */
    for (const session of sessions.values()) {
      /** 
        we need to make sure the session is valid before syncing the messages,
        where we are sending request from client.
        if session was not valid, it would get verifyed simultaneously then it's
        messages get synced.
       */
      if (isSessionLegit(session) && !session.isSavedMessages) {
        await onSyncMessage(session.sessionId, 0);
      }
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
      const lastMessageSavedSeq = await actAddMessage(
        data.sessionId,
        data.changes.add,
      );
      if (!lastMessageSavedSeq.ok) {
        addAppErrNotif(lastMessageSavedSeq.error.err);
        onCLearSyncedMessage(data.sessionId, lastMessageSavedSeq.error.lastSeq);
        return;
      }
      if (data.hasMore) {
        onSyncMessage(data.sessionId, lastMessageSavedSeq.value);
      } else {
        onCLearSyncedMessage(data.sessionId, lastMessageSavedSeq.value);
      }
    }
  }
}
