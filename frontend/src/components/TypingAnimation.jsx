import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const TypingAnimation = ({
  text,
  speed = 15, // Increased speed (reduced from 50 to 15)
  onComplete = () => {},
  className = "",
  showCursor = true,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete && text.length > 0) {
      setIsComplete(true);
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <motion.div
      className={`inline-block ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className="whitespace-pre-wrap">{displayedText}</span>
      {showCursor && (
        <motion.span
          className="inline-block w-0.5 h-5 bg-primary-500 ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{
            duration: 0.6,
            repeat: isComplete ? 0 : Infinity,
            repeatType: "reverse",
          }}
        />
      )}
    </motion.div>
  );
};

export default TypingAnimation;
