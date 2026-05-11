// Message.tsx
import React from 'react';
import './styles/message.css';
import { MessageProps } from '../logic/internal/commonTtypes';



const Message: React.FC<MessageProps> = ({ 
  content, 
  sender, 
  timestamp, 
  status = 'sent',
  senderName 
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fa-IR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '✓';
    }
  };

  return (
    <div className={`message message-${sender}`}>
      {sender === 'audience' && senderName && (
        <div className="message-sender-name" style={{
          fontSize: '12px',
          color: '#47bed6c5',
          marginBottom: '4px',
          fontWeight: 'bold'
        }}>
          {senderName}
        </div>
      )}
      <div className="message-content">
        {content}
      </div>
      <div className="message-time">
        <span>{formatTime(timestamp)}</span>
        {sender === 'user' && (
          <span className="message-status" style={{
            fontSize: "14px",
            fontFamily: "Crf-reg",
            fontWeight: "2px",
            color: status === 'read' ? '#61fffab0' : 'rgba(97, 208, 255, 0.6)'
          }}>
            {getStatusIcon()}
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;
