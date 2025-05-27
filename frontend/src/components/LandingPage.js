import React, { useState, useEffect } from "react";
import { useApi } from "../contexts/ApiContext";
import "../styles/LandingPage.css";

const LandingPage = ({ onSessionStart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const api = useApi();

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleStartChat = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.createSession();
      onSessionStart(response.chat_id);
    } catch (err) {
      setError(
        "Failed to start chat session. Please ensure the backend server is running."
      );
      console.error("Error starting chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-background">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>

      <div className={`landing-container ${isVisible ? "visible" : ""}`}>
        <div className="landing-content">
          <div className="logo-section">
            <div className="logo-icon">🎓</div>
            <h1 className="app-title">
              <span className="title-gradient">PPM</span>
              <span className="title-subtitle">Course Advisor</span>
            </h1>
          </div>

          <div className="description-section">
            <p className="main-description">
              Your intelligent university course pathway mapper
            </p>
            <p className="subtitle-description">
              I'll help you collect and organize information about your
              university courses to create the perfect academic pathway.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏛️</div>
              <h3>University Mapping</h3>
              <p>Track courses across multiple institutions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Course Analysis</h3>
              <p>Intelligent course comparison and recommendations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Pathway Planning</h3>
              <p>Visualize your academic journey</p>
            </div>
          </div>

          <div className="action-section">
            <button
              className={`start-button ${isLoading ? "loading" : ""}`}
              onClick={handleStartChat}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="button-spinner"></div>
                  <span>Initializing...</span>
                </>
              ) : (
                <>
                  <span>Start Your Journey</span>
                  <div className="button-arrow">→</div>
                </>
              )}
            </button>

            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
