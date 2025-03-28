import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaCut, FaUser, FaSignInAlt } from "react-icons/fa";
import './Navigation.css';

interface UserData {
  id: string;
  fullname: string;
  profile_picture?: string;  // Changed from profilePicture to match backend
}

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);

  const isLoggedIn = !!localStorage.getItem('userData');

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      setUserData(JSON.parse(storedData));
    }
  }, []);

  const fetchProfilePicture = useCallback(async () => {
    if (!userData?.id) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}user/${userData.id}`);
      const data = await response.json();
      if (data.profile_picture) {
        setProfilePicture(`${import.meta.env.VITE_BACKEND_URL}${data.profile_picture.replace(/^\//, '')}`);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  }, [userData?.id]);

  useEffect(() => {
    if (userData?.id) {
      fetchProfilePicture();
    }
  }, [userData?.id, fetchProfilePicture]);

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      setShowModal(true);
    } else {
      navigate('/user/profile');
    }
  };

  return (
    <>
      <nav className="navigation-inuser">
        <div className="navigation-inuser-brand">
          <img src="/LOGO1.png" alt="" />
        </div>
        <div className="navigation-inuser-links">
          <Link to="/user/home" className={location.pathname === '/user/home' ? 'active' : ''}>
            <span className="navigation-inuser-icon"><FaHome /></span>
            <span className="navigation-inuser-text">Home</span>
          </Link>
          <Link to="/user/haircuts" className={location.pathname === '/user/haircuts' ? 'active' : ''}>
            <span className="navigation-inuser-icon"><FaCut /></span>
            <span className="navigation-inuser-text">Hairstyles</span>
          </Link>

          <div
            className={`navigation-inuser-profile ${location.pathname === '/user/profile' ? 'active' : ''}`}
            onClick={handleProfileClick}
          >
            {isLoggedIn ? (
              <Link
                to="/user/profile"
                className={`navigation-inuser-info ${location.pathname === '/user/profile' ? 'active' : ''}`}
              >
                <div className="navigation-inuser-profile-container">
                  <span className="navigation-inuser-icon mobile-only"><FaUser /></span>
                  <div className="desktop-only profile-info-wrapper">
                    <div className="profile-image-wrapper">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt={userData?.fullname || 'Profile'}
                          className="navigation-inuser-picture"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/defaultProfile.png';
                          }}
                        />
                      ) : (
                        <div className="navigation-inuser-picture-placeholder">
                          {userData?.fullname?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="desktop-only navigation-inuser-fullname">
                      {userData?.fullname || 'User'}
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <>
                <span className="navigation-inuser-icon mobile-only"><FaUser /></span>
                <div className="navigation-inuser-login desktop-only">
                  <button onClick={() => navigate('/login')}>
                    <FaSignInAlt />
                    <span>Login</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {showModal && (
        <div className="navigation-inuser-modal-overlay">
          <div className="navigation-inuser-modal-content">
            <h3>Login Required</h3>
            <p>Please login or register to access your profile</p>
            <div className="navigation-inuser-modal-buttons">
              <button onClick={() => navigate('/login')}>Login</button>
              <button onClick={() => navigate('/register')}>Register</button>
            </div>
            <button className="navigation-inuser-modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
