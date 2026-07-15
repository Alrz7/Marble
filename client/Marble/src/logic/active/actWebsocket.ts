import { GetAuthToken } from "../internal/IntrAuth";
import { Handelers, Request } from "./actTypes";
import {
  HndlMessages,
  HndlNotifs,
  HndlSearchResult,
  HndlSessions,
} from "../active/actWsServerHandlers";
import { HndlAuthStatus } from "./actWsServerHandlers";
import { stateCommon } from "../states/appCommonStates";

// ----* handlers *----
let ws: WebSocket | null = null;
let handlers: Handelers = {
  auth: HndlAuthStatus,
  sessions: HndlSessions,
  messages: HndlMessages,
  searchUser: HndlSearchResult,
  notif: HndlNotifs,
};
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

// ----* Active Authorization *----

//---
export function openConnection() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  )
    return;
  ws = new WebSocket("ws://localhost:6280/actv");

  ws.onopen = () => {
    const { states } = stateCommon.getState();
    if (!states.get("authorized")) sendToken();
  };

  ws.onmessage = (event) => {
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

  ws.onerror = (err) => {
    console.error(
      `there was an error while running the webSocket ${err.eventPhase}`,
    );
  };
  ws.onclose = () => {
    console.warn("WebSocket closed. Reconnecting...");
    ws = null;
    ReconnectWS();
  };
}

function ReconnectWS() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  reconnectTimeout = setTimeout(() => {
    openConnection();
    reconnectTimeout = null;
  }, 500000);
}

export function disconnectWS() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
}

export function sendRequest(req: Request) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(req));
  } else {
    console.warn("WebSocket not open. Message not sent.");
  }
}

function sendToken() {
  const token = GetAuthToken();
  if (token) {
    const req: Request = {
      status: 0,
      channel: "auth",
      token: token,
    };
    sendRequest(req);
  }
}
