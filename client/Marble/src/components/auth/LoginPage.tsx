import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { User } from "../../logic/internal/commonTypes";
import { login } from "../../logic/auth/login";
import { PAGES } from "../../logic/states/appCommonStates";

interface LoginPageProps {
  setAppState: (state: PAGES) => void;
  setUserData: (user: User) => void;
}

export default function LoginPage({ setAppState, setUserData }: LoginPageProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const currentUser = await login(id, password);
      if (currentUser) {
        setUserData(currentUser);
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center w-full h-screen bg-background overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-glow-indigo/20 blur-[120px] animate-drift1" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-glow-sage/15 blur-[120px] animate-drift2" />

      <div className="relative w-full max-w-md px-6 animate-scale-in">
        <div className="glass-panel-strong rounded-2xl px-8 py-10 shadow-2xl">
          <div className="mb-10 text-center">
            <h1
              className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-size-[200%_auto] animate-shimmer"
              style={{ backgroundImage: "linear-gradient(90deg, #7B86C9, #EDEDEF, #6EA58F, #7B86C9)" }}
            >
              Marble
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-foreground mb-2">
                Id
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  id="id"
                  type="text"
                  placeholder="your Id"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
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

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-input cursor-pointer accent-primary"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground cursor-pointer">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full marble-button-primary mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => setAppState("signup")}
              className="text-primary hover:text-accent font-medium transition-colors"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
