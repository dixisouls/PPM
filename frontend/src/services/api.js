import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to: ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Response error:", error);

    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Request timeout. Please check your connection and try again."
      );
    }

    if (!error.response) {
      throw new Error(
        "Network error. Please check if the backend server is running."
      );
    }

    const message =
      error.response?.data?.detail ||
      error.message ||
      "An unexpected error occurred";
    throw new Error(message);
  }
);

// API Methods
export const chatAPI = {
  // Create new chat session
  createSession: async () => {
    try {
      const response = await api.post("/chat/sessions");
      return response.data;
    } catch (error) {
      console.error("Failed to create chat session:", error);
      throw error;
    }
  },

  // Send message to chat
  sendMessage: async (chatId, message) => {
    try {
      const response = await api.post(`/chat/sessions/${chatId}/messages`, {
        message: message.trim(),
      });
      return response.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  },

  // Get conversation history
  getHistory: async (chatId) => {
    try {
      const response = await api.get(`/chat/sessions/${chatId}/messages`);
      return response.data;
    } catch (error) {
      console.error("Failed to get conversation history:", error);
      throw error;
    }
  },

  // Get collected information
  getCollectedInfo: async (chatId) => {
    try {
      const response = await api.get(`/chat/sessions/${chatId}/info`);
      return response.data;
    } catch (error) {
      console.error("Failed to get collected info:", error);
      throw error;
    }
  },

  // Get completion status
  getCompletionStatus: async (chatId) => {
    try {
      const response = await api.get(`/chat/sessions/${chatId}/completion`);
      return response.data;
    } catch (error) {
      console.error("Failed to get completion status:", error);
      throw error;
    }
  },

  // Search similar conversations
  searchSimilar: async (chatId, query, limit = 3) => {
    try {
      const response = await api.post(`/chat/sessions/${chatId}/search`, {
        query: query.trim(),
        limit,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to search similar conversations:", error);
      throw error;
    }
  },

  // Close chat session
  closeSession: async (chatId) => {
    try {
      const response = await api.delete(`/chat/sessions/${chatId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to close chat session:", error);
      throw error;
    }
  },

  // Get chat status
  getChatStatus: async (chatId) => {
    try {
      const response = await api.get(`/chat/sessions/${chatId}/status`);
      return response.data;
    } catch (error) {
      console.error("Failed to get chat status:", error);
      throw error;
    }
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
};

export default api;
