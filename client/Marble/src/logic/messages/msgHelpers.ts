import { InsertMessage } from "@db/dbMessages";
import { Message, Session } from "@internal/intrCmnTypes";
import { sessionsState } from "@sessions/stateSession";
import { AppUser } from "../user/stateUser";
import { messageState } from "./stateMessage";
import { err, ok } from "@internal/golog";
import { addNewNotification } from "@states/stateNotif";

export async function saveNewMessage(
  session: Session,
  masterKey: CryptoKey,
  message: Message,
) {
  const res = await InsertMessage(session, message, masterKey);
  if (res.ok) {
    message.id = res.value;
    return ok(res.value);
  }
  return err(res.error);
}

// ----- Resend Queue ------
export const ResendQueue: Map<number, Message> = new Map<number, Message>();

// i'll deploy it later

// async function setAsFailed() {
//   setTimeout(()=>{
//     addNewNotification("error", NotificationKeys.MESSAGE_REQUEAST_TIMEDOUT, "Request TimedOut! check your connection and try again.")

//   }, 20_000)
// }

// export const pendingTimeouts = new Map<number, ReturnType<typeof setTimeout>>()

// ----- saved messages -----
export async function onSendNewSavedMessage(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;
  if (!curSession.isSavedMessages) {
    addNewNotification(
      "error",
      "notSavedMessage",
      "expecting sesion is not a saved-Message Session",
    );
    return;
  }

  message.status = "read";
  await saveNewMessage(curSession, currentUser.MasterKey, message);

  const { addMessage } = messageState.getState();
  addMessage(message);
}
