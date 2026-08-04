import { useState } from "react";
import { Copy, Check, ShieldAlert, ArrowRight } from "lucide-react";
import { stateSignUp } from "@states/stateAuth";
import { addAppErrNotif, newAppErr } from "@internal/golog";

interface RecoveryKeyModalProps {
  onConfirm: () => void;
}

export default function RecoveryKeyModal({ onConfirm }: RecoveryKeyModalProps) {
  const [copied, setCopied] = useState(false);
  const { generatedRecoveryKey } = stateSignUp();
  const handleCopy = () => {
    if (!generatedRecoveryKey) {
      addAppErrNotif(
        newAppErr("generatedKeyNotValid", "generated Master Key is not valid"),
      );
      return;
    }
    navigator.clipboard.writeText(generatedRecoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg p-6 space-y-6 rounded-2xl border border-white/10 bg-black/80 shadow-2xl">
        <div className="flex items-center gap-3 text-amber-400">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h3 className="text-lg font-bold">Save Your Master Recovery Key</h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          This key is the <strong>ONLY way</strong> to recover your account and
          decrypt your local data if you ever forget your daily password or
          switch devices. Store it in a safe place (like a password manager).
        </p>

        {/* Recovery Key Box */}
        <div className="relative p-4 rounded-xl border border-white/10 bg-white/5 font-mono text-sm break-all text-amber-200/90 select-all">
          {generatedRecoveryKey}
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-xs font-medium text-foreground"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-muted-foreground" />
                <span>Copy Key</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 transition-all text-xs font-semibold text-primary-foreground shadow-lg"
          >
            <span>I Saved My Key</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
