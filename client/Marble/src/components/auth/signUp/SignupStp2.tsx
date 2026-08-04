import { stateSignUp } from "@states/stateAuth";
import { KeyRound } from "lucide-react";

export default function SignupStp2() {
  const {
    setStep,
    setGeneratedRecoveryKey,
    customRecoveryKey,
    setRecoveryMode,
    setShowKeyModal,
    setCustomRecoveryKey,
  } = stateSignUp();

  const handleGenerateMasterKey = async () => {
    const keyArray = new Uint8Array(32);
    window.crypto.getRandomValues(keyArray);
    setGeneratedRecoveryKey(btoa(keyArray.toString()));
    setRecoveryMode("generated");
    setShowKeyModal(true);
  };

  const handleCustomKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRecoveryKey.trim()) return;
    setRecoveryMode("custom");
    setStep(3);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Master Recovery Key
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Choose how your Master Recovery Key is generated. This key is used to
          recover your account if you lose access.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Option A: Auto Generated Key */}
        <button
          type="button"
          onClick={handleGenerateMasterKey}
          className="flex flex-col text-left p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-indigo-300">
              Generate Secure Key (Recommended)
            </span>
            <KeyRound className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            We generate a 256-bit high-entropy key for you. You will need to
            copy and store it somewhere safe.
          </p>
        </button>

        {/* Option B: Custom Recovery Passphrase */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
          <span className="text-xs font-bold text-foreground">
            Set Custom Recovery Passphrase
          </span>
          <p className="text-[11px] text-muted-foreground">
            Create your own very strong passphrase to act as your Master Key.
          </p>
          <form onSubmit={handleCustomKeySubmit} className="space-y-3 pt-1">
            <input
              type="password"
              placeholder="Enter strong custom key..."
              value={customRecoveryKey}
              onChange={(e) => setCustomRecoveryKey(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={!customRecoveryKey.trim()}
              className="w-full py-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 disabled:opacity-40 transition-all text-xs font-medium text-foreground"
            >
              Use Custom Key
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
