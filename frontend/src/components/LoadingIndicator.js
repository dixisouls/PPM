import React from "react";
import "./LoadingIndicator.css";

const LoadingIndicator = () => {
  return (
    <div className="loading-indicator">
      <div className="loading-bubble">
        <div className="loading-content">
          <div className="typing-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <span className="loading-text">Assistant is typing...</span>
        </div>
      </div>
      <div className="loading-avatar">
        <div className="avatar assistant-avatar">🎓</div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
