import { AppState } from "@states/appCommonStates";
import { MessageCircle } from "lucide-react";

export default function SidebarHeader() {
  const { connTitle } = AppState();
  return (
    <div className="px-5 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-xl flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-md font-sans font-bold text-foreground tracking-tight">
            {connTitle}
          </h1>
        </div>
      </div>
    </div>
  );
}
