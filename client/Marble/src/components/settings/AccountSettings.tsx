import { onLogOut } from "@auth/athUserSignIn";

export const AccountSettings = () => {
  return (
    <div className="space-y-6 text-sm text-gray-300 animate-fade-in">
      <div className="space-y-3">
        <h3 className="font-medium text-white mb-2">Profile</h3>

        <div className="space-y-3 p-3 rounded-lg bg-white/5 border border-white/5">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none"
                defaultValue="Alireza"
              />
              <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-xs">
                Save
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Account ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-black/30 border border-white/10 rounded-md px-3 py-1.5 text-sm focus:outline-none"
                defaultValue="alrz_7"
              />
              <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-xs">
                Change
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
          Fetch User Master Salt from Server
        </button>
        <button
          onClick={onLogOut}
          className="w-full bg-red-800/10 text-left text-rose-400 p-3 rounded-lg border border-night-bordeaux-700/30 hover:bg-red-800/15 transition-colors"
        >
          Log out
        </button>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
        <h4 className="text-red-400 font-medium mb-1">Danger Zone</h4>
        <p className="text-xs text-gray-500 mb-3">
          Deleting your account will permanently wipe all encrypted data and
          keys.
        </p>
        <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md transition-colors text-xs font-medium">
          Delete Account
        </button>
      </div>
    </div>
  );
};
