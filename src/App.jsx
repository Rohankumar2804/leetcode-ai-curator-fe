import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContainer from './components/Auth/AuthContainer';
import EmailVerification from './components/Auth/EmailVerification';
import Dashboard from './services/Dashboard';
import DashboardHome from './services/DashboardHome';
import AIEvaluator from './services/AIEvaluator';
import AIRecommendations from './services/AIRecommendations';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('jwtToken');
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthContainer />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="evaluator" element={<AIEvaluator />} />
          <Route path="recommendations" element={<AIRecommendations />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
