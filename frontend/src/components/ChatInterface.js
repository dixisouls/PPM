import React, { useState, useEffect, useRef } from "react";
import { useApi } from "../contexts/ApiContext";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ProgressPanel from "./ProgressPanel";
import "../styles/ChatInterface.css";

const ChatInterface = ({ chatId, onSessionEnd }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collectedInfo, setCollectedInfo] = useState({
    U1: null,
    C1: null,
    U2: null,
    C2: null,
  });
  const [completionStatus, setCompletionStatus] = useState({
    is_complete: false,
    collected_count: 0,
    total_required: 4,
    next_field: null,
  });
  const [isVisible, setIsVisible] = useState(false);

  const messagesEndRef = useRef(null);
  const api = useApi();

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Initial setup and welcome message
  useEffect(() => {
    if (chatId) {
      // Add welcome message
      const welcomeMessage = {
        id: "welcome",
        type: "assistant",
        content:
          "Hello! I'm your course advisor. To get started, please tell me the name of your current university.",
        timestamp: new Date().toISOString(),
        isWelcome: true,
      };
      setMessages([welcomeMessage]);

      // Load initial data
      loadCollectedInfo();
      loadCompletionStatus();
    }
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  const loadCollectedInfo = async () => {
    try {
      const response = await api.getCollectedInfo(chatId);
      setCollectedInfo(response.collected_info);
    } catch (error) {
      console.error("Error loading collected info:", error);
    }
  };

  const loadCompletionStatus = async () => {
    try {
      const response = await api.getCompletionStatus(chatId);
      setCompletionStatus(response);
    } catch (error) {
      console.error("Error loading completion status:", error);
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.sendMessage(chatId, messageText.trim());

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        isCached: response.is_cached,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update progress data
      await loadCollectedInfo();
      await loadCompletionStatus();
    } catch (error) {
      console.error("Error sending message:", error);

      const errorMessage = {
        id: `error-${Date.now()}`,
        type: "error",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    setIsLoading(true);
    try {
      await api.endSession(chatId);
      onSessionEnd();
    } catch (error) {
      console.error("Error ending session:", error);
      // Still end the session on frontend even if API call fails
      onSessionEnd();
    }
  };

  return (
    <div className={`chat-interface ${isVisible ? "visible" : ""}`}>
      <div className="chat-header">
        <div className="header-content">
          <div className="header-left">
            <div className="app-logo">
              <span className="logo-icon">🎓</span>
              <span className="logo-text">PPM Course Advisor</span>
            </div>
            <div className="session-info">
              <div className="status-indicator active"></div>
              <span className="session-id">
                Session: {chatId?.substring(0, 8)}
              </span>
            </div>
          </div>
          <button
            className="end-session-btn"
            onClick={handleEndSession}
            disabled={isLoading}
          >
            <span>End Session</span>
            <div className="btn-icon">✕</div>
          </button>
        </div>
      </div>

      <div className="chat-body">
        <div className="chat-main">
          <div className="messages-container">
            <MessageList messages={messages} isLoading={isLoading} />
            <div ref={messagesEndRef} />
          </div>

          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </div>

        <ProgressPanel
          collectedInfo={collectedInfo}
          completionStatus={completionStatus}
          onEndSession={handleEndSession}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
