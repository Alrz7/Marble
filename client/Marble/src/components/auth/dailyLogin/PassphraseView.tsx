import React, { useState } from "react";
import { Lock, Eye, EyeOff, LogOut, ArrowRight } from "lucide-react";
import { AuthMethod } from "@internal/intrCmnTypes";
import { loadConfigByMethod } from "@user/userLoadUp";
import { err, ok } from "@internal/golog";
import { AppUser } from "@states/stateUser";
import { logOut } from "@auth/login";

interface PassphraseViewProps {
  user_id: number;
  authMethod: AuthMethod;
  onForgot: () => void;
}

export function PassphraseView({
  user_id,
  onForgot,
  authMethod,
}: PassphraseViewProps) {
  const { setUserData } = AppUser();
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const userData = await loadConfigByMethod(
        user_id,
        authMethod,
        passphrase,
      );
      if (!userData.ok) {
        return err(userData.error);
      } else {
        setUserData(userData.value);
        return ok(undefined);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logOut();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your daily passphrase to unlock your vault.
        </p>
      </div>

      <form onSubmit={handleUnlock} className="space-y-6">
        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassphrase ? "text" : "password"}
              placeholder="Enter Passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all shadow-inner"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassphrase ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !passphrase}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold text-primary-foreground shadow-lg"
        >
          {isLoading ? (
            <span>Decrypting...</span>
          ) : (
            <>
              <span>Unlock Vault</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={onForgot}
          className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          Forgot your passPhrase? Use your RecoveryKey
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-destructive/80 hover:text-destructive transition-colors font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
