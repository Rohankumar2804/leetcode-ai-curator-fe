import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';

const AuthContainer = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    const authError = localStorage.getItem('authError');
    if (authError) {
      setGlobalError(authError);
      localStorage.removeItem('authError'); // Clear the error after displaying it
    }
  }, []);
  
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
      {globalError && (
        <div className="absolute top-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md" role="alert">
          <span className="block sm:inline">{globalError}</span>
        </div>
      )}
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
