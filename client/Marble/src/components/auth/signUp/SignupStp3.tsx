import { Lock, Shield, Fingerprint } from "lucide-react";
import { stateSignUp } from "@states/stateAuth";
import { onUserSignUp } from "@auth/athUserSignUp";
import { AuthMethod } from "@internal/intrCmnTypes";
import { addAppErrNotif, commonErrors } from "@internal/golog";
import { AppUser } from "@user/stateUser";

export default function SignupStp3() {
  const { setStep, setAuthMethod, resetSignUpStore } = stateSignUp();
  const { setUserData } = AppUser();

  const handleAuthMethodSelect = async (method: AuthMethod) => {
    setAuthMethod(method);
    if (method === "keychain") {
      // Direct completion if no passphrase needed
      const res = await onUserSignUp(method, "");
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
    } else {
      setStep(4);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Daily Lock Method</h2>
        <p className="text-xs text-muted-foreground mt-1">
          How would you like to unlock Marble when opening the app on this
          desktop?
        </p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleAuthMethodSelect("keychain")}
          className="w-full flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
        >
          <Fingerprint className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-foreground">
              OS Keychain Only (Fastest)
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1">
              Unlocks instantly using your system's secure credential store. No
              password entry required on startup.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleAuthMethodSelect("passphrase")}
          className="w-full flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
        >
          <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-foreground">
              Daily Passphrase
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1">
              Prompts for a custom PIN or passphrase every time you open Marble.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleAuthMethodSelect("keychain-passphrase")}
          className="w-full flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left"
        >
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-200">
              OS Keychain + Daily Passphrase
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1">
              Combines keychain-passphrase layers for maximum protection against
              physical access.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
