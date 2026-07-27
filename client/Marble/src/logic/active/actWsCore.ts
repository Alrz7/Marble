import { GetAuthToken } from "@internal/intrAuthHelpers";
import {  Request } from "./actTypes";
import { stateCommon } from "@states/appCommonStates";
import { addNewNotification } from "@states/stateNotif";
import { StateVariables } from "@internal/intrCmnVars";


export let ws: WebSocket | null = null;
export function setWs(val: WebSocket | null) {
  ws = val;
}
export let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
export function setReconnectTimeout(timeout: ReturnType<typeof setTimeout> | null) {
  reconnectTimeout = timeout;
}



export function sendRequest(req: Request): boolean {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const { states } = stateCommon.getState();
    if (
      states.get(StateVariables.AUTHORIZED) === false &&
      req.channel != "auth"
    ) {
      addNewNotification(
        "error",
        "connectionNotAuthorized",
        "Connection is not authorized, reload and try again",
      );
      return false;
    }
    ws.send(JSON.stringify(req));
    return true;
  } else {
    addNewNotification(
      "error",
      "RequestNotSent",
      "Request Not Sent, connection failed",
    );
    console.warn("WebSocket not open. Message not sent.");
    return false;
  }
}

export function sendToken() {
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
