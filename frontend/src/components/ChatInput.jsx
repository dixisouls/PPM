import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";

const ChatInput = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  className = "",
}) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedMessage = message.trim();

    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const buttonVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: 15 },
    tap: { scale: 0.95, rotate: 0 },
  };

  const containerVariants = {
    focused: {
      boxShadow: "0 0 0 3px rgba(14, 165, 233, 0.1)",
      borderColor: "#0ea5e9",
    },
    unfocused: {
      boxShadow: "0 0 0 0px rgba(14, 165, 233, 0)",
      borderColor: "#e5e7eb",
    },
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={`relative ${className}`}
      initial="unfocused"
      animate={isFocused ? "focused" : "unfocused"}
      variants={containerVariants}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="flex items-end space-x-3 p-4 bg-white rounded-2xl border-2 shadow-soft"
        whileHover={{ shadow: "0 4px 25px -5px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.2 }}
      >
        {/* Input Field */}
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none border-none outline-none text-gray-900 placeholder-gray-400 text-sm leading-6 bg-transparent"
            style={{
              minHeight: "24px",
              maxHeight: "120px",
            }}
            onInput={(e) => {
              // Auto-resize textarea
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
          />
        </div>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={disabled || !message.trim()}
          className={`p-2 rounded-xl transition-all duration-200 ${
            disabled || !message.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary-500 text-white hover:bg-primary-600 shadow-medium hover:shadow-large"
          }`}
          variants={buttonVariants}
          initial="idle"
          whileHover={!disabled && message.trim() ? "hover" : "idle"}
          whileTap={!disabled && message.trim() ? "tap" : "idle"}
        >
          {disabled ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-5 h-5" />
            </motion.div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </motion.div>

      {/* Character Count (optional) */}
      {message.length > 100 && (
        <motion.div
          className="absolute -bottom-6 right-0 text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {message.length}/500
        </motion.div>
      )}
    </motion.form>
  );
};

export default ChatInput;
