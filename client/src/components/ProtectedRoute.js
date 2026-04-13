import React from 'react';
import { Navigate } from 'react-router-dom';

// Blocks access to pages if not logged in or wrong role
const ProtectedRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem('smartpark_token');
    const user = JSON.parse(localStorage.getItem('smartpark_user') || 'null');

    // Not logged in → redirect to login
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // Wrong role → redirect to their correct page
    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
    }

    return children;
};

export default ProtectedRoute;