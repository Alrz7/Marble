import { useState } from "react";
import { Shield } from "lucide-react";
import { PassphraseView } from "./PassphraseView";
import { RecoveryView } from "./RecoveryView";
import { AuthMethod } from "@internal/intrCmnTypes";
import Notification from "../../Notification";

export default function DayilyLoginScreen({
  user_id,
  authMethod,
}: {
  user_id: number;
  authMethod: AuthMethod;
}) {
  const [view, setView] = useState<"passphrase" | "recovery">("passphrase");

  return (
    <div className="relative flex w-full h-screen bg-background overflow-hidden text-foreground select-none">
      {/* Background Glow Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-glow-indigo/20 blur-[120px] animate-drift1 pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-glow-sage/15 blur-[120px] animate-drift2 pointer-events-none" />

      {/* Main Grid: Left Side (Brand) & Right Side (Unlock Form) */}
      <div className="relative z-10 flex w-full h-full max-w-6xl mx-auto px-8 py-10">
        {/* Left Side: Brand Panel */}
        <div className="hidden md:flex flex-col w-5/12 pr-12 border-r border-white/5">
          <div className="space-y-6">
            <div>
              <h1
                className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-size-[200%_auto] animate-shimmer"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #7B86C9, #EDEDEF, #6EA58F, #7B86C9)",
                }}
              >
                Marble
              </h1>
              <p className="text-sm text-muted-foreground mt-2 font-mono">
                Vault is currently locked
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Local Encryption Active
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your data is secured with AES-GCM 256. Enter your
                    credentials to decrypt the local vault.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Forms */}
        <div className="flex-1 flex flex-col justify-center md:pl-12 max-w-lg mx-auto w-full">
          {view === "passphrase" ? (
            <PassphraseView
              onForgot={() => setView("recovery")}
              user_id={user_id}
              authMethod={authMethod}
            />
          ) : (
            <RecoveryView onBack={() => setView("passphrase")} />
          )}
        </div>
      </div>
      <Notification />
    </div>
  );
}
