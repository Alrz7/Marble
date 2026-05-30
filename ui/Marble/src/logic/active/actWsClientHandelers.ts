import { encryptMessage } from "../enc/encHelpers";
import { Audience, Session } from "../internal/commonTypes";
import { MessageStatus, Request } from "./actTypes";
import { sendRequest } from "./actWebsocket";

// ---- sessions ----
export async function onSendMessage(session: Session, content: string) {
  const message = await encryptMessage(session.beta.armedPubKey, content);
  if (!message) return;

  const struct: {
    sessionId: number;
    message: String;
  } = {
    sessionId: session.sessionId,
    message: message,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessionMessage",
    headers: {},
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

export async function onSetCreateSession(audience: Audience, content: string) {
  const message = await encryptMessage(audience.armedPubKey, content);
  if (!message) return;

  const struct: {
    userId: number;
    content: string;
  } = {
    userId: audience.userId,
    content: message,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessionCreate",
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

// --- search ---
export function onSearchUser(param: string) {
  const struct: {
    param: string;
  } = {
    param: param,
  };
  const req: Request = {
    status: MessageStatus.Pending,
    channel: "searchUser",
    headers: {},
    body: JSON.stringify(struct),
  };
  sendRequest(req);
}

