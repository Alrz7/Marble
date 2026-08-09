import { useState, useRef, useEffect } from "react";
import ChatArea from "./ChatArea";
import Notification from "../Notification";
import Sidebar from "../sideBar/Sidebar";

export default function ChatLayout() {
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
      <div
        style={{ width: `${sidebarWidth}px` }}
        className="flex flex-col bg-linear-to-tr from-[#0d0f10] to-[#1F202C] border-r border-border shrink-0"
      >
        <Sidebar />
      </div>

      <div
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize transition-colors ${isDragging ? "bg-primary" : "bg-border hover:bg-primary/50"}`}
      />

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ChatArea />
      </div>
      <Notification />
    </div>
  );
}
