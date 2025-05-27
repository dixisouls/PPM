import React from "react";
import Message from "./Message";
import LoadingIndicator from "./LoadingIndicator";
import "./MessageList.css";

const MessageList = ({ messages, isLoading }) => {
  return (
    <div className="message-list">
      {messages.length === 0 && !isLoading && (
        <div className="empty-state">
          <p>No messages yet. Start the conversation!</p>
        </div>
      )}

      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {isLoading && <LoadingIndicator />}
    </div>
  );
};

export default MessageList;
