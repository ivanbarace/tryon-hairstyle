import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';
import './Profile.css';
import { FaCog, FaHeart } from 'react-icons/fa';
import { MdFavorite } from 'react-icons/md';

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
  faceshape: string;  // This should be a string, not an array
  hairtype: string;
  hair_length: string;
  description: string;
  isFavorite?: boolean;
  averageRating?: number;
  totalRatings?: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteHairstyle[]>([]);
  const [showHairstyleModal, setShowHairstyleModal] = useState(false);
  const [selectedHairstyle, setSelectedHairstyle] = useState<FavoriteHairstyle | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [expandedFaceShape, setExpandedFaceShape] = useState<number | null>(null);
  const [showUnfavoriteModal, setShowUnfavoriteModal] = useState(false);
  const [hairstyleToUnfavorite, setHairstyleToUnfavorite] = useState<number | null>(null);

  const fetchUserData = useCallback(async () => {
    const storedUserData = localStorage.getItem('userData');
    if (!storedUserData) return;

    const parsedData = JSON.parse(storedUserData);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}user/${parsedData.id}`);
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
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}favorites/details/${userData.id}`);
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

    // Show confirmation modal before unfavoriting
    setHairstyleToUnfavorite(hairstyleId);
    setShowUnfavoriteModal(true);
  };

  const handleConfirmUnfavorite = async () => {
    if (!userData?.id || !hairstyleToUnfavorite) {
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}favorites`, {
        user_id: userData.id,
        hairstyle_id: hairstyleToUnfavorite
      });

      if (!response.data.isFavorite) {
        setFavorites(prev => prev.filter(h => h.hairstyle_id !== hairstyleToUnfavorite));
      }

      if (selectedHairstyle && selectedHairstyle.hairstyle_id === hairstyleToUnfavorite) {
        setSelectedHairstyle(null);
        setShowHairstyleModal(false);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }

    setShowUnfavoriteModal(false);
    setHairstyleToUnfavorite(null);
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

  const handleFaceShapeClick = (hairstyleId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedFaceShape(expandedFaceShape === hairstyleId ? null : hairstyleId);
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
                src={`${import.meta.env.VITE_BACKEND_URL}${userData.profilePicture.replace(/^\//, '')}`}
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
        <span className="favorites-label">
          <span className="label-text">My Favorites</span>
          <MdFavorite className="label-icon" />
        </span>
      </div>

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
                  src={`${import.meta.env.VITE_BACKEND_URL}${hairstyle.hairstyle_picture.replace(/^\//, '')}`}
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

      {showHairstyleModal && selectedHairstyle && (
        <div className="hairstyle-modal-InProfile-InUserScreen">
          <div className="hairstyle-modal-content-InProfile-InUserScreen">
            <button className="close-button-InProfile-InUserScreen" onClick={() => setShowHairstyleModal(false)}>×</button>
            <button className="nav-button-InProfile-InUserScreen prev" onClick={handlePrevHairstyle}>‹</button>
            <button className="nav-button-InProfile-InUserScreen next" onClick={handleNextHairstyle}>›</button>
            <div className="hairstyle-modal-image-InProfile-InUserScreen">
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${selectedHairstyle.hairstyle_picture.replace(/^\//, '')}`}
                alt={selectedHairstyle.hairstyle_name}
              />
              <button
                className={`favorite-button-InProfile-InUserScreen modal-favorite ${selectedHairstyle.isFavorite ? 'is-favorite' : ''}`}
                onClick={(e) => handleFavoriteClick(selectedHairstyle.hairstyle_id, e)}
                title={selectedHairstyle.isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <FaHeart />
              </button>
            </div>
            <div className="hairstyle-modal-info-InProfile-InUserScreen">
              <h2>{selectedHairstyle.hairstyle_name}</h2>
              <div className="info-grid-InProfile-InUserScreen">
                <div className="info-item-InProfile-InUserScreen">
                  <strong>Face Shape:</strong>
                  {selectedHairstyle.faceshape && (
                    <>
                      <button
                        className="face-shape-button-info"
                        onClick={(e) => handleFaceShapeClick(selectedHairstyle.hairstyle_id, e)}
                      >
                        {selectedHairstyle.faceshape.split(',')[0]}
                        {selectedHairstyle.faceshape.split(',').length > 1 && (
                          <span className="additional-shapes">
                            +{selectedHairstyle.faceshape.split(',').length - 1}
                          </span>
                        )}
                        <span className={`dropdown-arrow ${expandedFaceShape === selectedHairstyle.hairstyle_id ? 'expanded' : ''}`}>▼</span>
                      </button>
                      {expandedFaceShape === selectedHairstyle.hairstyle_id && (
                        <div className="face-shape-dropdown-content">
                          {selectedHairstyle.faceshape.split(',').map((shape, index) => (
                            <div key={index} className="dropdown-item">
                              {shape.trim()}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="info-item-InProfile-InUserScreen">
                  <strong>Hair Type:</strong> {selectedHairstyle.hairtype}
                </div>
                <div className="info-item-InProfile-InUserScreen">
                  <strong>Hair Length:</strong> {selectedHairstyle.hair_length}
                </div>
              </div>
              <div className="description-InProfile-InUserScreen">
                <strong>Description:</strong>
                <p>{selectedHairstyle.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUnfavoriteModal && (
        <div className="confirm-modal-overlay-InProfile">
          <div className="confirm-modal-InProfile">
            <h3>Remove from Favorites</h3>
            <p>Are you sure you want to remove this hairstyle from your favorites?</p>
            <div className="confirm-modal-buttons-InProfile">
              <button className="confirm-yes-btn-InProfile" onClick={handleConfirmUnfavorite}>Yes</button>
              <button className="confirm-no-btn-InProfile" onClick={() => setShowUnfavoriteModal(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;