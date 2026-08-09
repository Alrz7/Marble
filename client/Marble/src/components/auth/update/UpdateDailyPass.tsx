import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { stateLogin } from "@states/stateAuth";
import { updateUserAuthentication } from "@auth/athHelpers";
import { addAppErrNotif } from "@internal/golog";
import { settingConfigurations } from "@states/stateSettings";

export function UpdateDailyPass() {
  const {
    authMethod,
    resetLoginStore,
    passphrase,
    setPassphrase,
    isLoading,
    setIsLoading,
  } = stateLogin();
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const { setConfStates } = settingConfigurations();

  const handleFinalUnlock = async () => {
    try {
      setIsLoading(true);

      const res = await updateUserAuthentication(authMethod, passphrase);
      resetLoginStore();
      setConfStates(null);

      if (!res.ok) {
        addAppErrNotif(res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Decrypt Vault</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your daily passphrase to securely decrypt your local data.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Passphrase
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassphrase ? "text" : "password"}
              placeholder="••••••••"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showPassphrase ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Confirm Passphrase
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassphrase ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          {confirmPassphrase && passphrase !== confirmPassphrase && (
            <p className="text-[11px] text-destructive mt-1">
              Passphrases do not match
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={isLoading || !passphrase || passphrase !== confirmPassphrase}
        onClick={() => handleFinalUnlock()}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-semibold text-primary-foreground shadow-lg"
      >
        {isLoading ? (
          <span>Unlocking Vault...</span>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Unlock Vault</span>
          </>
        )}
      </button>
    </div>
  );
}
