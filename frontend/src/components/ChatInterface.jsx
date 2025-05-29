import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Message from "./Message";
import ChatInput from "./ChatInput";
import CollectedInfo from "./CollectedInfo";
import TypingIndicator from "./TypingIndicator";
import { chatAPI } from "../services/api";

const ChatInterface = ({
  chatId,
  onEndChat,
  initialMessage = "Hello! To get started, please tell me the name of your current university.",
  className = "",
}) => {
  const [messages, setMessages] = useState([]);
  const [collectedInfo, setCollectedInfo] = useState({});
  const [completionStatus, setCompletionStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage = {
      id: "welcome",
      message: initialMessage,
      isUser: false,
      timestamp: new Date().toISOString(),
      isNew: true,
    };
    setMessages([welcomeMessage]);

    // Load existing data
    loadChatData();
  }, [chatId, initialMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const loadChatData = async () => {
    try {
      // Load conversation history
      const historyResponse = await chatAPI.getHistory(chatId);
      if (
        historyResponse.conversations &&
        historyResponse.conversations.length > 0
      ) {
        const formattedMessages = historyResponse.conversations.flatMap(
          (conv) => [
            {
              id: `${conv.id}-user`,
              message: conv.human_response,
              isUser: true,
              timestamp: conv.timestamp,
              isNew: false,
            },
            {
              id: `${conv.id}-assistant`,
              message: conv.assistant_response,
              isUser: false,
              timestamp: conv.timestamp,
              isNew: false,
            },
          ]
        );
        setMessages((prev) => [...prev, ...formattedMessages]);
      }

      // Load collected info
      await loadCollectedInfo();
    } catch (error) {
      console.error("Failed to load chat data:", error);
      setError("Failed to load chat history");
    }
  };

  const loadCollectedInfo = async () => {
    try {
      const infoResponse = await chatAPI.getCollectedInfo(chatId);
      setCollectedInfo(infoResponse.collected_info || {});

      const statusResponse = await chatAPI.getCompletionStatus(chatId);
      setCompletionStatus(statusResponse || {});
    } catch (error) {
      console.error("Failed to load collected info:", error);
    }
  };

  // Helper function to check if all required info is collected
  const isAllInfoCollected = () => {
    const requiredFields = ["U1", "C1", "U2", "C2"];
    return requiredFields.every(
      (field) => collectedInfo[field] && collectedInfo[field].trim() !== ""
    );
  };

  // Helper function to get appropriate placeholder text
  const getPlaceholderText = () => {
    // If completion status indicates complete OR all fields are collected locally
    if (completionStatus.is_complete || isAllInfoCollected()) {
      return "Ask me anything about your pathway...";
    }

    // If we have a next field from the backend
    if (completionStatus.next_field) {
      return `Please provide: ${completionStatus.next_field}`;
    }

    // Default fallback
    return "Type your message...";
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      message: messageText,
      isUser: true,
      timestamp: new Date().toISOString(),
      isNew: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      const response = await chatAPI.sendMessage(chatId, messageText);

      // Add assistant response with typing animation
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        message: response.response,
        isUser: false,
        timestamp: new Date().toISOString(),
        isNew: true,
        isCached: response.is_cached || false,
        showTypingAnimation: true,
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, assistantMessage]);

      // Update collected info after message
      await loadCollectedInfo();
    } catch (error) {
      setIsTyping(false);
      setError(error.message || "Failed to send message");

      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        message: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        isUser: false,
        timestamp: new Date().toISOString(),
        isNew: true,
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndChat = async () => {
    try {
      await chatAPI.closeSession(chatId);
      onEndChat();
    } catch (error) {
      console.error("Failed to close chat session:", error);
      onEndChat(); // Still close the chat on frontend
    }
  };

  const handleRestart = async () => {
    try {
      setMessages([]);
      setCollectedInfo({});
      setCompletionStatus({});
      setError(null);

      // Reinitialize with welcome message
      const welcomeMessage = {
        id: "welcome-restart",
        message: initialMessage,
        isUser: false,
        timestamp: new Date().toISOString(),
        isNew: true,
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Failed to restart chat:", error);
      setError("Failed to restart chat");
    }
  };

  const handleExportChat = () => {
    const chatData = {
      chatId,
      messages: messages.map((msg) => ({
        message: msg.message,
        isUser: msg.isUser,
        timestamp: msg.timestamp,
      })),
      collectedInfo,
      completionStatus,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-${chatId.slice(0, 8)}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      className={`h-screen flex bg-gray-50 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <motion.div
          className="bg-white border-b border-gray-200 p-4 shadow-sm"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-sm">
                  {chatId.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Course Advisor Chat
                </h2>
                <p className="text-sm text-gray-500">
                  Chat ID: {chatId.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                onClick={handleRestart}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={handleExportChat}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={handleEndChat}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-50 border-b border-red-200 p-3"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message.message}
                isUser={message.isUser}
                timestamp={message.timestamp}
                isNew={message.isNew}
                isCached={message.isCached}
                showTypingAnimation={message.showTypingAnimation}
              />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <motion.div
          className="p-4 bg-white border-t border-gray-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
            placeholder={getPlaceholderText()}
          />
        </motion.div>
      </div>

      {/* Sidebar - Collected Information */}
      <motion.div
        className={`bg-white border-l border-gray-200 transition-all duration-300 h-screen overflow-hidden ${
          isCollapsed ? "w-16" : "w-80 lg:w-96"
        }`}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <h3 className="text-base font-semibold text-gray-900">
                Progress
              </h3>
            )}
            <motion.button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isCollapsed ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Sidebar Content - Fixed height, no scroll */}
        <div className="p-3 h-full flex flex-col">
          {!isCollapsed ? (
            <div className="flex-1 flex flex-col">
              <CollectedInfo
                collectedInfo={collectedInfo}
                completionStatus={completionStatus}
                className="flex-1"
              />
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col items-center pt-4">
              {/* Collapsed Progress Indicator */}
              <motion.div
                className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
              >
                <span className="text-primary-600 font-semibold text-xs">
                  {completionStatus.collected_count || 0}
                </span>
              </motion.div>

              {/* Completion Status Icon */}
              <motion.div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  completionStatus.is_complete
                    ? "bg-green-100 text-green-600"
                    : "bg-orange-100 text-orange-600"
                }`}
                whileHover={{ scale: 1.1 }}
              >
                <CheckCircle className="w-3 h-3" />
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatInterface;
