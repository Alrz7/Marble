// ChatHeader.tsx
import React from "react";
import "./styles/chatHeader.css";
import { User } from "../logic/internal/commonTypes";
import { getInitials } from "../logic/internal/helperfuncs";
import { SearchButton } from "./searchBar";
export interface ChatHeaderProps {
  user: User;
  onBack: () => void;
  isSearching: boolean;
  searchToggle: () => void;
  // userName: string;
  // userStatus: string;
  // userAvatar?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  onBack,
  isSearching,
  searchToggle,
}) => {
  return (
    <div>
      <div className="sidebar-header">
        <div className="user-profile">
          <button
            className="profile-avatar"
            onClick={() => {
              onBack();
            }}
          >
            {/* {false ? (
              <img
                src={userAvatar}
                alt={userName}
                style={{ width: "100%", height: "100%", borderRadius: "50%" }}
              />
            ) : ( */}
            {getInitials(user ? user.config.name : "")}
            {/* )} */}
          </button>
          <div className="profile-info">
            <h3>{user ? user.config.name : ""}</h3>
            {/* <p>{userStatus}</p> */}
          </div>
        </div>
        <SearchButton isSearching={isSearching} onToggle={searchToggle} />
      </div>
    </div>
  );
};

export default ChatHeader;
