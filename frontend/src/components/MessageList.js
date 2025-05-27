import React from "react";
import Message from "./Message";
import TypingIndicator from "./TypingIndicator";
import "../styles/MessageList.css";

const MessageList = ({ messages, isLoading }) => {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {isLoading && <TypingIndicator />}
    </div>
  );
};

export default MessageList;
