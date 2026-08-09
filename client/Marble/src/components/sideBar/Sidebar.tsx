import { Search, Settings } from "lucide-react";
import SidebarHeader from "./SidebarHeader";
import SessionsList from "./SessionsList";
import SearchPanel from "./SearchPanel";
import { onSearchUser } from "@active/actWsClientHandelers";
import { AppState, searchResult } from "@states/stateCommon";
import SettingsPage from "../settings/SettingsPage";

export default function Sidebar() {
  const {
    setUsers,
    searchQuery,
    setSearchQuery,
    showSearchResults,
    setShowSearchResults,
  } = searchResult();
  const { isSettingOpen, setIsSettingOpen } = AppState();

  const RequestForSearch = (query: string) => {
    if (searchQuery.length > 0 && query.length == 0) {
      setUsers([]);
    }
    setSearchQuery(query);
    onSearchUser(query);
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

      <div className="border-t border-border p-2 space-y-1">
        <button
          onClick={() => setIsSettingOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          <Settings className="w-5 h-5" />
        </button>

        {isSettingOpen && <SettingsPage />}
      </div>
    </>
  );
}
