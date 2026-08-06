import React, { useState } from "react";
import { KeyRound, ArrowLeft, RotateCcw } from "lucide-react";
import { loadConfigByMasterPhrase } from "@user/usrLoaders";
import { err, ok } from "@internal/golog";
import { AppUser } from "@user/stateUser";
import { openConnection } from "@active/actWsRouter";

interface RecoveryViewProps {
  user_id: number;
  onBack: () => void;
}

export function RecoveryView({ user_id, onBack }: RecoveryViewProps) {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setUserData } = AppUser();

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const userData = await loadConfigByMasterPhrase(user_id, recoveryKey);
      if (!userData.ok) {
        return err(userData.error);
      } else {
        setUserData(userData.value);
        openConnection();
        return ok(undefined);
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
            <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-emerald-500/70" />
            <input
              type="text"
              placeholder="MRK-XXXX-XXXX-XXXX-XXXX"
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-emerald-500/20 rounded-2xl text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
              autoFocus
            />
          </div>
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
