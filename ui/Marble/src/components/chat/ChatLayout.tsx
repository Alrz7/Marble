import { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

interface ChatLayoutProps {
  onLogout: () => void;
}

export default function ChatLayout({ onLogout }: ChatLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 240;
  const MAX_WIDTH = 500;

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const newWidth = e.clientX - container.getBoundingClientRect().left;

    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setSidebarWidth(newWidth);
    }
  };

  if (isDragging) {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }

  return (
    <div
      ref={containerRef}
      className="flex w-full h-screen bg-background select-none"
    >
      {/* Sidebar */}
      <div style={{ width: `${sidebarWidth}px` }} className="flex flex-col bg-background border-r border-border">
        <Sidebar onLogout={onLogout} />
      </div>

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors ${
          isDragging ? 'bg-primary' : ''
        }`}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        <ChatArea />
      </div>
    </div>
  );
}
