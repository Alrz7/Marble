import { InsertMessage } from "@db/dbMessages";
import { Message, Session } from "@internal/intrCmnTypes";

export async function saveNewMessage(
  session: Session,
  masterKey: CryptoKey,
  message: Message,
) {
  const id = await InsertMessage(session, message, masterKey);
  message.id = id;
}

// ----- Resend Queue ------
export const ResendQueue : Map<number, Message> = new Map<number, Message>()


// i'll deploy it later

// async function setAsFailed() {
//   setTimeout(()=>{
//     addNewNotification("error", NotificationKeys.MESSAGE_REQUEAST_TIMEDOUT, "Request TimedOut! check your connection and try again.")

//   }, 20_000)
// }

// export const pendingTimeouts = new Map<number, ReturnType<typeof setTimeout>>()
