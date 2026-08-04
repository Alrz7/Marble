import { stateSignUp } from "@states/stateAuth";
import { User, Mail } from "lucide-react";

export default function SignupStp1() {
  const { setStep, name, setName, username, setUsername, email, setEmail } =
    stateSignUp();
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create Identity</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your initial details to set up your public profile.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g. Alice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-mono text-muted-foreground">
              @
            </span>
            <input
              type="text"
              placeholder="alice"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="alice@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              required
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!name || !username || !email}
        onClick={() => setStep(2)}
        className="w-full py-2.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs font-semibold text-primary-foreground shadow-lg"
      >
        Continue
      </button>
    </div>
  );
}
