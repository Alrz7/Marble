import { useState } from 'react';
import './app.css';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import LoadingPage from './components/auth/LoadingPage';
import ChatLayout from './components/chat/ChatLayout';

type AppState = 'loading' | 'login' | 'signup' | 'chat';

function App() {
  const [appState, setAppState] = useState<AppState>('chat');

  const handleLoginSuccess = () => {
    setAppState('chat');
  };

  const handleSignupSuccess = () => {
    setAppState('chat');
  };

  const handleGoToSignup = () => {
    setAppState('signup');
  };

  const handleGoToLogin = () => {
    setAppState('login');
  };

  const handleLogout = () => {
    setAppState('login');
  };

  // Initialize app state after brief loading
  if (appState === 'loading') {
    return (
      <LoadingPage
        onLoadComplete={() => setAppState('login')}
      />
    );
  }

  if (appState === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoToSignup={handleGoToSignup}
      />
    );
  }

  if (appState === 'signup') {
    return (
      <SignupPage
        onSignupSuccess={handleSignupSuccess}
        onGoToLogin={handleGoToLogin}
      />
    );
  }

  return (
    <ChatLayout
      onLogout={handleLogout}
    />
  );
}

export default App;
