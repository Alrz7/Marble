import { messageState } from "./stateMessage";
import { decryptMessage, getKeyFromArmored } from "@enc/encOpenpgp";
import {
  Message,
  MessageEventResponse,
  Session,
  SessionId,
  User,
} from "@internal/intrCmnTypes";
import { Request } from "@active/actTypes";
import { sessionsState } from "@sessions/stateSession";
import { AppUser } from "@states/stateUser";
import { getSessionBySessionId } from "@sessions/actSessionHandlers";
import { ResendQueue, saveNewMessage } from "./msgHelpers";
import { dbUpdateMessageById, GetMessageById } from "@db/dbMessages";
import {
  addAppErrNotif,
  AppError,
  commonErrors,
  err,
  ok,
  Result,
} from "@internal/golog";

export async function HndlAddMessage(req: Request) {
  const data: { sessionId: SessionId; messages: Message[] } = JSON.parse(
    req.body,
  );
  const res = await actAddMessage(data.sessionId, data.messages);
  if (!res.ok) addAppErrNotif(res.error.err);
}

export async function actAddMessage(
  sessionId: SessionId,
  messages: Message[],
): Promise<Result<number, { lastSeq: number; err: AppError }>> {
  const { currentUser } = AppUser.getState();
  if (!currentUser)
    return err({
      lastSeq: messages.at(0)?.seq ?? 0,
      err: commonErrors.userNotFound,
    });

  const { currentSessionId, sessions } = sessionsState.getState();
  const { addMessage } = messageState.getState();

  const curSession = sessions.get(currentSessionId);

  const PrvKey = await getKeyFromArmored(currentUser.Pgp.PrivateKey, null);
  if (!PrvKey.ok)
    return err({ lastSeq: messages.at(0)?.seq ?? 0, err: PrvKey.error });

  const session = getSessionBySessionId(sessionId);
  if (!session)
    return err({
      lastSeq: messages.at(0)?.seq ?? 0,
      err: commonErrors.sessionNotFound,
    });

  for (const message of messages) {
    const decryptedContent = await decryptMessage(
      PrvKey.value,
      message.content,
    );
    if (!decryptedContent.ok)
      return err({
        lastSeq: message.seq ?? 0,
        err: decryptedContent.error,
      });

    message.content = decryptedContent.value;
    message.createdAt = new Date(message.createdAt);
    await saveNewMessage(session, currentUser.MasterKey, message);
    if (curSession && sessionId === curSession.sessionId) {
      addMessage(message);
    }
  }
  return ok(messages.at(-1)?.seq ?? 0);
}

export async function HandleMsgEventResponse(req: Request) {
  const { currentUser } = AppUser.getState();
  if (!currentUser) return;
  const resp: MessageEventResponse = JSON.parse(req.body);
  const { sessions, currentSessionId } = sessionsState.getState();
  const curSession = sessions.get(currentSessionId);

  HandleMsgEvent(currentUser, curSession, resp);
}

export async function HandleMsgEvent(
  currentUser: User,
  curSession: Session | undefined,
  resp: MessageEventResponse,
) {
  let targetMessage: Message | null = null;
  if (
    curSession &&
    (curSession.id == resp.sessionId || curSession.sessionId == resp.sessionId)
  ) {
    /** 
      we need to hotReload the message status if it's session was pointed as
      current session; first we search in session's onboeard messages, if it was there we
      update and reload its info,
      otherwise we fetch the message from Db to do the same modification
       */
    const { messages, updateMessage } = messageState.getState();

    const existing = messages.get(resp.messageEventId);
    if (existing) {
      /** 
        this method is also caled for first `Init-Messages` < first message while creating
        the session > so in that situation the message-Request was sent to server with out any
        registered-SessionId attached, so if existingMessage's sesionId was on-stage we need to
        modify that with currect id
         */

      targetMessage = {
        ...existing,
        session_id: resp.sessionId,
        status: resp.status,
      };
    }
    // fetch from Db if neccecery...
    if (!targetMessage) {
      const res = await GetMessageById(
        currentUser?.MasterKey,
        resp.messageEventId,
      );
      if (res.ok) {
        targetMessage = res.value;
      } else {
        addAppErrNotif(res.error, "error");
      }
    }
    if (targetMessage) {
      updateMessage(targetMessage.id, targetMessage);
    }
  }

  if (targetMessage) {
    await dbUpdateMessageById(
      resp.messageEventId,
      targetMessage,
      currentUser.MasterKey,
    );
    ResendQueue.delete(resp.messageEventId);
  }
}
