import { useEffect } from 'react';

interface LoadingPageProps {
  onLoadComplete: () => void;
}

export default function LoadingPage({ onLoadComplete }: LoadingPageProps) {
  useEffect(() => {
    const timer = setTimeout(onLoadComplete, 2500);
    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  return (
    <div className="flex items-center justify-center w-full h-screen bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          Marble
        </div>
        <p className="text-muted-foreground">Initializing secure connection...</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
