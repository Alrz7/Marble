import { stateSignUp } from "@states/stateAuth";
import { User, AlertCircle, Server } from "lucide-react";
import { useState } from "react";

export default function SignupStp1() {
  const {
    setStep,
    name,
    setName,
    username,
    setUsername,
    email,
    setEmail,
    serverUrl,
    setServerUrl,
  } = stateSignUp();
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const isValidEmail =
    !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showError = touched && email.length > 0 && !isValidEmail;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create Identity</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your initial details to set up your public profile.
        </p>
      </div>

      <div className="space-y-5">
        <div>
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
                className={`w-full pl-11 pr-4 py-2 rounded-2xl text-md transition-all focus:outline-none ${
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

          <label className="block text-xs font-medium text-foreground mb-2 mt-3.5">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g. Alice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-2">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-xs font-mono text-muted-foreground">
              @
            </span>
            <input
              type="text"
              placeholder="alice"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/70 mb-2 pl-1">
            Email Address
          </label>
          <div className="relative">
            <User
              className={`absolute left-4 top-3.5 w-4 h-4 transition-colors ${
                showError ? "text-red-400" : "text-white/40"
              }`}
            />
            <input
              type="email"
              placeholder="alice@example.com"
              value={email}
              onBlur={() => setTouched(true)}
              onChange={(e) => {
                setTouched(false);
                setEmail(e.target.value);
              }}
              className={`w-full pl-11 pr-4 py-2 rounded-2xl text-md transition-all focus:outline-none ${
                showError
                  ? "bg-red-500/10 border border-red-500/50 text-red-200 placeholder:text-red-300/30 focus:border-red-500 focus:bg-red-500/15"
                  : "bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.07]"
              }`}
              required
            />
          </div>
          {showError && (
            <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5 pl-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>email-format is not currect</span>
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={!name || !username || !email}
        onClick={() => {
          if (isValidEmail) setStep(2);
        }}
        className="w-full py-2.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-semibold text-primary-foreground shadow-lg"
      >
        Continue
      </button>
    </div>
  );
}
