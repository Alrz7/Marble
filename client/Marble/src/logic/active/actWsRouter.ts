import { reconnectTimeout, sendToken, setReconnectTimeout, setWs, ws } from "./actWsCore";
import { Handelers, Request } from "./actTypes";
import {
  HndlMessages,
  HndlNotifs,
  HndlSearchResult,
  HndlSessions,
} from "@active/actWsServerHandlers";
import { HndlAuthStatus } from "./actWsServerHandlers";
import { stateCommon } from "@states/appCommonStates";
import { addNewNotification } from "@states/stateNotif";

let handlers: Handelers = {
  auth: HndlAuthStatus,
  sessions: HndlSessions,
  messages: HndlMessages,
  searchUser: HndlSearchResult,
  notif: HndlNotifs,
};

 export function openConnection() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  
  const newWs = new WebSocket("ws://localhost:6280/actv");
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
    addNewNotification(
      "error",
      "WebSocketCLosed",
      "Lost connection!, Reconnecting...",
    );
    console.warn("WebSocket closed. Reconnecting...");
    setWs(null);
    ReconnectWS();
  };
}

function ReconnectWS() {
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  setReconnectTimeout(
    setTimeout(() => {
      openConnection();
      setReconnectTimeout(null);
    }, 500000),
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
