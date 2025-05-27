import React, { useState, useEffect } from "react";
import "../styles/Message.css";

const Message = ({ message }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const { type, content, timestamp, isCached, isWelcome } = message;

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Typewriter effect for assistant messages
  useEffect(() => {
    if (type === "assistant" && content) {
      setDisplayText("");
      let i = 0;
      const typeTimer = setInterval(() => {
        if (i < content.length) {
          setDisplayText(content.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeTimer);
        }
      }, 20); // Adjust speed here

      return () => clearInterval(typeTimer);
    } else {
      setDisplayText(content);
    }
  }, [content, type]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case "user":
        return "👤";
      case "assistant":
        return "🎓";
      case "error":
        return "⚠️";
      default:
        return "💬";
    }
  };

  return (
    <div className={`message ${type} ${isVisible ? "visible" : ""}`}>
      <div className="message-avatar">
        <div className={`avatar ${type}-avatar`}>{getMessageIcon(type)}</div>
      </div>

      <div className="message-content">
        <div className={`message-bubble ${type}-bubble`}>
          <div className="message-text">
            {type === "assistant" ? displayText : content}
            {type === "assistant" && displayText.length < content.length && (
              <span className="typing-cursor">|</span>
            )}
          </div>

          <div className="message-meta">
            <span className="message-time">{formatTime(timestamp)}</span>
            {isCached && (
              <span className="cached-badge" title="Cached response">
                ⚡ Cached
              </span>
            )}
            {isWelcome && <span className="welcome-badge">👋 Welcome</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
