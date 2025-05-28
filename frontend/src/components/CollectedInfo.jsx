import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  Clock,
  Building2,
  Award,
} from "lucide-react";

const CollectedInfo = ({
  collectedInfo = {},
  completionStatus = {},
  className = "",
}) => {
  const fields = [
    {
      key: "U1",
      label: "First University",
      icon: Building2,
      placeholder: "Enter first university name...",
    },
    {
      key: "C1",
      label: "First Course",
      icon: BookOpen,
      placeholder: "Enter first course name...",
    },
    {
      key: "U2",
      label: "Second University",
      icon: GraduationCap,
      placeholder: "Enter second university name...",
    },
    {
      key: "C2",
      label: "Second Course",
      icon: Award,
      placeholder: "Enter second course name...",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const progressPercentage = completionStatus.total_required
    ? (completionStatus.collected_count / completionStatus.total_required) * 100
    : 0;

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-soft border border-gray-100 p-4 h-full flex flex-col ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header - Compact */}
      <motion.div
        className="flex items-center justify-between mb-4"
        variants={itemVariants}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Information Collection
            </h3>
            <p className="text-xs text-gray-500">
              {completionStatus.collected_count || 0} of{" "}
              {completionStatus.total_required || 4} completed
            </p>
          </div>
        </div>

        <motion.div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            completionStatus.is_complete
              ? "bg-green-100 text-green-600"
              : "bg-orange-100 text-orange-600"
          }`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {completionStatus.is_complete ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
        </motion.div>
      </motion.div>

      {/* Progress Bar - Compact */}
      <motion.div className="mb-4" variants={itemVariants}>
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-blue-500 h-1.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Information Fields - Compact, fixed height */}
      <motion.div
        className="space-y-2 flex-shrink-0"
        variants={containerVariants}
      >
        <AnimatePresence>
          {fields.map((field, index) => {
            const value = collectedInfo[field.key];
            const isCollected = Boolean(value);
            const Icon = field.icon;

            return (
              <motion.div
                key={field.key}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  isCollected
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center space-x-2">
                  <motion.div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isCollected
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-200 text-gray-400"
                    }`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-3 h-3" />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-gray-900">
                        {field.label}
                      </h4>
                      {isCollected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                            delay: 0.2,
                          }}
                        >
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        </motion.div>
                      )}
                    </div>

                    <div className="text-xs mt-0.5">
                      {isCollected ? (
                        <motion.span
                          className="text-gray-800 font-medium break-words"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {value}
                        </motion.span>
                      ) : (
                        <span className="text-gray-400 italic">Pending...</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Bottom section - Fixed at bottom, compact */}
      <div className="mt-3 space-y-2 flex-shrink-0">
        {/* Next Field Indicator */}
        {!completionStatus.is_complete && completionStatus.next_field && (
          <motion.div
            className="p-2 bg-blue-50 rounded-lg border border-blue-200"
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <span className="text-xs font-medium text-blue-900">
                Next: {completionStatus.next_field}
              </span>
            </div>
          </motion.div>
        )}

        {/* Completion Message */}
        {completionStatus.is_complete && (
          <motion.div
            className="p-2 bg-green-50 rounded-lg border border-green-200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: 0.3,
            }}
          >
            <div className="flex items-center space-x-2 mb-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-900">
                All information collected!
              </span>
            </div>
            <motion.div
              className="text-xs text-green-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              You can now ask questions about your pathway.
            </motion.div>
          </motion.div>
        )}

        {/* Summary Section (when complete) - More compact */}
        {completionStatus.is_complete && (
          <motion.div
            className="p-2 bg-gray-50 rounded-lg border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h4 className="text-xs font-semibold text-gray-900 mb-1">
              Pathway Summary
            </h4>
            <div className="space-y-0.5 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>From:</span>
                <span className="font-medium text-gray-800 text-right flex-1 ml-2 break-words">
                  {collectedInfo.U1} • {collectedInfo.C1}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>To:</span>
                <span className="font-medium text-gray-800 text-right flex-1 ml-2 break-words">
                  {collectedInfo.U2} • {collectedInfo.C2}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CollectedInfo;
