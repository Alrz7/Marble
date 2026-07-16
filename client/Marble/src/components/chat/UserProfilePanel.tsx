import { X, Circle, KeyRound } from "lucide-react";
import { Audience } from "../../logic/internal/commonTypes";

interface UserProfilePanelProps {
  audience: Audience;
  onClose: () => void;
}

export default function UserProfilePanel({
  audience,
  onClose,
}: UserProfilePanelProps) {
  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-panel-strong rounded-2xl w-full max-w-sm mx-4 shadow-2xl animate-scale-in">
        <div className="flex justify-end p-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-8 pb-8 -mt-4">
          <div className="relative">
            <div className="w-24 h-24 bg-linear-to-br from-primary to-accent rounded-full flex items-center justify-center text-3xl font-bold text-primary-foreground">
              {audience.name?.charAt(0)}
            </div>
            {audience.isOnline && (
              <Circle className="absolute bottom-1 right-1 w-4 h-4 bg-accent text-accent rounded-full border-2 border-card" />
            )}
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              {audience.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {audience.isOnline ? "Online" : "Offline"}
            </p>
          </div>

          <div className="w-full space-y-2 mt-2">
            <div className="rounded-xl bg-secondary px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Username</p>
              <p className="text-sm text-foreground">{audience.displayId}</p>
            </div>

            <div className="rounded-xl bg-secondary px-4 py-3 flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Encryption</p>
                <p className="text-sm text-foreground truncate">
                  Verified end-to-end key
                </p>
              </div>
            </div>
            <div className="w-full mt-6">
              <button
                onClick={() => {}}
                className="w-full rounded-xl bg-destructive/15 border border-destructive/30 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
