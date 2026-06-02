import { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";

interface ChatLayoutProps {
  onLogout: () => void;
}

export default function ChatLayout({ onLogout }: ChatLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const MIN_WIDTH = 240;
  const MAX_WIDTH = 500;

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let newWidth = e.clientX - container.getBoundingClientRect().left;
    newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const disableSelect = (e: Event) => e.preventDefault();
    window.addEventListener("selectstart", disableSelect);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("selectstart", disableSelect);
    };
  }, [isDragging]);
  return (
    <div
      ref={containerRef}
      className="flex w-full h-screen bg-background select-none"
    >
      {/* Sidebar */}
      <div
        style={{ width: `${sidebarWidth}px` }}
        className="flex flex-col bg-background border-r border-border"
      >
        <Sidebar onLogout={onLogout} />
      </div>

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors ${
          isDragging ? "bg-primary" : ""
        }`}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <ChatArea />
      </div>
    </div>
  );
}
