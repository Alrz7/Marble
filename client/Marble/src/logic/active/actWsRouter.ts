import {
  reconnectTimeout,
  sendToken,
  setReconnectTimeout,
  setWs,
  ws,
} from "./actWsCore";
import { Handelers, Request } from "./actTypes";
import {
  HndlMessages,
  HndlNotifs,
  HndlSearchResult,
  HndlSessions,
} from "@active/actWsServerHandlers";
import { HndlAuthStatus } from "./actWsServerHandlers";
import { AppState, stateCommon } from "@states/stateCommon";
import { buildWsUrl } from "@internal/intrHelperfuncs";

const handlers: Handelers = {
  auth: HndlAuthStatus,
  sessions: HndlSessions,
  messages: HndlMessages,
  searchUser: HndlSearchResult,
  notif: HndlNotifs,
};

export function openConnection() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }
  const { serverUrl } = AppState.getState();
  if (!serverUrl) return;
  const wsUrl = buildWsUrl(serverUrl, "actv");

  const newWs = new WebSocket(wsUrl);
  setWs(newWs);

  newWs.onopen = () => {
    const { states } = stateCommon.getState();
    if (!states.get("authorized")) sendToken();
  };

  newWs.onmessage = (event) => {
    let request: Request;
    try {
      request = JSON.parse(event.data);
    } catch (err) {
      console.error("JSON parse error:", err);
      return;
    }

    try {
      let handeler = handlers[request.channel];
      if (handeler) {
        handeler(request);

        if (request.notif && request.channel !== "notif") {
          handeler = handlers["notif"];
          if (handeler) handeler(request);
        }
      } else {
        console.warn(`No handler for channel: ${request.channel}`);
      }
    } catch (err) {
      console.error("Handler error:", err);
    }
  };

  newWs.onerror = (err) => {
    console.error(
      `there was an error while running the webSocket ${err.eventPhase}`,
    );
  };
  newWs.onclose = () => {
    // addNewNotification(
    //   "error",
    //   "WebSocketCLosed",
    //   "Lost connection!, Reconnecting...",
    // );
    setWs(null);

    const { setState } = stateCommon.getState();
    setState("authorized", false);
    ReconnectWS();
  };
}

function ReconnectWS() {
  const { setConnTitle } = AppState.getState();
  setConnTitle("connecting...");
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  setReconnectTimeout(
    setTimeout(() => {
      openConnection();
      if (ws?.OPEN) {
        // ReconnectWS();
      }
    }, 3000),
  );
}

export function disconnectWS() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    setReconnectTimeout(null);
  }
  if (ws) {
    ws.onclose = null;
    ws.close();
    setWs(null);
  }
}
