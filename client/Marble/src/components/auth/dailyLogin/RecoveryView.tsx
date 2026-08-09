import React, { useState } from "react";
import { KeyRound, ArrowLeft, RotateCcw, AlertCircle } from "lucide-react";
import { loadConfigByMasterPhrase } from "../../../logic/user/usrLoaders";
import { commonErrors, flowExpectedErrOrNotif } from "@internal/golog";
import { AppUser } from "../../../logic/user/stateUser";
import { openConnection } from "@active/actWsRouter";

interface RecoveryViewProps {
  user_id: number;
  onBack: () => void;
}

export function RecoveryView({ user_id, onBack }: RecoveryViewProps) {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setUserData } = AppUser();

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const userData = await loadConfigByMasterPhrase(user_id, recoveryKey);
      if (!userData.ok) {
        flowExpectedErrOrNotif(userData.error, {
          [commonErrors.decryptionFailed.reason]: () => {
            setPasswordError("Recovery-key was not valid!");
          },
        });
      } else {
        setUserData(userData.value);
        openConnection();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in slide-in-from-right-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Emergency Recovery
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Enter your Master Recovery Key to bypass the daily passphrase and
          restore access to your vault.
        </p>
      </div>

      <form onSubmit={handleRecovery} className="space-y-6">
        <div>
          <div className="relative">
            <KeyRound
              className={`absolute left-4 top-3.5 w-5 h-5 ${passwordError !== null ? "text-red-500/70" : "text-emerald-500/70"}`}
            />
            <input
              type="text"
              placeholder="MRK-XXXX-XXXX-XXXX-XXXX"
              value={recoveryKey}
              onChange={(e) => {
                setPasswordError(null);
                setRecoveryKey(e.target.value);
              }}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm transition-all focus:outline-none ${
                passwordError
                  ? "bg-red-500/10 border border-red-500/50 text-red-200 placeholder:text-red-300/30 focus:border-red-500 focus:bg-red-500/15"
                  : "bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.07]"
              }`}
              autoFocus
            />
          </div>
          {passwordError && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 pl-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{passwordError}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !recoveryKey}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold text-white shadow-lg shadow-emerald-900/20"
        >
          {isLoading ? (
            <span>Verifying Key...</span>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>Recover Vault</span>
            </>
          )}
        </button>
      </form>

      <div className="flex justify-center pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Passphrase
        </button>
      </div>
    </div>
  );
}
