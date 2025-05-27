import React, { useState, useEffect } from "react";
import "../styles/TypingIndicator.css";

const TypingIndicator = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`typing-indicator ${isVisible ? "visible" : ""}`}>
      <div className="message-avatar">
        <div className="avatar assistant-avatar">🎓</div>
      </div>

      <div className="message-content">
        <div className="typing-bubble">
          <div className="typing-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          <span className="typing-text">Assistant is thinking...</span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
