import { messageState } from "./stateMessage";
import { decryptMessage, getKeyFromArmored } from "@enc/encOpenpgp";
import { Message, MessageStatus, SessionId } from "@internal/intrCmnTypes";
import { Request } from "@active/actTypes";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { getSessionBySessionId } from "@sessions/actSessionHandlers";
import { getMessageFromListById, saveNewMessage } from "./msgHelpers";
import { dbUpdateMessageById, GetMessageById } from "@db/dbMessages";

export async function HndlAddMessage(req: Request) {
  try {
    const data: { sessionId: SessionId; messages: Message[] } = JSON.parse(
      req.body,
    );
    if (data.messages.length === 0) return;
    if (!data.sessionId) throw new Error("sessionId was Not Valid");
    await actAddMessage(data.sessionId, data.messages);
  } catch (err) {
    console.error(err);
  }
}

export async function actAddMessage(
  sessionId: SessionId,
  messages: Message[],
): Promise<number> {
  const { currentUser } = AppUser.getState();
  if (!currentUser) return messages.at(0)?.seq ?? 0;
  const { currentSessionId, sessions } = sessionsState.getState();
  const { addMessage } = messageState.getState();

  const curSession = sessions.get(currentSessionId);

  const PrvKey = await getKeyFromArmored(currentUser.Pgp.PrivateKey, null);
  if (!PrvKey) {
    throw new Error("there was an error while recovering Prv-Key");
  }

  let session = getSessionBySessionId(sessionId);
  if (!session) {
    console.warn("session does Not Exist");
    return messages.at(0)?.seq ?? 0;
  }

  for (const message of messages) {
    let decryptedContent: string;

    try {
      decryptedContent = await decryptMessage(PrvKey, message.content);
    } catch (err) {
      console.error(err);
      decryptedContent = "*** Error While Decrypting Message ***";
    }

    message.content = decryptedContent;
    message.createdAt = new Date(message.createdAt);
    saveNewMessage(session, currentUser.MasterKey, message);
    if (curSession && sessionId === curSession.sessionId) {
      addMessage(message);
    }
  }
  return messages.at(-1)?.seq ?? 0;
}

export async function HandleMsgEventResponse(req: Request) {
  let targetMessage: Message | null = null;
  try {
    const resp: {
      sessionId: SessionId;
      messageEventId: number;
      status: MessageStatus;
    } = JSON.parse(req.body);

    const { currentUser } = AppUser.getState();
    if (!currentUser) return;
    const { sessions, currentSessionId } = sessionsState.getState();
    const curSession = sessions.get(currentSessionId);

    if (
      curSession &&
      (curSession.id == resp.sessionId ||
        curSession.sessionId == resp.sessionId)
    ) {
      /** 
      we need to hotReload the message status if it's session was pointed as
      current session; first we search in session's onboeard messages, if it was there we
      update and reload its info,
      otherwise we fetch the message from Db to do the same modification
       */
      const { Messagelist } = messageState.getState();

      let target = getMessageFromListById(Messagelist, resp.messageEventId);
      if (target.message) {
        /** 
        this method is also caled for first `Init-Messages` < first message while creating
        the session > so in that situation the message-Request was sent to server with out any
        registered-SessionId attached, so if existingMessage's sesionId was on-stage we need to
        modify that with currect id
         */
        if (target.message.senderId <= 0) {
          target.message.sessionId = resp.sessionId;
        }
        targetMessage = { ...target.message };
      }

      // fetch from Db if neccecery...
      if (!targetMessage) {
        targetMessage = await GetMessageById(
          currentUser?.MasterKey,
          resp.messageEventId,
        );
      }

      if (targetMessage) {
        const { updateMessage } = messageState.getState();
        targetMessage.status = resp.status;
        updateMessage(target.indx, targetMessage);
      }
    }

    if (targetMessage)
      dbUpdateMessageById(
        resp.messageEventId,
        targetMessage,
        currentUser.MasterKey,
      );
  } catch (err) {
    console.error(err);
  }
}
