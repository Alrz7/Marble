interface TypingIndicatorProps {
  senderName: string | undefined;
}

export default function TypingIndicator({ senderName }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 bg-linear-to-br from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
        {senderName?.charAt(0)}
      </div>

      <div className="flex items-center gap-2 glass-panel rounded-2xl px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">{senderName} is typing</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
