interface TypingIndicatorProps {
  senderName: string | undefined;
}

export default function TypingIndicator({ senderName }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
        {senderName?.charAt(0)}
      </div>

      <div className="flex items-end gap-1 bg-secondary rounded-lg px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground mb-0.5">{senderName} is typing</span>
        <div className="flex gap-1 ml-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
