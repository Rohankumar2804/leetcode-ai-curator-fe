import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';

import { register } from '../../services/api';

const RegistrationForm = ({ onRegistrationSuccess, onToggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (registrationComplete) {
      const timer = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      const redirectTimer = setTimeout(() => {
        onToggleForm(true); // Switch to login form
      }, 5000);

      return () => {
        clearInterval(timer);
        clearTimeout(redirectTimer);
      };
    }
  }, [registrationComplete, onToggleForm]);

  const passwordValidation = {
    minLength: password.length >= 8,
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    passwordsMatch: password === confirmPassword && confirmPassword !== '',
  };

  const isPasswordValid =
    passwordValidation.minLength &&
    passwordValidation.hasNumber &&
    passwordValidation.hasSpecialChar;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (!passwordValidation.passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await register(email, password);
      if (response.status === 200) {
        setRegistrationComplete(true);
        onRegistrationSuccess(); // Notify parent component
      } else {
        setError(response.data.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during registration. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Sent!</h2>
        <p className="text-gray-600 mb-6">
          Please check your inbox for a verification link to activate your account.
        </p>
        <p className="text-gray-500 text-sm">
          You will be redirected to the login page in {countdown} seconds...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Account</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="mt-2 text-sm text-gray-600">
          <p className="flex items-center">
            {passwordValidation.minLength ? (
              <FaCheckCircle className="text-green-500 mr-2" />
            ) : (
              <FaTimesCircle className="text-red-500 mr-2" />
            )}
            Minimum 8 characters
          </p>
          <p className="flex items-center">
            {passwordValidation.hasNumber ? (
              <FaCheckCircle className="text-green-500 mr-2" />
            ) : (
              <FaTimesCircle className="text-red-500 mr-2" />
            )}
            At least 1 number
          </p>
          <p className="flex items-center">
            {passwordValidation.hasSpecialChar ? (
              <FaCheckCircle className="text-green-500 mr-2" />
            ) : (
              <FaTimesCircle className="text-red-500 mr-2" />
            )}
            At least 1 special character
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {confirmPassword !== '' && (
          <p className={`text-sm mt-1 flex items-center ${passwordValidation.passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
            {passwordValidation.passwordsMatch ? (
              <FaCheckCircle className="mr-1" />
            ) : (
              <FaTimesCircle className="mr-1" />
            )}
            Passwords {passwordValidation.passwordsMatch ? 'match' : 'do not match'}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner color="text-white" /> : 'Register'}
        </button>
      </div>
      <p className="text-center text-gray-600 text-sm mt-4">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onToggleForm(true)}
          className="text-blue-600 hover:text-blue-800 font-bold focus:outline-none"
        >
          Sign In
        </button>
      </p>
    </form>
  );
};

export default RegistrationForm;
