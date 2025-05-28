import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StartScreen from "./components/StartScreen";
import ChatInterface from "./components/ChatInterface";
import { chatAPI } from "./services/api";
import "./App.css";

const App = () => {
  const [currentScreen, setCurrentScreen] = useState("start"); // 'start' | 'chat'
  const [chatSession, setChatSession] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chatSession?.chat_id) {
        chatAPI.closeSession(chatSession.chat_id).catch(console.error);
      }
    };
  }, [chatSession]);

  const handleStartChat = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await chatAPI.createSession();
      setChatSession(session);
      setCurrentScreen("chat");

      console.log("Chat session created:", session);
    } catch (error) {
      console.error("Failed to create chat session:", error);
      setError(error.message || "Failed to start chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndChat = async () => {
    try {
      if (chatSession?.chat_id) {
        await chatAPI.closeSession(chatSession.chat_id);
      }
    } catch (error) {
      console.error("Failed to close chat session:", error);
    } finally {
      setChatSession(null);
      setCurrentScreen("start");
      setError(null);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.95 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 1.05 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4,
  };

  return (
    <div className="App min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AnimatePresence mode="wait">
        {currentScreen === "start" && (
          <motion.div
            key="start"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="min-h-screen"
          >
            <StartScreen
              onStartChat={handleStartChat}
              error={error}
              isLoading={isLoading}
            />
          </motion.div>
        )}

        {currentScreen === "chat" && chatSession && (
          <motion.div
            key="chat"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="min-h-screen"
          >
            <ChatInterface
              chatId={chatSession.chat_id}
              onEndChat={handleEndChat}
              initialMessage={chatSession.message}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Error Toast */}
      <AnimatePresence>
        {error && currentScreen === "start" && (
          <motion.div
            className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-large z-50"
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-white hover:text-red-200 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && currentScreen === "start" && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-large"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="flex flex-col items-center space-y-4">
                <motion.div
                  className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-gray-700 font-medium">
                  Starting your chat session...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
