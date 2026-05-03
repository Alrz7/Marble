// ChatHeader.tsx
import React from 'react';
import './styles/chatHeader.css';

export interface ChatHeaderProps {
  onBack: () => void;
  userName: string;
  userStatus: string;
  userAvatar?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onBack, 
  userName, 
  userStatus,
  userAvatar 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="sidebar-header">
      <button className="back-button" onClick={onBack} aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      <div className="user-profile">
        <div className="profile-avatar">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          ) : (
            getInitials(userName)
          )}
        </div>
        <div className="profile-info">
          <h3>{userName}</h3>
          <p>{userStatus}</p>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
