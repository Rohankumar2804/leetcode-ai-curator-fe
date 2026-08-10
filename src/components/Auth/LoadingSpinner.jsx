import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const LoadingSpinner = ({ size = '1.5em', color = 'text-blue-500' }) => {
  return (
    <div className="flex items-center justify-center">
      <FaSpinner className={`animate-spin ${color}`} style={{ fontSize: size }} />
    </div>
  );
};

export default LoadingSpinner;
