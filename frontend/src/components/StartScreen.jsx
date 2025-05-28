import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";
import { healthCheck } from "../services/api";

const StartScreen = ({ onStartChat, className = "" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const isHealthy = await healthCheck();
      setServerStatus(isHealthy ? "online" : "offline");
    } catch (error) {
      setServerStatus("offline");
    }
  };

  const handleStartChat = async () => {
    setIsLoading(true);
    try {
      await onStartChat();
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <motion.div
      className={`min-h-screen flex items-center justify-center p-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-md w-full text-center">
        {/* Title */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-8 gradient-text"
          variants={itemVariants}
        >
          Ollama Chat
        </motion.h1>

        {/* Start Button */}
        <motion.div className="space-y-4" variants={itemVariants}>
          <motion.button
            onClick={handleStartChat}
            disabled={isLoading || serverStatus === "offline"}
            className={`inline-flex items-center space-x-3 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 ${
              serverStatus === "offline"
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "btn-primary"
            }`}
            whileHover={
              serverStatus !== "offline"
                ? {
                    scale: 1.05,
                    boxShadow: "0 10px 40px -10px rgba(14, 165, 233, 0.4)",
                  }
                : {}
            }
            whileTap={serverStatus !== "offline" ? { scale: 0.98 } : {}}
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <MessageCircle className="w-6 h-6" />
                </motion.div>
                <span>Starting Chat...</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-6 h-6" />
                <span>Start Chat</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          {/* Server Status */}
          <motion.div
            className="flex items-center justify-center space-x-2 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                serverStatus === "online"
                  ? "bg-green-500"
                  : serverStatus === "offline"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            />
            <span className="text-gray-500">
              {serverStatus === "online"
                ? "Server Online"
                : serverStatus === "offline"
                ? "Server Offline - Please check backend"
                : "Checking Server..."}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StartScreen;
