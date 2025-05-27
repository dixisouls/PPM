import React, { useState, useEffect } from "react";
import "../styles/ProgressPanel.css";

const ProgressPanel = ({ collectedInfo, completionStatus }) => {
  const [animationStates, setAnimationStates] = useState({
    U1: false,
    C1: false,
    U2: false,
    C2: false,
  });

  const fields = [
    {
      key: "C2",
      label: "Second Course",
      icon: "📖",
      placeholder: "e.g., Computer Science 201",
    },
    {
      key: "U2",
      label: "Second University",
      icon: "🏛️",
      placeholder: "e.g., Stanford University",
    },
    {
      key: "C1",
      label: "First Course",
      icon: "📚",
      placeholder: "e.g., Mathematics 101",
    },
    {
      key: "U1",
      label: "First University",
      icon: "🎓",
      placeholder: "e.g., UC Berkeley",
    },
  ];

  // Trigger animations when data changes
  useEffect(() => {
    Object.keys(collectedInfo).forEach((key) => {
      if (collectedInfo[key] && !animationStates[key]) {
        setTimeout(() => {
          setAnimationStates((prev) => ({ ...prev, [key]: true }));
        }, 300);
      }
    });
  }, [collectedInfo, animationStates]);

  const getProgressHeight = () => {
    return (
      (completionStatus.collected_count / completionStatus.total_required) * 100
    );
  };

  const isFieldCollected = (fieldKey) => {
    return (
      collectedInfo[fieldKey] !== null && collectedInfo[fieldKey] !== undefined
    );
  };

  return (
    <div className="progress-panel">
      <div className="progress-header">
        <div className="header-content">
          <h2 className="panel-title">Course Collection</h2>
          <div className="progress-stats">
            <span className="collected-count">
              {completionStatus.collected_count}
            </span>
            <span className="total-count">
              / {completionStatus.total_required}
            </span>
          </div>
        </div>

        <div className="overall-progress">
          <div className="progress-label">Overall Progress</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${getProgressHeight()}%` }}
            ></div>
          </div>
          <div className="progress-percentage">
            {Math.round(getProgressHeight())}%
          </div>
        </div>
      </div>

      <div className="fields-container">
        <div className="fields-stack">
          {fields.map((field, index) => {
            const isCollected = isFieldCollected(field.key);
            const isAnimated = animationStates[field.key];

            return (
              <div
                key={field.key}
                className={`field-item ${
                  isCollected ? "collected" : "pending"
                } ${isAnimated ? "animated" : ""}`}
                style={{
                  "--animation-delay": `${index * 0.1}s`,
                }}
              >
                <div className="field-background">
                  <div className="field-content">
                    <div className="field-header">
                      <div className="field-icon">{field.icon}</div>
                      <div className="field-info">
                        <h3 className="field-label">{field.label}</h3>
                        <div className="field-status">
                          {isCollected ? (
                            <span className="status-collected">
                              ✓ Collected
                            </span>
                          ) : (
                            <span className="status-pending">⏳ Waiting</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="field-value">
                      {isCollected ? (
                        <div className="collected-value">
                          <span className="value-text">
                            {collectedInfo[field.key]}
                          </span>
                          <div className="collected-indicator">
                            <div className="check-mark">✓</div>
                          </div>
                        </div>
                      ) : (
                        <div className="placeholder-value">
                          {field.placeholder}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCollected && (
                    <div className="collection-overlay">
                      <div className="success-ripple"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="progress-visualization">
          <div className="progress-tower">
            <div
              className="tower-fill"
              style={{ height: `${getProgressHeight()}%` }}
            >
              <div className="fill-animation"></div>
            </div>
            <div className="tower-markers">
              {[25, 50, 75, 100].map((mark) => (
                <div
                  key={mark}
                  className={`marker ${
                    getProgressHeight() >= mark ? "reached" : ""
                  }`}
                  style={{ bottom: `${mark}%` }}
                >
                  <div className="marker-dot"></div>
                  <div className="marker-label">{mark}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {completionStatus.is_complete && (
        <div className="completion-celebration">
          <div className="celebration-content">
            <div className="celebration-icon">🎉</div>
            <h3>All Information Collected!</h3>
            <p>Your course pathway data is now complete.</p>
            <div className="confetti">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className={`confetti-piece piece-${i}`}></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!completionStatus.is_complete && completionStatus.next_field && (
        <div className="next-field-indicator">
          <div className="indicator-content">
            <span className="indicator-text">Next:</span>
            <span className="next-field-name">
              {completionStatus.next_field}
            </span>
          </div>
          <div className="indicator-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default ProgressPanel;
