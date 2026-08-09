import { disconnectWS } from "@active/actWsRouter";
import { AppState, stateCommon } from "./stateCommon";
import { sessionsState } from "@sessions/stateSession";
import { messageState } from "@messages/stateMessage";
import { AppUser } from "../user/stateUser";
import { settingState } from "./stateSettings";

export async function ResetStates() {
  const { resetUserData } = AppUser.getState();
  const { resetSessionStates } = sessionsState.getState();
  const { resetMessageStates } = messageState.getState();
  const { resetCommonStates } = stateCommon.getState();
  const { resetSettings } = settingState.getState();
  const { resetAppStates } = AppState.getState();
  disconnectWS();
  resetUserData();
  resetSessionStates();
  resetMessageStates();
  resetCommonStates();
  resetAppStates();
  resetSettings();
}
