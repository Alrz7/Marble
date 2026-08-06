import { useState } from "react";
import { Search, Settings, LogOut } from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import SessionsList from "./SessionsList";
import SearchPanel from "./SearchPanel";
import SettingsPage from "./SettingsPage";
import { logOut } from "@auth/athUserSignIn";
import { onSearchUser } from "@active/actWsClientHandelers";
import { searchResult } from "@states/stateCommon";

export default function Sidebar() {
  const {
    setUsers,
    searchQuery,
    setSearchQuery,
    showSearchResults,
    setShowSearchResults,
  } = searchResult();

  const [showSettings, setShowSettings] = useState(false);

  const RequestForSearch = (query: string) => {
    if (searchQuery.length > 0 && query.length == 0) {
      setUsers([]);
    }
    setSearchQuery(query);
    onSearchUser(query);
  };

  const handleLogout = () => {
    logOut();
  };

  return (
    <>
      <SidebarHeader />

      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => {
              RequestForSearch(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            className="w-full bg-primary/15 text-[#ffffff] border border-border rounded-lg pl-6 pr-3 py-1"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto marble-scrollbar">
        {showSearchResults && searchQuery ? (
          <SearchPanel query={searchQuery} />
        ) : (
          <SessionsList />
        )}
      </div>

      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-foreground text-sm"
        >
          <Settings className="w-4 h-4 text-primary" />
          Settings
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 transition-colors text-destructive text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </>
  );
}
