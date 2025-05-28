import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Sparkles,
  Users,
  Target,
} from "lucide-react";
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

  const features = [
    {
      icon: Target,
      title: "Smart Collection",
      description: "Efficiently gather university and course information",
    },
    {
      icon: Users,
      title: "Personalized Guidance",
      description: "Get tailored advice for your academic pathway",
    },
    {
      icon: Sparkles,
      title: "Intelligent Matching",
      description: "Find the best course combinations for your goals",
    },
  ];

  return (
    <motion.div
      className={`min-h-screen flex items-center justify-center p-6 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-4xl w-full">
        <div className="text-center">
          {/* Hero Section */}
          <motion.div className="mb-12" variants={itemVariants}>
            {/* Logo/Icon */}
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-large"
              whileHover={{
                scale: 1.05,
                rotate: [0, -10, 10, -10, 0],
                transition: { duration: 0.5 },
              }}
            >
              <GraduationCap className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-4"
              variants={itemVariants}
            >
              <span className="gradient-text">Program Pathways</span>
              <br />
              <span className="text-gray-900">Mapper</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              Your intelligent university course advisor assistant. Get
              personalized guidance for your academic journey.
            </motion.p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 mb-12"
            variants={itemVariants}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-2xl shadow-soft border border-gray-100"
                  whileHover={{
                    y: -5,
                    shadow: "0 10px 40px -10px rgba(0, 0, 0, 0.15)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

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
                  <span>Start Your Journey</span>
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

          {/* How it works */}
          <motion.div
            className="mt-16 pt-8 border-t border-gray-200"
            variants={itemVariants}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              How it works
            </h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              {[
                { step: 1, text: "Start a conversation" },
                { step: 2, text: "Share university info" },
                { step: 3, text: "Get personalized advice" },
                { step: 4, text: "Plan your pathway" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center space-y-2"
                  whileHover={{ y: -2 }}
                >
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                    {item.step}
                  </div>
                  <span className="text-gray-600 text-center">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default StartScreen;
