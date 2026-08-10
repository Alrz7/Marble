import React, { useEffect, useState } from "react";
import { User, Key, Loader2, Server, AlertCircle } from "lucide-react";
import { stateLogin } from "@states/stateAuth";
import { onUserSignIn } from "@auth/athUserSignIn";
import {
  addAppErrNotif,
  commonErrors,
  notifUnExpectedErr,
} from "@internal/golog";
import { AppUser } from "../../../logic/user/stateUser";
import { validateAndCleanServerUrl } from "@auth/authHelpers";

export function LoginMain() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    setIsLoading,
    resetLoginStore,
    serverUrl,
    setServerUrl,
  } = stateLogin();

  const { setUserData } = AppUser();
  const [serverError, setServerError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const isUrlLegit = validateAndCleanServerUrl(serverUrl);
    if (isUrlLegit.error !== undefined) {
      setServerError(isUrlLegit.error);
    }
  }, [serverUrl]);

  const handleServerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await onUserSignIn(serverUrl, username, password);
    try {
      if (!res.ok) {
        if (
          notifUnExpectedErr(
            res.error,
            commonErrors.decryptionFailed,
            commonErrors.userNotFound,
          ) != null
        ) {
          setUsernameError("username/password invalid");
          setPasswordError("username/password invalid");
        }

        return;
      }
      if (!res.value) {
        addAppErrNotif(commonErrors.userNotValid);
        return;
      }
      setUserData(res.value);
    } finally {
      resetLoginStore();
      setIsLoading(false);
    }
    // setTimeout(() => {
    //   setIsLoading(false);
    //   setStep(2);
    // }, 1000);
  };
  return (
    <form
      onSubmit={handleServerLogin}
      className="w-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Sign In
        </h2>
        <p className="text-sm text-white/50">
          Enter your credentials to access Marble.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2 pl-1">
            Server Address
          </label>
          <div className="relative">
            <Server
              className={`absolute left-4 top-3.5 w-4 h-4 transition-colors ${
                serverError ? "text-red-400" : "text-white/40"
              }`}
            />
            <input
              type="text"
              placeholder="http://localhost:6280 or https://api.example.com"
              value={serverUrl}
              onChange={(e) => {
                setServerUrl(e.target.value);
                setServerError(null);
              }}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm transition-all focus:outline-none ${
                serverError
                  ? "bg-red-500/10 border border-red-500/50 text-red-200 placeholder:text-red-300/30 focus:border-red-500 focus:bg-red-500/15"
                  : "bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.07]"
              }`}
              required
            />
          </div>
          {serverError && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 pl-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{serverError}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-white/70 mb-2 pl-1">
            Username
          </label>
          <div className="relative">
            <User
              className={`absolute left-4 top-3.5 w-4 h-4 transition-colors ${
                usernameError ? "text-red-400" : "text-white/40"
              }`}
            />
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError(null);
              }}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm transition-all focus:outline-none ${
                usernameError
                  ? "bg-red-500/10 border border-red-500/50 text-red-200 placeholder:text-red-300/30 focus:border-red-500 focus:bg-red-500/15"
                  : "bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.07]"
              }`}
              required
            />
          </div>
          {usernameError && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 pl-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{usernameError}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-white/70 mb-2 pl-1">
            Password
          </label>
          <div className="relative">
            <Key
              className={`absolute left-4 top-3.5 w-4 h-4 transition-colors ${
                passwordError ? "text-red-400" : "text-white/40"
              }`}
            />
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm transition-all focus:outline-none ${
                passwordError
                  ? "bg-red-500/10 border border-red-500/50 text-red-200 placeholder:text-red-300/30 focus:border-red-500 focus:bg-red-500/15"
                  : "bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.07]"
              }`}
              required
            />
          </div>
          {passwordError && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 pl-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{passwordError}</span>
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !username || !password || serverError !== null}
        className="w-full flex items-center justify-center py-3.5 bg-white text-black rounded-2xl text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Authenticate"
        )}
      </button>
    </form>
  );
}
