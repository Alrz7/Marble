import { AppState } from "@states/stateCommon";
import appIcon from "@assets/Marble-Icon.png";

export default function SidebarHeader() {
  const { connTitle } = AppState();
  return (
    <div className="px-5 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
          <img
            src={appIcon}
            alt="Marble Icon"
            className="w-10 h-10 object-contain"
          />
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
