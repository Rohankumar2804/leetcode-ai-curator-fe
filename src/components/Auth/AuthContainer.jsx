import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';

const AuthContainer = () => {
  const [isSignIn, setIsSignIn] = useState(true);

  const handleLoginSuccess = (token) => {
    console.log('Login successful, token:', token);
    // In a real app, you might set a global state here
    // For now, redirection is handled within LoginForm
  };

  const handleRegistrationSuccess = () => {
    // After successful registration, automatically switch to sign-in form
    setIsSignIn(true);
  };

  const handleToggleForm = (signIn) => {
    setIsSignIn(signIn);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isSignIn ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} onToggleForm={handleToggleForm} />
        ) : (
          <RegistrationForm onRegistrationSuccess={handleRegistrationSuccess} onToggleForm={handleToggleForm} />
        )}
      </div>
    </div>
  );
};

export default AuthContainer;
