import { disconnectWS } from "@active/actWebsocket";
import { SetActiveUserId } from "@db/dbUsers";
import { AppState, stateCommon } from "./appCommonStates";
import { sessionsState } from "@sessions/sessionStates";
import { messageState } from "@messages/stateMessage";
import { AppUser } from "./userMainStates";

export async function ResetStates() {
  const { setUserData } = AppUser.getState();
  const { setCurrentSessionId, setSessions } = sessionsState.getState();
  const { setMessages } = messageState.getState();
  const { setState } = stateCommon.getState();
  const { setAppState } = AppState.getState();
  disconnectWS();
  setUserData(null);
  setCurrentSessionId(-1);
  setSessions([]);
  setMessages([]);
  setState("authorized", false);
  setState("syncedSession", false);
  SetActiveUserId(-1);
  setAppState("login");
}
