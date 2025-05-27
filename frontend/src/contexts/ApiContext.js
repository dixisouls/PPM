import React, { createContext, useContext } from "react";

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const BASE_URL = "http://localhost:8000";

  const apiCall = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  };

  const api = {
    // Chat session management
    createSession: () => apiCall("/api/chat/sessions", { method: "POST" }),

    endSession: (chatId) =>
      apiCall(`/api/chat/sessions/${chatId}`, { method: "DELETE" }),

    // Messages
    sendMessage: (chatId, message) =>
      apiCall(`/api/chat/sessions/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),

    getHistory: (chatId) => apiCall(`/api/chat/sessions/${chatId}/messages`),

    // Progress tracking
    getCollectedInfo: (chatId) => apiCall(`/api/chat/sessions/${chatId}/info`),

    getCompletionStatus: (chatId) =>
      apiCall(`/api/chat/sessions/${chatId}/completion`),

    // Search
    searchSimilar: (chatId, query, limit = 1) =>
      apiCall(`/api/chat/sessions/${chatId}/search`, {
        method: "POST",
        body: JSON.stringify({ query, limit }),
      }),
  };

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
};
