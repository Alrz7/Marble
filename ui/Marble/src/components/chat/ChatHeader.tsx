import { Phone, Video, Info, Circle } from 'lucide-react';

export default function ChatHeader() {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground">
            J
          </div>
          <Circle className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 text-green-500 rounded-full border-2 border-background" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">John Doe</h2>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-foreground">
          <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-foreground">
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-foreground">
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
