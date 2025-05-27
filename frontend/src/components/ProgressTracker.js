import React from "react";
import "./ProgressTracker.css";

const ProgressTracker = ({ collectedInfo, completionStatus }) => {
  const fields = [
    { key: "U1", label: "First University", icon: "🏛️" },
    { key: "C1", label: "First Course", icon: "📚" },
    { key: "U2", label: "Second University", icon: "🎓" },
    { key: "C2", label: "Second Course", icon: "📖" },
  ];

  const progressPercentage =
    (completionStatus.collected_count / completionStatus.total_required) * 100;

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <h3>Information Collection Progress</h3>
        <span className="progress-text">
          {completionStatus.collected_count} of{" "}
          {completionStatus.total_required} completed
        </span>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="fields-grid">
        {fields.map((field) => {
          const isCollected = collectedInfo[field.key] !== null;
          const value = collectedInfo[field.key];

          return (
            <div
              key={field.key}
              className={`field-item ${isCollected ? "completed" : "pending"}`}
            >
              <div className="field-icon">{field.icon}</div>
              <div className="field-content">
                <div className="field-label">{field.label}</div>
                <div className="field-value">
                  {isCollected ? (
                    <span className="collected-value">{value}</span>
                  ) : (
                    <span className="pending-text">Pending...</span>
                  )}
                </div>
              </div>
              <div
                className={`field-status ${
                  isCollected ? "completed" : "pending"
                }`}
              >
                {isCollected ? "✓" : "○"}
              </div>
            </div>
          );
        })}
      </div>

      {completionStatus.next_field && (
        <div className="next-field-indicator">
          <span className="next-field-text">
            Next: <strong>{completionStatus.next_field}</strong>
          </span>
        </div>
      )}

      {completionStatus.is_complete && (
        <div className="completion-banner">
          <span className="completion-icon">🎉</span>
          <span className="completion-text">All information collected!</span>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
