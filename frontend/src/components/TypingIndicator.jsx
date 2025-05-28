import React from "react";
import { motion } from "framer-motion";

const TypingIndicator = ({ className = "" }) => {
  const dotVariants = {
    start: { y: 0 },
    end: { y: -10 },
  };

  const containerVariants = {
    start: { transition: { staggerChildren: 0.1 } },
    end: { transition: { staggerChildren: 0.1 } },
  };

  return (
    <motion.div
      className={`chat-bubble-assistant inline-flex items-center space-x-1 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-sm text-gray-500 mr-2">Assistant is typing</span>
      <motion.div
        className="flex space-x-1"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-primary-400 rounded-full"
            variants={dotVariants}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default TypingIndicator;
