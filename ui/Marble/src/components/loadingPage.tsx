import React, { useState, useEffect } from "react";
import "./styles/loadingPage.css";

const TARGET = "Marble";
const LoadingPage: React.FC = () => {
  const [displayed, setDisplayed] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    let isDeleting = false;
    let timeoutId: number;

    const step = () => {
      if (!isDeleting) {
        if (index < TARGET.length) {
          setDisplayed(TARGET.slice(0, index + 1));
          index++;
          timeoutId = window.setTimeout(step, 180);
        } else {
          isDeleting = true;
          timeoutId = window.setTimeout(step, 800);
        }
      } else {
        if (index > 0) {
          setDisplayed(TARGET.slice(0, index - 1));
          index--;
          timeoutId = window.setTimeout(step, 120);
        } else {
          isDeleting = false;
          timeoutId = window.setTimeout(step, 400);
        }
      }
    };

    timeoutId = window.setTimeout(step, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="terminal-loading">
      <div className="terminal-bg" />
      <div className="terminal-card">
        <div className="terminal-header">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
        </div>
        <div className="terminal-body">
          <span className="prompt">$&nbsp;</span>
          <span className="typed-text">{displayed}</span>
          {showCursor && <span className="cursor">_</span>}
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;
