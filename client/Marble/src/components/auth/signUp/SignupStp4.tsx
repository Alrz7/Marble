import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { stateSignUp } from "@states/stateAuth";
import { onUserSignUp } from "@auth/athUserSignUp";
import { addAppErrNotif, commonErrors } from "@internal/golog";
import { AppUser } from "@user/stateUser";

export default function SignupStp4() {
  const {
    showPassphrase,
    passphrase,
    setPassphrase,
    setShowPassphrase,
    confirmPassphrase,
    isLoading,
    setConfirmPassphrase,
    resetSignUpStore,
  } = stateSignUp();
  const { setUserData } = AppUser();

  const handleAuthMethodSelect = async () => {
    const res = await onUserSignUp();
    if (!res.ok) {
      addAppErrNotif(res.error);
      return;
    }
    if (!res.value) {
      addAppErrNotif(commonErrors.userNotValid);
      return;
    }
    setUserData(res.value);
    resetSignUpStore();
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Set Daily Passphrase
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Choose the passphrase you will enter when opening Marble.
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
        onClick={() => handleAuthMethodSelect()}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-semibold text-primary-foreground shadow-lg"
      >
        {isLoading ? (
          <span>Initializing Vault...</span>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Setup</span>
          </>
        )}
      </button>
    </div>
  );
}
