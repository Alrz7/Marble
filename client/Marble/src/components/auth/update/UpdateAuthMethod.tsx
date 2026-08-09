import { Lock, Fingerprint, Shield, ArrowRight, Loader2 } from "lucide-react";
import { updateUserAuthentication } from "@auth/athHelpers";
import { addAppErrNotif, ok } from "@internal/golog";
import { stateLogin } from "@states/stateAuth";
import { settingConfigurations } from "@states/stateSettings";

export function UpdateAuthMethod() {
  const {
    authMethod,
    setAuthMethod,
    isLoading,
    setIsLoading,
    resetLoginStore,
  } = stateLogin();
  const { setConfStates } = settingConfigurations();
  const handleUpdateMethod = async () => {
    try {
      setIsLoading(true);

      if (authMethod === "passphrase" || authMethod === "keychain-passphrase") {
        setConfStates("dailyPassPhrase");
        setAuthMethod(authMethod);
      } else {
        const res = await updateUserAuthentication("keychain");
        resetLoginStore();
        setConfStates(null);
        if (!res.ok) {
          addAppErrNotif(res.error);
        }
      }
      return ok(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Unlock Method
        </h2>
        <p className="text-sm text-white/50">
          Update how you decrypt your local vault, or skip to continue.
        </p>
      </div>

      <div className="space-y-3">
        {[
          {
            id: "keychain",
            icon: Fingerprint,
            title: "Device Keychain",
            desc: "Unlock seamlessly using your OS.",
          },
          {
            id: "passphrase",
            icon: Lock,
            title: "Daily Passphrase",
            desc: "Require a custom passphrase every time.",
          },
          {
            id: "keychain-passphrase",
            icon: Shield,
            title: "Maximum Security",
            desc: "Require keychain-passphrase Keychain AND Passphrase.",
          },
        ].map((method) => {
          const Icon = method.icon;
          const isActive = authMethod === method.id;
          return (
            <button
              key={method.id}
              onClick={() => setAuthMethod(method.id as any)}
              className={`w-full flex items-start p-4 rounded-2xl border transition-all text-left group ${
                isActive
                  ? "bg-white/10 border-white/40 shadow-lg"
                  : "bg-white/5 border-white/5 hover:bg-white/8"
              }`}
            >
              <Icon
                className={`w-6 h-6 mr-4 mt-0.5 transition-colors ${method.id == "keychain-passphrase" ? "text-amber-400" : method.id == "passphrase" ? "text-indigo-400" : "text-emerald-400"}`}
              />
              <div>
                <h4
                  className={`text-sm font-medium transition-colors ${isActive ? "text-white" : "text-white/70"}`}
                >
                  {method.title}
                </h4>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  {method.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={handleUpdateMethod}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3.5 bg-white text-black rounded-2xl text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Update Method & Continue"
          )}
          {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
        </button>

        {/* <button
          onClick={handleSkip}
          className="w-full py-3 text-xs font-medium text-white/40 hover:text-white transition-colors"
        >
          Skip (Keep current settings)
        </button> */}
      </div>
    </div>
  );
}
