import { MessageCircle } from 'lucide-react';

interface SearchPanelProps {
  query: string;
}

// Mock search results - replace with your actual search logic
const getSearchResults = (query: string) => {
  const allUsers = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Alex Johnson' },
    { id: '4', name: 'Sarah Williams' },
    { id: '5', name: 'Mike Brown' },
  ];

  return allUsers.filter(
    (user) => user.name.toLowerCase().includes(query.toLowerCase())
  );
};

export default function SearchPanel({ query }: SearchPanelProps) {
  const results = getSearchResults(query);

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm">No users found matching &quot;{query}&quot;</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      <p className="text-xs text-muted-foreground px-3 py-2">
        Found {results.length} {results.length === 1 ? 'user' : 'users'}
      </p>

      {results.map((user) => (
        <button
          key={user.id}
          className="w-full px-3 py-3 rounded-lg hover:bg-secondary transition-colors flex items-center gap-3"
        >
          {/* Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0">
            {user.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="text-left">
            <h3 className="font-medium text-foreground text-sm">{user.name}</h3>
            <p className="text-xs text-muted-foreground">Start new chat</p>
          </div>
        </button>
      ))}
    </div>
  );
}
