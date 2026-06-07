import { useEffect, useRef } from "react";
import "./app.css";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import LoadingPage from "./components/auth/LoadingPage";
import ChatLayout from "./components/chat/ChatLayout";
import { loadConfig } from "./logic/user/userLoadUp";
import { addHandlers, editAuthStatus } from "./logic/active/actWebsocket";
import { AppUser } from "./logic/states/userMainStates";
import { AppState, Authorized } from "./logic/states/appCommonStates";
import { MessageStatus } from "./logic/active/actTypes";
function App() {
  const { appState, setAppState } = AppState();
  const { currentUser, setUserData } = AppUser();
  const { setState } = Authorized();

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

  async function defAuthStatus(request: any) {
    if (request.status == MessageStatus.Approved) {
      editAuthStatus(true);
      setState(true);
    }
  }

  const handlersRef = useRef({
    auth: defAuthStatus,
    // notifications: (req: any) => { ... },
  });

  // Initialize app state after brief loading
  if (currentUser) {
    return <ChatLayout />;
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
