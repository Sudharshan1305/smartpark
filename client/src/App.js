import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import BookingDetails from './pages/BookingDetails';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/booking/:bookingId" element={<BookingDetails />} />

        {/* User */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>
        } />
        <Route path="/my-bookings" element={
          <ProtectedRoute allowedRole="user"><MyBookings /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;