import { dbSaveUserSettings } from "@db/dbSettings";
import {
  commonErrors,
  err,
  errEdtMessage,
  fromThrowableErr,
  ok,
} from "@internal/golog";
import { AuthMethod } from "@internal/intrCmnTypes";
import { AppUser } from "@user/stateUser";
import { create } from "zustand";

type Configurations = "authMethod" | "dailyPassPhrase" | null;
type configurationProps = {
  confState: Configurations;
  setConfStates: (state: Configurations) => void;
};
export const settingConfigurations = create<configurationProps>((set) => ({
  confState: null,
  setConfStates: (state: Configurations) => set({ confState: state }),
}));

type Themes = "dark" | "light" | "system";
type fontSizes = "small" | "medium" | "large";

interface settingData {
  runOnStartup: boolean;
  serverUrl: string;
  authMethod: AuthMethod;
  theme: Themes;
  fontFamily: string;
  fontSize: fontSizes;
}
interface SettingsState extends settingData {
  setRunOnStartup: (val: boolean) => void;
  setSettingServerUrl: (val: string) => void;
  setAuthMethod: (val: SettingsState["authMethod"]) => void;
  setTheme: (val: SettingsState["theme"]) => void;
  setFontFamily: (val: string) => void;
  setFontSize: (val: SettingsState["fontSize"]) => void;
  resetSettings: () => void;
}

const initialStates: settingData = {
  runOnStartup: false,
  serverUrl: "",
  authMethod: "password" as AuthMethod,
  theme: "system" as Themes,
  fontFamily: "Inter, sans-serif",
  fontSize: "medium" as fontSizes,
};

export const settingState = create<SettingsState>((set) => ({
  ...initialStates,

  setRunOnStartup: (runOnStartup) => set({ runOnStartup }),
  setSettingServerUrl: (serverUrl) => set({ serverUrl }),
  setAuthMethod: (authMethod) => set({ authMethod }),
  setTheme: (theme) => set({ theme }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontSize: (fontSize) => set({ fontSize }),
  resetSettings: () => set(lastSavedRecord),
}));

let lastSavedRecord: settingData;

export async function saveSettings() {
  const { currentUser } = AppUser.getState();
  if (!currentUser?.config) return err(commonErrors.userNotValid);
  const jsonSettings = getSettingsAsJson();
  if (!jsonSettings.ok) return err(jsonSettings.error);
  const res = await dbSaveUserSettings(
    currentUser.config.id,
    jsonSettings.value,
    currentUser.MasterKey,
  );
  if (!res.ok) return err(res.error);
  return ok(undefined);
}

export async function resetSettingsToLastRecord() {
  settingState.setState(lastSavedRecord);
}

export async function loadSettingFromSaved(savedString: string) {
  const lastSaved = fromThrowableErr(
    (): settingData => JSON.parse(savedString),
    commonErrors.conversionFailed,
  );
  if (!lastSaved.ok) return err(lastSaved.error);
  settingState.setState(lastSaved.value);

  lastSavedRecord = { ...lastSaved.value };
  return ok(undefined);
}

export function isSettingsDirty(): boolean {
  if (!lastSavedRecord) return false;

  const current = settingState.getState();
  const keys = Object.keys(initialStates) as (keyof settingData)[];

  return keys.some((key) => current[key] !== lastSavedRecord[key]);
}

export function getSettingsAsJson() {
  const current = settingState.getState();
  const keys = Object.keys(initialStates) as (keyof settingData)[];

  const snapshot = {} as settingData;
  for (const key of keys) {
    (snapshot as any)[key] = current[key];
  }

  lastSavedRecord = snapshot;
  const intoStr = fromThrowableErr(
    () => JSON.stringify(snapshot),
    commonErrors.conversionFailed,
  );
  if (!intoStr.ok || !intoStr.value)
    return err(
      errEdtMessage(
        commonErrors.connectionFailed,
        "failed to stringify user settings",
      ),
    );
  return ok(intoStr.value);
}
