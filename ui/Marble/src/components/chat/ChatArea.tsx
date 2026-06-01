import { useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';

export default function ChatArea() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      senderId: 'user1',
      senderName: 'John Doe',
      content: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 60000),
      isOwn: false,
      status: 'delivered',
    },
    {
      id: '2',
      senderId: 'user2',
      senderName: 'Me',
      content: 'I am doing great! How about you?',
      timestamp: new Date(Date.now() - 30000),
      isOwn: true,
      status: 'read',
    },
  ]);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: String(messages.length + 1),
      senderId: 'user2',
      senderName: 'Me',
      content,
      timestamp: new Date(),
      isOwn: true,
      status: 'sent' as const,
    };

    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <ChatHeader />

      {/* Messages */}
      <ChatMessageList messages={messages} />

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
