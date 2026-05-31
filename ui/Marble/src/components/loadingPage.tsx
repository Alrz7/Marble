// LoadingPage.tsx
import React from "react";
import "./styles/loadingPage.css";

const LoadingPage: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loader">
        <div className="core"></div>
        <div className="ring ring-1"></div>
        <div className="ring ring-2"></div>
        <div className="orbital dot-1"></div>
        <div className="orbital dot-2"></div>
      </div>
      <p className="loading-text">connecting...</p>
    </div>
  );
};

export default LoadingPage;