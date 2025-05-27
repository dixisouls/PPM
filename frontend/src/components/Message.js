import React from "react";
import "./Message.css";

const Message = ({ message }) => {
  const { type, content, timestamp, is_cached } = message;

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`message ${type}`}>
      <div className="message-bubble">
        <div className="message-content">{content}</div>
        <div className="message-meta">
          <span className="message-time">{formatTime(timestamp)}</span>
          {is_cached && (
            <span className="cached-indicator" title="Cached response">
              ⚡
            </span>
          )}
        </div>
      </div>

      {type === "assistant" && (
        <div className="message-avatar">
          <div className="avatar assistant-avatar">🎓</div>
        </div>
      )}

      {type === "user" && (
        <div className="message-avatar">
          <div className="avatar user-avatar">👤</div>
        </div>
      )}
    </div>
  );
};

export default Message;
