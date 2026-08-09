import { settingState } from "@states/stateSettings";
import { SettingToggle } from "./SettingToggle";
import { onCreateSavedMessage } from "@sessions/sessionHelpers";
import { AppState } from "@states/stateCommon";

export const GeneralSettings = () => {
  const { runOnStartup, setRunOnStartup, serverUrl, setSettingServerUrl } =
    settingState();
  const { setIsSettingOpen } = AppState();
  return (
    <div className="space-y-6 text-sm text-gray-300 animate-fade-in">
      <div className="space-y-3">
        <h3 className="font-medium text-white mb-2">Startup</h3>
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
          <span className="text-gray-300">Run on system startup</span>
          <SettingToggle enabled={runOnStartup} onChange={setRunOnStartup} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-white mb-2">Network</h3>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <label className="block text-xs text-gray-500 mb-1.5">
            Server URL
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => {
              setSettingServerUrl(e.target.value);
            }}
            className="w-full bg-black/30 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            placeholder="https://your-server.com"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-white mb-2">Data Management</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-center text-xs">
            Export Config
          </button>
          <button className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-center text-xs">
            Import Config
          </button>
        </div>
        <button
          onClick={() => {
            setIsSettingOpen(false);
            onCreateSavedMessage();
          }}
          className="w-full p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-center text-sm font-medium"
        >
          Open Saved Messages
        </button>
      </div>
    </div>
  );
};
