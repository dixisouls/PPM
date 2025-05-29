import React from "react";
import { motion } from "framer-motion";
import { User, Bot, Clock } from "lucide-react";
import {
  parseMarkdownText,
  useMarkdownTyping,
} from "../utils/markdownFormatter";

const Message = ({
  message,
  isUser,
  timestamp,
  isNew = false,
  isCached = false,
  showTypingAnimation = false,
}) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "";
    }
  };

  const messageVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  // Use typing animation for assistant messages with markdown support
  const { displayedText, isComplete } = useMarkdownTyping(
    showTypingAnimation && !isUser ? message : "",
    5, 
    () => console.log("Typing complete")
  );

  // Determine what content to show
  const getMessageContent = () => {
    if (showTypingAnimation && !isUser && !isComplete) {
      // Show typing animation with plain text
      return (
        <div className="space-y-2">
          <span className="whitespace-pre-wrap">{displayedText}</span>
          <motion.span
            className="inline-block w-0.5 h-4 bg-primary-500 ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </div>
      );
    } else {
      // Show formatted markdown content
      const formattedContent = parseMarkdownText(message);
      return (
        <div className="space-y-2">
          {Array.isArray(formattedContent) ? (
            formattedContent.map((element, index) => (
              <React.Fragment key={index}>{element}</React.Fragment>
            ))
          ) : (
            <span className="whitespace-pre-wrap">{message}</span>
          )}
        </div>
      );
    }
  };

  return (
    <motion.div
      className={`flex items-start space-x-3 ${
        isUser ? "flex-row-reverse space-x-reverse" : ""
      }`}
      variants={messageVariants}
      initial={isNew ? "hidden" : "visible"}
      animate="visible"
      layout
    >
      {/* Avatar */}
      <motion.div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600"
        }`}
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </motion.div>

      {/* Message Content */}
      <div
        className={`flex flex-col ${
          isUser ? "items-end" : "items-start"
        } max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg`}
      >
        {/* Message Bubble */}
        <motion.div
          className={`${
            isUser ? "chat-bubble-user" : "chat-bubble-assistant"
          } relative`}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {/* Cached indicator */}
          {isCached && !isUser && (
            <motion.div
              className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              title="Cached response"
            >
              <Clock className="w-2 h-2 text-white" />
            </motion.div>
          )}

          {/* Message Text */}
          <div className="text-sm leading-relaxed">{getMessageContent()}</div>
        </motion.div>

        {/* Timestamp */}
        {timestamp && (
          <motion.div
            className={`text-xs text-gray-400 mt-1 px-1 ${
              isUser ? "text-right" : "text-left"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {formatTime(timestamp)}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Message;
