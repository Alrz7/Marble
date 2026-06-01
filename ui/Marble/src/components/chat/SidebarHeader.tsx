import { MessageCircle } from 'lucide-react';

export default function SidebarHeader() {
  return (
    <div className="px-4 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Marble</h1>
          <p className="text-xs text-muted-foreground">Messages</p>
        </div>
      </div>
    </div>
  );
}
