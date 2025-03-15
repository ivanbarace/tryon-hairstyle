import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';
import './Profile.css';
import { FaCog, FaHeart } from 'react-icons/fa';

interface UserData {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  profilePicture?: string;
  createdAt: string;
}

interface FavoriteHairstyle {
  hairstyle_id: number;
  hairstyle_name: string;
  hairstyle_picture: string;
  faceshape: string;
  hairtype: string;
  hair_length: string;
  description: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteHairstyle[]>([]);
  const [showHairstyleModal, setShowHairstyleModal] = useState(false);
  const [selectedHairstyle, setSelectedHairstyle] = useState<FavoriteHairstyle | null>(null);
  const [activeSection, setActiveSection] = useState<'favorites' | 'tryon'>('favorites');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchUserData = useCallback(async () => {
    const storedUserData = localStorage.getItem('userData');
    if (!storedUserData) return;

    const parsedData = JSON.parse(storedUserData);
    try {
      const response = await fetch(`http://localhost:5000/user/${parsedData.id}`);
      if (!response.ok) throw new Error('Failed to fetch user details');

      const data = await response.json();
      const newUserData = {
        id: data.user_id,
        username: data.username,
        fullname: data.fullname,
        email: data.email,
        role: data.role,
        profilePicture: data.profile_picture,
        createdAt: data.created_at,
      };
      setUserData(newUserData);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!userData?.id) return;

    try {
      const response = await axios.get(`http://localhost:5000/favorites/details/${userData.id}`);
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, [userData?.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (userData?.id) {
      fetchFavorites();
    }
  }, [userData?.id, fetchFavorites]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setIsSettingsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleHairstyleClick = (hairstyle: FavoriteHairstyle) => {
    setSelectedHairstyle(hairstyle);
    setShowHairstyleModal(true);
  };

  const handleFavoriteClick = async (hairstyleId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userData?.id) {
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/favorites', {
        user_id: userData.id,
        hairstyle_id: hairstyleId
      });

      // Update favorites state to remove the unfavorited hairstyle
      if (!response.data.isFavorite) {
        setFavorites(prev => prev.filter(h => h.hairstyle_id !== hairstyleId));
      }

      // Update selectedHairstyle if it's the one being modified
      if (selectedHairstyle && selectedHairstyle.hairstyle_id === hairstyleId) {
        setSelectedHairstyle(null);
        setShowHairstyleModal(false);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handlePrevHairstyle = () => {
    if (selectedHairstyle) {
      const currentIndex = favorites.findIndex(
        (h) => h.hairstyle_id === selectedHairstyle.hairstyle_id
      );
      const prevIndex = (currentIndex - 1 + favorites.length) % favorites.length;
      setSelectedHairstyle(favorites[prevIndex]);
    }
  };

  const handleNextHairstyle = () => {
    if (selectedHairstyle) {
      const currentIndex = favorites.findIndex(
        (h) => h.hairstyle_id === selectedHairstyle.hairstyle_id
      );
      const nextIndex = (currentIndex + 1) % favorites.length;
      setSelectedHairstyle(favorites[nextIndex]);
    }
  };

  if (!userData) {
    return <LoadingAnimation />;
  }

  return (
    <div className="container-inprofilescreen">
      <button
        className="settings-button-inprofilescreen"
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        title="Open Settings"
      >
        <FaCog />
      </button>

      {isSettingsOpen && (
        <div className="settings-modal-inprofilescreen">
          <div className="settings-options-inprofilescreen">
            <button
              className="settings-option-inprofilescreen"
              onClick={() => navigate('/user/profile/edit')}
            >
              Edit Profile
            </button>
            <button
              className="settings-option-inprofilescreen"
              onClick={() => navigate('/user/profile/change-password')}
            >
              Change Password
            </button>
            <button
              className="settings-option-inprofilescreen"
              onClick={handleLogoutClick}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="logout-modal-buttons">
              <button className="confirm-logout-btn" onClick={handleLogout}>Yes</button>
              <button className="cancel-logout-btn" onClick={() => setShowLogoutModal(false)}>No</button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-card-inprofilescreen">
        <div className="profile-info-inprofilescreen">
          <div className="profile-picture-container-inprofilescreen">
            {userData.profilePicture ? (
              <img
                src={`http://${window.location.hostname}:5000/${userData.profilePicture}`}
                alt="Profile"
                className="profile-picture-inprofilescreen"
              />
            ) : (
              <div className="profile-picture-inprofilescreen">
                {userData.fullname.charAt(0)}
              </div>
            )}
          </div>
          <div className="profile-details-inprofilescreen">
            <div className="info-group-inprofilescreen fullname-row">
              <label>Full Name</label>
              <div className="name-with-username">
                <p>{userData.fullname}</p>
                <span className="username-tag">@{userData.username}</span>
              </div>
            </div>
            <div className="info-group-inprofilescreen">
              <label>Email</label>
              <p>{userData.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="section-toggle-buttons">
        <button
          className={`toggle-button ${activeSection === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveSection('favorites')}
        >
          My Favorites
        </button>
        <button
          className={`toggle-button ${activeSection === 'tryon' ? 'active' : ''}`}
          onClick={() => setActiveSection('tryon')}
        >
          Saved Try-On
        </button>
      </div>

      {activeSection === 'favorites' ? (
        <div className="favorites-section-inprofilescreen">
          <h2>My Favorite Hairstyles</h2>
          <div className="favorites-grid-inprofilescreen">
            {favorites.length === 0 ? (
              <p className="no-favorites-inprofilescreen">No favorite hairstyles yet.</p>
            ) : (
              favorites.map((hairstyle) => (
                <div
                  key={hairstyle.hairstyle_id}
                  className="favorite-card-inprofilescreen"
                  onClick={() => handleHairstyleClick(hairstyle)}
                >
                  <img
                    src={`http://localhost:5000${hairstyle.hairstyle_picture}`}
                    alt={hairstyle.hairstyle_name}
                    className="favorite-image-inprofilescreen"
                  />
                  <button
                    className="favorite-button-inprofilescreen is-favorite"
                    onClick={(e) => handleFavoriteClick(hairstyle.hairstyle_id, e)}
                    title="Remove from favorites"
                  >
                    <FaHeart />
                  </button>
                  <div className="favorite-name-inprofilescreen">{hairstyle.hairstyle_name}</div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="tryon-section-inprofilescreen">
          <h2>SAVED TRY ON HAIRSTYLES</h2>
          <div className="tryon-grid-inprofilescreen">
            <p className="no-tryon-inprofilescreen">No saved try-on hairstyles yet.</p>
          </div>
        </div>
      )}

      {showHairstyleModal && selectedHairstyle && (
        <div className="hairstyle-modal-inprofilescreen">
          <div className="hairstyle-modal-content-inprofilescreen">
            <button
              className="close-button-inprofilescreen"
              onClick={() => setShowHairstyleModal(false)}
            >
              ×
            </button>
            <button
              className="nav-button-inprofilescreen prev"
              onClick={handlePrevHairstyle}
            >
              ‹
            </button>
            <button
              className="nav-button-inprofilescreen next"
              onClick={handleNextHairstyle}
            >
              ›
            </button>
            <div className="hairstyle-modal-image-inprofilescreen">
              <img
                src={`http://localhost:5000${selectedHairstyle.hairstyle_picture}`}
                alt={selectedHairstyle.hairstyle_name}
              />
            </div>
            <div className="hairstyle-modal-info-inprofilescreen">
              <h2>{selectedHairstyle.hairstyle_name}</h2>
              <div className="info-grid-inprofilescreen">
                <div className="info-item-inprofilescreen">
                  <strong>Face Shape:</strong> {selectedHairstyle.faceshape}
                </div>
                <div className="info-item-inprofilescreen">
                  <strong>Hair Type:</strong> {selectedHairstyle.hairtype}
                </div>
                <div className="info-item-inprofilescreen">
                  <strong>Hair Length:</strong> {selectedHairstyle.hair_length}
                </div>
              </div>
              <div className="description-inprofilescreen">
                <strong>Description:</strong>
                <p>{selectedHairstyle.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;