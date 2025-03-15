import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FaSignInAlt } from "react-icons/fa";
import './User.css';
import Navigation from './InUser/Navigation/Navigation';
import Home from './InUser/Home/Home';
import Hairstyle from './InUser/Haircuts/Hairstyle';
import Profile from './InUser/Profile/Profile';
import Scanner from './InUser/Scanner/Scanner';
import Recommended from './InUser/Recommended/Recommended';
import EditProfile from './InUser/EditProfile/EditProfile';
import ChangePassword from './InUser/ChangePassword/ChangePassword';
import ScannerTutorial from './InUser/ScannerTutorial/ScannerTutorial';
import ProtectedRoute from './ProtectedRoute';

const User: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('userData');

  return (
    <div className="user-dashboard">
      {!isLoggedIn && (
        <div className="user-mobile-login">
          <button onClick={() => navigate('/login')}>
            <FaSignInAlt />
            <span>Login</span>
          </button>
        </div>
      )}
      <Navigation />
      <div className="user-content">
        <Routes>
          <Route path="/" element={<Navigate to="/user/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/haircuts" element={<Hairstyle />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/scanner-tutorial" element={<ScannerTutorial />} />
          <Route path="/recommended" element={<Recommended />} />
          <Route path="/profile/edit" element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } />
          <Route path="/profile/change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default User;