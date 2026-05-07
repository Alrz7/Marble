// ChatHeader.tsx
import React from "react";
import "./styles/chatHeader.css";
import * as main from "../logic/auth/authMain";
import { User } from "../logic/internal/commonTtypes";

export interface ChatHeaderProps {
  user: User;
  onBack: () => void;
  // userName: string;
  // userStatus: string;
  // userAvatar?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ user, onBack }) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
      </div>
    </div>
  );
};

export default ChatHeader;
