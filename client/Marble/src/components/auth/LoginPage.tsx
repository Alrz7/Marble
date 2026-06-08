import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { User } from "../../logic/internal/commonTypes";
import { login } from "../../logic/auth/login";
import { getKeyFromArmored } from "../../logic/enc/encMain";
import { PAGES } from "../../logic/states/appCommonStates";

interface LoginPageProps {
  setAppState: (state: PAGES) => void;
  setUserData: (user: User) => void;
}

export default function LoginPage({
  setAppState,
  setUserData,
}: LoginPageProps) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newUserConfig = await login(id, password);
      if (newUserConfig) {
        const prvKey = await getKeyFromArmored(
          newUserConfig.identityKey.privateKey,
          null,
        );
        if (prvKey) {
          setUserData({ config: newUserConfig, prvIdentKey: prvKey });
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-screen bg-background">
      <div className="w-full max-w-md px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-3">
            Marble
          </h1>
          {/* <p className="text-muted-foreground text-sm">
            Simple, but Spicey
          </p> */}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* It will be replaced with Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Id
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <input
                id="id"
                type="id"
                placeholder="your Id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="marble-input w-full pl-10"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-2"
            >
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
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-input cursor-pointer"
            />
            <label
              htmlFor="remember"
              className="ml-2 text-sm text-muted-foreground cursor-pointer"
            >
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full marble-button-primary mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Signup Link */}
        <p className="text-center text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => {
              setAppState("signup");
            }}
            className="text-primary hover:text-accent font-medium transition-colors"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
