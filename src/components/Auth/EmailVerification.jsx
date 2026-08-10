import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const EmailVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [verificationSuccessful, setVerificationSuccessful] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (!token) {
      setError('No verification token found.');
      setIsLoading(false);
      return;
    }

    const verifyEmail = async () => {
      setIsLoading(true);
      setError('');
      try {
        // Simulate API call to verify email
        await new Promise((resolve) => setTimeout(resolve, 3000));
        console.log('Verifying email with token:', token);

        // In a real app, you'd send this token to your backend
        // const response = await api.post('/verify-email', { token });
        // if (response.status === 200) {
        setVerificationSuccessful(true);
        // } else {
        //   setError(response.data.message || 'Email verification failed.');
        // }
      } catch (err) {
        setError('An error occurred during email verification. Please try again.');
        console.error('Email verification error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [location.search]);

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        {isLoading ? (
          <>
            <LoadingSpinner size="3em" color="text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-700 mt-4">
              Verifying your email with SmartPrep AI...
            </h2>
          </>
        ) : verificationSuccessful ? (
          <>
            <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Successful!</h2>
            <p className="text-gray-600 mb-6">Your email has been successfully verified.</p>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
            >
              Go to Login
            </button>
          </>
        ) : (
          <>
            <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error || 'Unable to verify your email.'}</p>
            <button
              onClick={handleGoToLogin}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
