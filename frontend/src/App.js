import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import ChatInterface from "./components/ChatInterface";
import { ApiProvider } from "./contexts/ApiContext";
import "./styles/App.css";

function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [chatId, setChatId] = useState(null);

  const handleSessionStart = (newChatId) => {
    setChatId(newChatId);
    setIsSessionActive(true);
  };

  const handleSessionEnd = () => {
    setIsSessionActive(false);
    setChatId(null);
  };

  return (
    <ApiProvider>
      <div className="app">
        {!isSessionActive ? (
          <LandingPage onSessionStart={handleSessionStart} />
        ) : (
          <ChatInterface chatId={chatId} onSessionEnd={handleSessionEnd} />
        )}
      </div>
    </ApiProvider>
  );
}

export default App;
