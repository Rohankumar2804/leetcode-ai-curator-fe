import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

import { login } from '../../services/api';

const LoginForm = ({ onLoginSuccess, onToggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(email, password);
      if (response.data.access_token) {
        const jwtToken = response.data.access_token;
        localStorage.setItem('jwtToken', jwtToken);
        onLoginSuccess(jwtToken); // Notify parent component
        navigate('/dashboard'); // Redirect to dashboard
      } else {
        setError('Invalid email or password.');
      }
    } catch (err) {
        let errorMessage = 'An error occurred during login. Please try again.';
        if (err.response && err.response.data && typeof err.response.data.detail === 'string') {
            errorMessage = err.response.data.detail;
        } else if (err.message) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setIsLoading(true);
    try {
      // Simulate API call to resend verification email
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Resending verification email to:', email);
      setError('Verification email sent! Please check your inbox.');
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
      console.error('Resend verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Sign In</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
          {error.includes('unverified') && (
            <button
              type="button"
              onClick={handleResendVerification}
              className="text-blue-600 hover:text-blue-800 font-bold ml-2 focus:outline-none"
              disabled={isLoading}
            >
              Resend Verification Email
            </button>
          )}
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

      <div className="mb-6">
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
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner color="text-white" /> : 'Sign In'}
        </button>
      </div>
      <p className="text-center text-gray-600 text-sm mt-4">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => onToggleForm(false)}
          className="text-blue-600 hover:text-blue-800 font-bold focus:outline-none"
        >
          Create Account
        </button>
      </p>
    </form>
  );
};

export default LoginForm;
