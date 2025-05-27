import React from "react";
import "./ChatHeader.css";

const ChatHeader = ({
  isConnected,
  chatId,
  onStartChat,
  onEndChat,
  isLoading,
}) => {
  return (
    <header className="chat-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">PPM Course Advisor</h1>
          {isConnected && (
            <div className="chat-info">
              <span className="status-indicator online"></span>
              <span className="chat-id">
                Chat: {chatId?.substring(0, 8)}...
              </span>
            </div>
          )}
        </div>

        <div className="header-actions">
          {isConnected ? (
            <button
              onClick={onEndChat}
              disabled={isLoading}
              className="btn btn-danger"
            >
              End Chat
            </button>
          ) : (
            <button
              onClick={onStartChat}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? "Starting..." : "Start Chat"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
