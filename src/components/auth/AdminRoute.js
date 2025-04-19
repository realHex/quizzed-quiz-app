import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotAvailable from '../common/NotAvailable';

const AdminRoute = ({ children }) => {
  const { user, loading, userProfile, isAdmin } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but doesn't have admin role
  if (!isAdmin()) {
    return <NotAvailable featureName="Admin Feature" />;
  }

  return children;
};

export default AdminRoute;