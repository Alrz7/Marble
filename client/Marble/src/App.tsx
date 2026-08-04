import { useEffect, useState } from "react";
import "./app.css";
import SignupPage from "./components/auth/signUp/SignupMain";
import LoadingPage from "./components/auth/LoadingPage";
import ChatLayout from "./components/chat/ChatLayout";
import {
  getActiveUserAuthMethod,
  loadConfigByMethod,
} from "./logic/user/userLoadUp";
import { AppUser } from "./logic/states/stateUser";
import { AppState } from "./logic/states/stateCommon";
import LoginScreen from "./components/auth/login/LoginScreen";
import { commonErrors, err, errEdtMessage, ok } from "@internal/golog";
import DayilyLoginScreen from "./components/auth/dailyLogin/dailyLogin";
import { AuthMethod } from "@internal/intrCmnTypes";
function App() {
  const { appState, setAppState } = AppState();
  const { currentUser, setUserData } = AppUser();
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [actvUser_id, setActvUser_id] = useState<number | null>(null);

  useEffect(() => {
    async function hndlAutoLogin() {
      const actUserPartialData = await getActiveUserAuthMethod();
      if (!actUserPartialData.ok) {
        return err(actUserPartialData.error);
      } else if (actUserPartialData.value == null) {
        return err(
          errEdtMessage(commonErrors.userNotFound, "acrive User Not found"),
        );
      }
      if (actUserPartialData.value.method == "keychain") {
        const userData = await loadConfigByMethod(
          actUserPartialData.value.id,
          actUserPartialData.value.method,
        );
        if (!userData.ok) {
          return err(userData.error);
        } else {
          setUserData(userData.value);
        }
      } else {
        setAuthMethod(actUserPartialData.value.method);
        setActvUser_id(actUserPartialData.value.id);
        setAppState("dayilyLogin");
      }
      return ok(undefined);
    }
    hndlAutoLogin();
  }, []);

  // Initialize app state after brief loading
  if (currentUser) {
    return <ChatLayout />;
  } else {
    switch (appState) {
      case "loading":
        return <LoadingPage onLoadComplete={() => setAppState("login")} />;
      case "dayilyLogin":
        if (authMethod && actvUser_id != null)
          return (
            <DayilyLoginScreen authMethod={authMethod} user_id={actvUser_id} />
          );
        return;
      case "login":
        return <LoginScreen setAppState={setAppState} />;
      case "signup":
        return (
          <SignupPage setAppState={setAppState} setUserData={setUserData} />
        );
    }
  }
}

export default App;
