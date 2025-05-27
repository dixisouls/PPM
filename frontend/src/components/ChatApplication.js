import React, { useState, useEffect, useRef } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";
import ProgressTracker from "./ProgressTracker";
import "./ChatApplication.css";

const ChatApplication = () => {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const apiCall = async (url, options = {}) => {
    const baseUrl = "http://localhost:8000";
    const response = await fetch(`${baseUrl}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const startNewChat = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall("/api/chat/sessions", {
        method: "POST",
      });

      setChatId(response.chat_id);
      setIsConnected(true);
      setMessages([
        {
          id: "1",
          type: "assistant",
          content: response.message,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Reset collected info and completion status
      setCollectedInfo({
        U1: null,
        C1: null,
        U2: null,
        C2: null,
      });
      setCompletionStatus({
        is_complete: false,
        collected_count: 0,
        total_required: 4,
        next_field: "First university name",
      });
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start chat. Make sure the backend server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const endChat = async () => {
    if (!chatId) return;

    try {
      setIsLoading(true);
      await apiCall(`/api/chat/sessions/${chatId}`, {
        method: "DELETE",
      });

      setChatId(null);
      setIsConnected(false);
      setMessages([]);
      setCollectedInfo({
        U1: null,
        C1: null,
        U2: null,
        C2: null,
      });
      setCompletionStatus({
        is_complete: false,
        collected_count: 0,
        total_required: 4,
        next_field: null,
      });
    } catch (error) {
      console.error("Error ending chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText) => {
    if (!chatId || !messageText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiCall(`/api/chat/sessions/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: messageText.trim() }),
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.response,
        timestamp: new Date().toISOString(),
        is_cached: response.is_cached,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update collected info and completion status
      await updateCollectedInfo();
      await updateCompletionStatus();
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "error",
        content: "Failed to send message. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCollectedInfo = async () => {
    if (!chatId) return;

    try {
      const response = await apiCall(`/api/chat/sessions/${chatId}/info`);
      setCollectedInfo(response.collected_info);
    } catch (error) {
      console.error("Error updating collected info:", error);
    }
  };

  const updateCompletionStatus = async () => {
    if (!chatId) return;

    try {
      const response = await apiCall(`/api/chat/sessions/${chatId}/completion`);
      setCompletionStatus(response);
    } catch (error) {
      console.error("Error updating completion status:", error);
    }
  };

  return (
    <div className="chat-application">
      <ChatHeader
        isConnected={isConnected}
        chatId={chatId}
        onStartChat={startNewChat}
        onEndChat={endChat}
        isLoading={isLoading}
      />

      <div className="chat-container">
        {isConnected && (
          <ProgressTracker
            collectedInfo={collectedInfo}
            completionStatus={completionStatus}
          />
        )}

        <div className="chat-content">
          <MessageList messages={messages} isLoading={isLoading} />
          <div ref={messagesEndRef} />
        </div>

        {isConnected && (
          <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
        )}
      </div>

      {!isConnected && (
        <div className="welcome-screen">
          <div className="welcome-content">
            <h1>University Course Advisor</h1>
            <p>
              I'll help you collect information about your university courses.
            </p>
            <button
              onClick={startNewChat}
              disabled={isLoading}
              className="start-chat-btn"
            >
              {isLoading ? "Starting..." : "Start New Chat"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApplication;
