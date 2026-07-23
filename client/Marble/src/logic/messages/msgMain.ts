import { Message } from "@internal/intrCmnTypes";
import { onSendMessage } from "./actMessageHandlers";
import { sessionsState } from "@sessions/sessionStates";
import { dbUpdateMessageById } from "@db/dbMessages";
import { AppUser } from "@states/userMainStates";

export async function onResendMessage(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;

  await onSendMessage(message, curSession);
  dbUpdateMessageById(message.id, message, currentUser.MasterKey);
}
