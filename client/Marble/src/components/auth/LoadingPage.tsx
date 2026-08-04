import { useEffect } from "react";

interface LoadingPageProps {
  onLoadComplete: () => void;
}

export default function LoadingPage({ onLoadComplete }: LoadingPageProps) {
  useEffect(() => {
    const timer = setTimeout(onLoadComplete, 500);
    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  return (
    <div className="relative flex items-center justify-center w-full h-screen bg-background overflow-hidden">
      <div className="absolute w-72 h-72 rounded-full bg-glow-indigo/30 blur-[100px] animate-drift1" />
      <div className="absolute w-72 h-72 rounded-full bg-glow-sage/20 blur-[100px] animate-drift2 translate-x-24" />

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-primary/15" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-orbit" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-accent/70 animate-orbit-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          </div>
        </div>

        <div
          className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-size-[200%_auto] animate-shimmer"
          style={{ backgroundImage: "linear-gradient(90deg, #7B86C9, #EDEDEF, #6EA58F, #7B86C9)" }}
        >
          Marble
        </div>

        <p className="text-sm text-muted-foreground animate-fade-in">Initializing secure connection...</p>
      </div>
    </div>
  );
}
