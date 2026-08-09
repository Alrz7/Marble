import { addAppErrNotif, commonErrors } from "@internal/golog";
import { stateLogin } from "@states/stateAuth";
import { AppState } from "@states/stateCommon";
import { settingConfigurations } from "@states/stateSettings";
import { AppUser } from "@user/stateUser";

export const PrivacySettings = () => {
  const { currentUser } = AppUser();
  if (!currentUser?.config) {
    addAppErrNotif(commonErrors.userNotValid);
    return;
  }
  const { setIsSettingOpen } = AppState();
  const { setConfStates } = settingConfigurations();
  const { setAuthMethod } = stateLogin();
  return (
    <div className="space-y-6 text-sm text-gray-300 animate-fade-in">
      <div className="space-y-3">
        <h3 className="font-medium text-white mb-2">Security</h3>
        <div className="space-y-2">
          {/* Redirect Buttons as requested */}
          <button
            onClick={() => {
              setIsSettingOpen(false);
              setAuthMethod(currentUser.authMethod);
              setConfStates("authMethod");
            }}
            className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
          >
            <span>Change Authentication Method</span>
            <span className="text-xs text-gray-500">→</span>
          </button>
          <button
            disabled={currentUser.authMethod === "keychain"}
            onClick={() => {
              setIsSettingOpen(false);
              setAuthMethod(currentUser.authMethod);
              setConfStates("dailyPassPhrase");
            }}
            className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex justify-between items-center"
          >
            <span>Change Daily Password</span>
            <span className="text-xs text-gray-500">→</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-white mb-2">Cryptography</h3>
        <div className="grid grid-cols-1 gap-2">
          <button className="text-left p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-xs">
            Sign All Messages
          </button>
          <button className="text-left p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-xs">
            Regenerate Master Salt
          </button>
          <button className="text-left p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-xs">
            Reset Access & Refresh Tokens
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <button className="w-full p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-sm">
          Clear Keychain Data
        </button>
      </div>
    </div>
  );
};
