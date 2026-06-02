import { useEffect, useRef } from "react";
import "./app.css";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import LoadingPage from "./components/auth/LoadingPage";
import ChatLayout from "./components/chat/ChatLayout";
import { loadConfig } from "./logic/user/userLoadUp";
import { addHandlers } from "./logic/active/actWebsocket";
import { logOut } from "./logic/auth/login";
import { AppUser } from "./logic/states/userMainStates";
import { AppState } from "./logic/states/appCommonStates";

function App() {
  const { appState, setAppState } = AppState();
  const { currentUser, setUserData } = AppUser();
  const handleLogout = () => {
    logOut(setUserData);
    setAppState("login");
  };

  useEffect(() => {
    async function hndlAutoLogin() {
      const userData = await loadConfig();
      if (userData) {
        setUserData(userData);
        addHandlers(handlersRef.current);
      }
    }
    hndlAutoLogin();
  }, []);

  const handlersRef = useRef({
    // notifications: (req: any) => { ... },
  });

  // Initialize app state after brief loading
  if (currentUser) {
    return <ChatLayout onLogout={handleLogout} />;
  } else {
    switch (appState) {
      case "loading":
        return <LoadingPage onLoadComplete={() => setAppState("login")} />;
      case "login":
        return (
          <LoginPage setAppState={setAppState} setUserData={setUserData} />
        );
      case "signup":
        return (
          <SignupPage setAppState={setAppState} setUserData={setUserData} />
        );
    }
  }
}

export default App;
