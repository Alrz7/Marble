// App.tsx
import { useEffect, useState } from "react";
import ChatLayout from "./components/chatlayout";
import Login from "./components/login";
import SignUp from "./components/signUp";
import "./App.css";
import LoadingPage from "./components/loadingPage";
import { User, auth } from "./logic/internal/commonTtypes";
import { loadConfig } from "./logic/auth/authMain";
import { logOut } from "./logic/auth/login";
export default function App() {
  const [loadingPage, setLoadingPage] = useState<boolean>(true);
  const [user, setUserData] = useState<User | null>(null);
  const [authPage, setAuthPage] = useState<auth>("login");

  useEffect(() => {
    async function load() {
      const userData = await loadConfig();
      if (userData) {
        setUserData(userData);
      }
      setLoadingPage(false);
    }
    load();
  }, []);

  const handleBack = () => {
    logOut(setUserData);
  };

  return (
    <div className="chat-app">
      {user && !loadingPage ? (
        <ChatLayout user={user} onBack={handleBack} />
      ) : loadingPage ? (
        <LoadingPage />
      ) : authPage == "login" ? (
        <Login setAuth={setAuthPage} setUserData={setUserData} />
      ) : authPage == "signup" ? (
        <SignUp setAuth={setAuthPage} setUserData={setUserData} />
      ) : (
        ""
      )}
    </div>
  );
}
