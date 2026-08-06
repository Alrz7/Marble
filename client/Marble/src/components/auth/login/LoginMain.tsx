import React from "react";
import { User, Key, Loader2 } from "lucide-react";
import { stateLogin } from "@states/stateAuth";
import { onUserSignIn } from "@auth/athUserSignIn";
import { addAppErrNotif, commonErrors } from "@internal/golog";
import { AppUser } from "@user/stateUser";

export function LoginMain() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    isLoading,
    setIsLoading,
    resetLoginStore,
  } = stateLogin();

  const { setUserData } = AppUser();

  const handleServerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await onUserSignIn(username, password);
    try {
      if (!res.ok) {
        addAppErrNotif(res.error);
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
      className="w-full flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Sign In
        </h2>
        <p className="text-sm text-white/50">
          Enter your credentials to access Marble.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2 pl-1">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all focus:bg-white/[0.07]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-white/70 mb-2 pl-1">
            Password
          </label>
          <div className="relative">
            <Key className="absolute left-4 top-3.5 w-4 h-4 text-white/40" />
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all focus:bg-white/[0.07]"
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !username || !password}
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
