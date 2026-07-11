import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { User as AppUser } from "../../logic/internal/commonTypes";
import { createAccount } from "../../logic/auth/signUp";
import { PAGES } from "../../logic/states/appCommonStates";

interface SignupPageProps {
  setAppState: (state: PAGES) => void;
  setUserData: (user: AppUser) => void;
}

export default function SignupPage({ setAppState, setUserData }: SignupPageProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      console.error("Passwords do not match");
      return;
    }

    if (!acceptTerms) {
      console.error("Please accept terms");
      return;
    }

    setIsLoading(true);

    try {
      const user = await createAccount(username, email, password);
      if (user) {
        setUserData(user);
      }
    } catch (error) {
      console.error("Signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <div className="relative flex items-center justify-center w-full h-screen bg-background overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-glow-indigo/20 blur-[120px] animate-drift1" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-glow-sage/15 blur-[120px] animate-drift2" />

      <div className="relative w-full max-w-md px-6 animate-scale-in">
        <div className="glass-panel-strong rounded-2xl px-8 py-10 shadow-2xl">
          <div className="mb-8 text-center">
            <h1
              className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer"
              style={{ backgroundImage: "linear-gradient(90deg, #7B86C9, #EDEDEF, #6EA58F, #7B86C9)" }}
            >
              Marble
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  id="username"
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="marble-input w-full pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="marble-input w-full pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="marble-input w-full pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`marble-input w-full pl-10 pr-10 ${
                    confirmPassword && !passwordsMatch ? "border-destructive" : ""
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-border bg-input cursor-pointer accent-primary"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                I agree to the terms of service and privacy policy
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !passwordsMatch || !acceptTerms}
              className="w-full marble-button-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => setAppState("login")}
              className="text-primary hover:text-accent font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}