import { KeyRound, Shield, ArrowLeft } from "lucide-react";
import { User as AppUser } from "@internal/intrCmnTypes";
import { PAGES } from "@states/stateCommon";
import RecoveryKeyModal from "./RecoveryKeyModal";
import { stateSignUp, Steps } from "@states/stateAuth";
import SignupStp1 from "./SignupStp1";
import SignupStp2 from "./SignupStp2";
import SignupStp3 from "./SignupStp3";
import SignupStp4 from "./SignupStp4";
import Notification from "../../Notification";

interface SignupPageProps {
  setAppState: (state: PAGES) => void;
  setUserData: (user: AppUser) => void;
}

export default function SignupPage({ setAppState }: SignupPageProps) {
  const { step, resetSignUpStore, setShowKeyModal, setStep, showKeyModal } =
    stateSignUp();

  const handleModalConfirm = () => {
    setShowKeyModal(false);
    setStep(3);
  };

  return (
    <div className="relative flex w-full h-screen bg-background overflow-hidden text-foreground select-none">
      {/* Background Glow Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-glow-indigo/20 blur-[120px] animate-drift1 pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-glow-sage/15 blur-[120px] animate-drift2 pointer-events-none" />

      {/* Main Grid: Left Side (Information) & Right Side (Form Steps) */}
      <div className="relative z-10 flex w-full h-full max-w-6xl mx-auto px-8 py-10">
        {/* Left Side: Brand & Context Panel */}
        <div className="hidden md:flex flex-col justify-between w-5/12 pr-12 border-r border-white/5">
          <div className="space-y-6">
            <div>
              <h1
                className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-size-[200%_auto] animate-shimmer"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #7B86C9, #EDEDEF, #6EA58F, #7B86C9)",
                }}
              >
                Marble
              </h1>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Zero-Knowledge Encrypted Messenger
              </p>
            </div>

            <div className="space-y-4 pt-8">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    End-to-End Encryption
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Your keys are derived locally using Argon2id. The server
                    never sees your master secret.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <KeyRound className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Recovery Key Security
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Your Master Recovery Key decrypts your data storage. Keep it
                    offline and secure.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Already registered?{" "}
            <button
              onClick={() => {
                resetSignUpStore();
                setAppState("login");
              }}
              className="text-primary hover:underline font-medium transition-colors"
            >
              Sign in to your vault
            </button>
          </div>
        </div>

        {/* Right Side: Step-by-Step Interactive Form */}
        <div className="flex-1 flex flex-col justify-center md:pl-12 max-w-xl mx-auto w-full">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as Steps)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step {step} of 4
              </span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-6 bg-primary"
                      : i < step
                        ? "w-2 bg-primary/40"
                        : "w-2 bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {step === 1 && <SignupStp1 />}

          {step === 2 && <SignupStp2 />}

          {step === 3 && <SignupStp3 />}

          {step === 4 && <SignupStp4 />}
        </div>
      </div>

      {/* Recovery Key Popup Modal */}
      {showKeyModal && <RecoveryKeyModal onConfirm={handleModalConfirm} />}
      <Notification />
    </div>
  );
}
