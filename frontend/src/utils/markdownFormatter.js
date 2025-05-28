import React from "react";

export const parseMarkdownText = (text) => {
  if (!text) return "";

  // Split by lines first to handle bullets properly
  const lines = text.split("\n");
  const elements = [];

  lines.forEach((line, lineIndex) => {
    if (line.trim() === "") {
      // Empty line - add line break
      elements.push(<br key={`br-${lineIndex}`} />);
      return;
    }

    // Check if line starts with bullet point
    const bulletMatch = line.match(/^(\s*)\*\s(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[2];

      elements.push(
        <div
          key={`bullet-${lineIndex}`}
          className={`flex items-start space-x-2 ${indent > 0 ? "ml-4" : ""}`}
        >
          <span className="text-primary-500 font-bold text-sm mt-0.5">•</span>
          <span className="flex-1">{formatInlineText(content)}</span>
        </div>
      );
    } else {
      // Regular line - process inline formatting
      const formattedLine = formatInlineText(line);
      elements.push(
        <div key={`line-${lineIndex}`} className="mb-1">
          {formattedLine}
        </div>
      );
    }
  });

  return elements;
};

/**
 * Format inline text elements (bold, etc.)
 */
const formatInlineText = (text) => {
  if (!text) return "";

  // Handle **bold** text
  const parts = [];
  let remainingText = text;
  let key = 0;

  while (remainingText) {
    const boldMatch = remainingText.match(/^(.*?)\*\*(.*?)\*\*(.*?)$/);

    if (boldMatch) {
      const [, before, bold, after] = boldMatch;

      // Add text before bold
      if (before) {
        parts.push(<span key={`text-${key++}`}>{before}</span>);
      }

      // Add bold text
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold text-gray-900">
          {bold}
        </strong>
      );

      // Continue with remaining text
      remainingText = after;
    } else {
      // No more bold formatting, add remaining text
      parts.push(<span key={`text-${key++}`}>{remainingText}</span>);
      break;
    }
  }

  return parts.length > 1 ? parts : text;
};

/**
 * For typing animation - extract plain text from markdown
 */
export const extractPlainText = (markdownText) => {
  if (!markdownText) return "";

  return markdownText
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold markers
    .replace(/^\s*\*\s/gm, "• ") // Convert bullets to bullet points
    .replace(/\n\s*\n/g, "\n") // Clean up extra line breaks
    .trim();
};

/**
 * Custom hook for typing animation with markdown support
 */
export const useMarkdownTyping = (text, speed = 20, onComplete = () => {}) => {
  const [displayedText, setDisplayedText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isComplete, setIsComplete] = React.useState(false);

  // Extract plain text for typing
  const plainText = React.useMemo(() => extractPlainText(text), [text]);

  React.useEffect(() => {
    if (currentIndex < plainText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(plainText.slice(0, currentIndex + 1));
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (!isComplete && plainText.length > 0) {
      setIsComplete(true);
      onComplete();
    }
  }, [currentIndex, plainText, speed, onComplete, isComplete]);

  // Reset when text changes
  React.useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return { displayedText, isComplete };
};
