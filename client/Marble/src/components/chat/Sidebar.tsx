import { useState } from "react";
import { Search, Settings, LogOut, Plus, Menu } from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import SessionsList from "./SessionsList";
import SearchPanel from "./SearchPanel";
import SettingsPage from "./SettingsPage";
import { AppState } from "../../logic/states/appCommonStates";
import { AppUser } from "../../logic/states/userMainStates";
import { logOut } from "../../logic/auth/login";
import { onSearchUser } from "../../logic/active/actWsClientHandelers";

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { setAppState } = AppState();
  const { setUserData } = AppUser();

  const RequestForSearch = (query: string) => {
    setSearchQuery(query);
    onSearchUser(query);
  };

  const handleLogout = () => {
    logOut(setUserData);
    setAppState("login");
  };

  return (
    <>
      {/* Header */}
      <SidebarHeader />

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => {
              RequestForSearch(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            className="marble-input w-full pl-9 text-sm"
          />
        </div>
      </div>

      {/* Sessions or Search Results */}
      <div className="flex-1 overflow-y-auto">
        {showSearchResults && searchQuery ? (
          <SearchPanel query={searchQuery} />
        ) : (
          <SessionsList />
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-3 space-y-2">
        {/* <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground text-sm">
          <Plus className="w-4 h-4 text-primary" />
          New Chat
        </button> */}

        <button
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground text-sm"
        >
          <Settings className="w-4 h-4 text-primary" />
          Settings
        </button>

        {/* <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button> */}
      </div>

      {/* Settings Modal */}
      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </>
  );
}
