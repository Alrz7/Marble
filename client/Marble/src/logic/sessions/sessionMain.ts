import { InsertSession } from "@db/dbSessions";
import { encryptMessage } from "@enc/encOpenpgp";
import { Message, Session, SessionId } from "@internal/intrCmnTypes";
import { MessageStatus, Request } from "@active/actTypes";
import { sendRequest } from "@active/actWebsocket";
import { sessionsState } from "@sessions/sessionStates";
import { AppUser } from "@states/userMainStates";
import { InsertAudience } from "@db/dbAudience";
import { InsertMessage } from "@db/dbMessages";
import { messageState } from "@messages/stateMessage";

/** 
onCreateNewSession trigers by sending the first message to the session,
it saves the current-onStage-session & its audience & the first message
inside the Db, then it sends a struct of session itself including
message<encrypted by the audience's public key> to the server.
 */
export async function onCreateNewSession(message: Message) {
  const { currentUser } = AppUser.getState();
  const { currentSessionId, sessions, UpdateCurrentSession } =
    sessionsState.getState();
  const curSession = sessions.get(currentSessionId);
  if (!curSession || !currentUser) return;

  const MessageToJsonString: string = JSON.stringify(message.content);
  const encMessage = await encryptMessage(
    curSession.audience.armedPubKey,
    MessageToJsonString,
  );
  if (!encMessage) return;

  const struct: {
    audienceId: number;
    message: string;
    MessageEventId: number;
    sessionEventId: SessionId;
  } = {
    audienceId: curSession.audience.userId,
    message: encMessage,
    MessageEventId: -1,
    sessionEventId: -1,
  };

  // preSaving in database
  const next: Session = { ...curSession, audience: { ...curSession.audience } };

  var audieceId = await InsertAudience(
    curSession.audience,
    currentUser.MasterKey,
  );
  next.audience.id = audieceId;

  const sessionId = await InsertSession(next, currentUser.MasterKey);
  next.id = sessionId;
  struct.sessionEventId = sessionId;

  const MessageId = await InsertMessage(next, message, currentUser.MasterKey);
  message.id = MessageId;
  struct.MessageEventId = MessageId;

  UpdateCurrentSession(next);

  const req: Request = {
    status: MessageStatus.Pending,
    channel: "sessions",
    headers: { task: "create" },
    body: JSON.stringify(struct),
  };
  sendRequest(req);

  const { addMessage } = messageState.getState();
  addMessage(message);

  //   ResetSearchPrcs();
}
