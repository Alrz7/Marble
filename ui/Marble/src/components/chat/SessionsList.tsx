import { useState } from 'react';
import { Circle } from 'lucide-react';

interface Session {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  isOnline: boolean;
  avatar?: string;
}

// Mock data - replace with your actual data
const mockSessions: Session[] = [
  {
    id: '1',
    name: 'John Doe',
    lastMessage: 'Hey, how are you?',
    timestamp: '2:30 PM',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    lastMessage: 'See you tomorrow!',
    timestamp: '1:15 PM',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Alex Johnson',
    lastMessage: 'Thanks for the update',
    timestamp: 'Yesterday',
    isOnline: false,
  },
];

export default function SessionsList() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  return (
    <div className="space-y-1 p-2">
      {mockSessions.map((session) => (
        <button
          key={session.id}
          onClick={() => setSelectedSessionId(session.id)}
          className={`w-full px-3 py-3 rounded-lg transition-colors flex items-start gap-3 ${
            selectedSessionId === session.id
              ? 'bg-primary/20 border border-primary/50'
              : 'hover:bg-secondary'
          }`}
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
              {session.name.charAt(0)}
            </div>
            {session.isOnline && (
              <Circle className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 text-green-500 rounded-full border-2 border-background" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex justify-between items-baseline gap-2">
              <h3 className="font-medium text-foreground text-sm truncate">{session.name}</h3>
              <span className="text-xs text-muted-foreground flex-shrink-0">{session.timestamp}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{session.lastMessage}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
