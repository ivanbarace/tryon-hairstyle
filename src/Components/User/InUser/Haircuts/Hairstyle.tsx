import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHeart, FaBars, FaStar, FaCamera, FaMagic } from 'react-icons/fa';
import { IoIosQrScanner } from "react-icons/io";
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';  // Add this import
import './Hairstyle.css';

interface Rating {
  rating_id: number;
  user_id: number;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Hairstyle {
  hairstyle_id: number;
  hairstyle_name: string;
  hairstyle_picture: string;
  faceshape: string;
  hairtype: string;
  hair_length: string;
  description: string;
  status: 'active' | 'archived';  // Add this line
  isFavorite?: boolean;
  ratings?: Rating[];
  averageRating?: number;
  totalRatings?: number;
}

const Hairstyle: React.FC = () => {
  const navigate = useNavigate();
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaceShape, setSelectedFaceShape] = useState<string>('all');
  const [selectedHairType, setSelectedHairType] = useState<string>('all');
  const [selectedHairLength, setSelectedHairLength] = useState<string>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [facemeshExists, setFacemeshExists] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null);
  const [showHairstyleModal, setShowHairstyleModal] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginModalAction, setLoginModalAction] = useState<string>('');
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userComment, setUserComment] = useState<string>('');
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const faceShapes = ['all', 'oval', 'round', 'square', 'heart'];
  const hairTypes = ['all', 'straight', 'wavy', 'curly', 'coily'];
  const hairLengths = ['all', 'short', 'medium', 'long'];

  const fetchHairstyles = async (currentUserId: string | null) => {
    try {
      setLoading(true);
      const [hairstylesResponse, favoritesResponse] = await Promise.all([
        axios.get('http://localhost:5000/hairstyles'), // This endpoint now only returns active hairstyles
        currentUserId ? axios.get(`http://localhost:5000/favorites/${currentUserId}`) : Promise.resolve({ data: [] })
      ]);

      // Filter out any non-active hairstyles (as a safeguard)
      const activeHairstyles = hairstylesResponse.data.filter((hairstyle: Hairstyle) =>
        hairstyle.status === 'active'
      );

      // Combine hairstyles with favorite status
      const hairstylesWithFavorites = activeHairstyles.map((hairstyle: Hairstyle) => ({
        ...hairstyle,
        isFavorite: favoritesResponse.data.includes(hairstyle.hairstyle_id)
      }));

      setHairstyles(hairstylesWithFavorites);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching hairstyles:', err);
      setError('Failed to load hairstyles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      setUserId(userData.id);
      checkFacemeshData(userData.id);
      fetchHairstyles(userData.id);
    } else {
      fetchHairstyles(null);
    }
  }, []);

  const checkFacemeshData = async (userId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/checkFacemesh/${userId}`);
      setFacemeshExists(response.data.exists);
    } catch (error) {
      console.error('Error checking facemesh data:', error);
    }
  };

  const handleActionRequiringLogin = (action: string, callback: () => void) => {
    if (!userId) {
      setLoginModalAction(action);
      setShowLoginModal(true);
    } else {
      callback();
    }
  };

  const handleTryClick = () => {
    handleActionRequiringLogin('try on hairstyles', () => {
      if (facemeshExists) {
        navigate('/user/recommended');
      } else {
        setShowModal(true);
      }
    });
  };

  const handleScannerClick = () => {
    handleActionRequiringLogin('scan your face', () => {
      navigate('/user/scanner-tutorial');  // Changed from '/user/scanner' to '/user/scanner-tutorial'
    });
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleHairstyleClick = (hairstyle: Hairstyle) => {
    setSelectedHairstyle(hairstyle);
    setShowHairstyleModal(true);
    fetchRatings(hairstyle.hairstyle_id);
  };

  const closeHairstyleModal = () => {
    setShowHairstyleModal(false);
    setSelectedHairstyle(null);
  };

  const handlePrevHairstyle = () => {
    if (selectedHairstyle) {
      const currentIndex = filteredHairstyles.findIndex(
        (h) => h.hairstyle_id === selectedHairstyle.hairstyle_id
      );
      const prevIndex = (currentIndex - 1 + filteredHairstyles.length) % filteredHairstyles.length;
      const prevHairstyle = filteredHairstyles[prevIndex];
      setSelectedHairstyle(prevHairstyle);
      setRatings([]); // Clear existing ratings
      fetchRatings(prevHairstyle.hairstyle_id); // Fetch new ratings
    }
  };

  const handleNextHairstyle = () => {
    if (selectedHairstyle) {
      const currentIndex = filteredHairstyles.findIndex(
        (h) => h.hairstyle_id === selectedHairstyle.hairstyle_id
      );
      const nextIndex = (currentIndex + 1) % filteredHairstyles.length;
      const nextHairstyle = filteredHairstyles[nextIndex];
      setSelectedHairstyle(nextHairstyle);
      setRatings([]); // Clear existing ratings
      fetchRatings(nextHairstyle.hairstyle_id); // Fetch new ratings
    }
  };

  const handleFavoriteClick = async (hairstyleId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    handleActionRequiringLogin('add favorites', async () => {
      try {
        const response = await axios.post('http://localhost:5000/favorites', {
          user_id: userId,
          hairstyle_id: hairstyleId
        });

        // Update hairstyles state
        setHairstyles(prev => prev.map(h => {
          if (h.hairstyle_id === hairstyleId) {
            return { ...h, isFavorite: response.data.isFavorite };
          }
          return h;
        }));

        // Update selectedHairstyle if it's the one being modified
        if (selectedHairstyle && selectedHairstyle.hairstyle_id === hairstyleId) {
          setSelectedHairstyle(prev => prev ? {
            ...prev,
            isFavorite: response.data.isFavorite
          } : null);
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    });
  };

  const handleRatingClick = async () => {
    handleActionRequiringLogin('rate this hairstyle', () => {
      setShowRatingModal(true);
    });
  };

  const submitRating = async () => {
    if (!selectedHairstyle || !userId) return;

    try {
      await axios.post('http://localhost:5000/ratings', {
        user_id: userId,
        hairstyle_id: selectedHairstyle.hairstyle_id,
        rating: userRating,
        comment: userComment
      });

      // Fetch updated ratings
      fetchRatings(selectedHairstyle.hairstyle_id);

      // Close modal and reset form
      setShowRatingModal(false);
      setUserRating(0);
      setUserComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const fetchRatings = async (hairstyleId: number) => {
    try {
      const response = await axios.get(`http://localhost:5000/ratings/${hairstyleId}`);
      const averageRating = parseFloat(response.data.averageRating);
      const totalRatings = parseInt(response.data.totalRatings);

      setRatings(response.data.ratings || []);

      // Update the selected hairstyle with the new rating data
      setSelectedHairstyle(prev => prev ? {
        ...prev,
        averageRating: averageRating,
        totalRatings: totalRatings
      } : null);

    } catch (error) {
      console.error('Error fetching ratings:', error);
      setRatings([]);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.actions-dropdown-Inhairstyle-InUserScreen')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const filteredHairstyles = hairstyles.filter((hairstyle) => {
    const faceShapeMatch =
      selectedFaceShape === 'all' ||
      hairstyle.faceshape.toLowerCase() === selectedFaceShape.toLowerCase();
    const hairTypeMatch =
      selectedHairType === 'all' ||
      hairstyle.hairtype.toLowerCase() === selectedHairType.toLowerCase();
    const hairLengthMatch =
      selectedHairLength === 'all' ||
      hairstyle.hair_length.toLowerCase() === selectedHairLength.toLowerCase();

    return faceShapeMatch && hairTypeMatch && hairLengthMatch;
  });

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <div className="hairstyle error">{error}</div>;
  }

  return (
    <div className="hairstyle-Inhairstyle-InUserScreen">
      <div className="hairstyle-header-Inhairstyle-InUserScreen">
        <button
          className="menu-button-Inhairstyle-InUserScreen"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <FaBars />
        </button>
        <h4>Hairstyle</h4>

        <div className="actions-dropdown-Inhairstyle-InUserScreen">
          <button
            className="actions-button-Inhairstyle-InUserScreen"
            onClick={toggleDropdown}
            aria-label="Actions menu"
          >
            <IoIosQrScanner />
          </button>
          <div className={`dropdown-content-Inhairstyle-InUserScreen ${showDropdown ? 'show' : ''}`}>
            <button
              className="dropdown-button-Inhairstyle-InUserScreen"
              onClick={() => {
                handleTryClick();
                setShowDropdown(false);
              }}
            >
              Try On Hairstyles <FaMagic />
            </button>
            <button
              className="dropdown-button-Inhairstyle-InUserScreen"
              onClick={() => {
                handleScannerClick();
                setShowDropdown(false);
              }}
            >
              Scan Face Shape<FaCamera />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-Inhairstyle-InUserScreen">
          <div className="modal-content-Inhairstyle-InUserScreen">
            <div className="modal-header">
              <h2>Notice</h2>
              <button className="close-button-Inhairstyle-InUserScreen" onClick={closeModal}>×</button>
            </div>
            <p>You do not have a picture for try on. Please scan your face shape first.</p>
            <button onClick={() => navigate('/user/scanner')}>Go to Scanner</button>
          </div>
        </div>
      )}

      <div className={`filters-container-Inhairstyle-InUserScreen ${isMenuOpen ? 'show' : ''}`}>
        <button
          className="filters-close-button-Inhairstyle-InUserScreen"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close filters"
        >
          ×
        </button>
        <div className="filter-section-Inhairstyle-InUserScreen">
          <h3>Face Shape</h3>
          <select
            className="filter-select"
            value={selectedFaceShape}
            onChange={(e) => setSelectedFaceShape(e.target.value)}
            aria-label="Face Shape"
          >
            {faceShapes.map((shape) => (
              <option key={shape} value={shape}>
                {shape.charAt(0).toUpperCase() + shape.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-section-Inhairstyle-InUserScreen">
          <h3>Hair Type</h3>
          <select
            className="filter-select"
            value={selectedHairType}
            onChange={(e) => setSelectedHairType(e.target.value)}
            aria-label="Hair Type"
          >
            {hairTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-section-Inhairstyle-InUserScreen">
          <h3>Hair Length</h3>
          <select
            className="filter-select"
            value={selectedHairLength}
            onChange={(e) => setSelectedHairLength(e.target.value)}
            aria-label="Hair Length"
          >
            {hairLengths.map((length) => (
              <option key={length} value={length}>
                {length.charAt(0).toUpperCase() + length.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="hairstyles-section-Inhairstyle-InUserScreen">
        <div className="hairstyles-header-Inhairstyle-InUserScreen">
          <p className="results-count-Inhairstyle-InUserScreen">
            {filteredHairstyles.length} {filteredHairstyles.length === 1 ? 'hairstyle' : 'hairstyles'} found
          </p>
        </div>

        {filteredHairstyles.length === 0 ? (
          <div className="no-results-Inhairstyle-InUserScreen">
            <p>No hairstyles found matching your filters.</p>
          </div>
        ) : (
          <div className="hairstyles-Inhairstyle-InUserScreen">
            <div className="hairstyles-grid-Inhairstyle-InUserScreen">
              {filteredHairstyles.map((hairstyle) => (
                <div
                  key={hairstyle.hairstyle_id}
                  className="hairstyle-card-Inhairstyle-InUserScreen"
                >
                  <button
                    className={`favorite-button-Inhairstyle-InUserScreen ${hairstyle.isFavorite ? 'is-favorite' : ''}`}
                    onClick={(e) => handleFavoriteClick(hairstyle.hairstyle_id, e)}
                    title={hairstyle.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <FaHeart />
                  </button>
                  <img
                    src={`http://localhost:5000${hairstyle.hairstyle_picture}`}
                    alt={hairstyle.hairstyle_name}
                    className="hairstyle-image-Inhairstyle-InUserScreen"
                    onClick={() => handleHairstyleClick(hairstyle)}
                  />
                  <div className="hairstyle-name-Inhairstyle-InUserScreen">{hairstyle.hairstyle_name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Keep existing modals after the footer */}
      {showModal && (
        <div className="modal-Inhairstyle-InUserScreen">
          <div className="modal-content-Inhairstyle-InUserScreen">
            <div className="modal-header">
              <h2>Notice</h2>
              <button className="close-button-Inhairstyle-InUserScreen" onClick={closeModal}>×</button>
            </div>
            <p>You do not have a picture for try on. Please scan your face shape first.</p>
            <button onClick={() => navigate('/user/scanner')}>Go to Scanner</button>
          </div>
        </div>
      )}

      {showHairstyleModal && selectedHairstyle && (
        <div className="hairstyle-modal-Inhairstyle-InUserScreen">
          <div className="hairstyle-modal-content-Inhairstyle-InUserScreen">
            <button className="close-button-Inhairstyle-InUserScreen" onClick={closeHairstyleModal}>×</button>
            <button className="nav-button-Inhairstyle-InUserScreen nav-button-prev-Inhairstyle-InUserScreen" onClick={handlePrevHairstyle}>‹</button>
            <button className="nav-button-Inhairstyle-InUserScreen nav-button-next-Inhairstyle-InUserScreen" onClick={handleNextHairstyle}>›</button>
            <div className="hairstyle-modal-image-Inhairstyle-InUserScreen">
              <img
                src={`http://localhost:5000${selectedHairstyle.hairstyle_picture}`}
                alt={selectedHairstyle.hairstyle_name}
              />
              <button
                className={`favorite-button-Inhairstyle-InUserScreen modal-favorite ${selectedHairstyle.isFavorite ? 'is-favorite' : ''}`}
                onClick={(e) => handleFavoriteClick(selectedHairstyle.hairstyle_id, e)}
                title={selectedHairstyle.isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <FaHeart />
              </button>
            </div>
            <div className="hairstyle-modal-info-Inhairstyle-InUserScreen">
              <h2>{selectedHairstyle.hairstyle_name}</h2>
              {renderAverageRating(selectedHairstyle.averageRating, selectedHairstyle.totalRatings)}
              <div className="info-grid-Inhairstyle-InUserScreen">
                <div className="info-item-Inhairstyle-InUserScreen">
                  <strong>Face Shape:</strong> {selectedHairstyle.faceshape}
                </div>
                <div className="info-item-Inhairstyle-InUserScreen">
                  <strong>Hair Type:</strong> {selectedHairstyle.hairtype}
                </div>
                <div className="info-item-Inhairstyle-InUserScreen">
                  <strong>Hair Length:</strong> {selectedHairstyle.hair_length}
                </div>
              </div>
              <div className="description-Inhairstyle-InUserScreen">
                <strong>Description:</strong>
                <p>{selectedHairstyle.description}</p>
              </div>
              <div className="ratings-section">
                <button
                  className="rate-button"
                  onClick={handleRatingClick}
                >
                  Rate this Hairstyle
                </button>

                <div className="ratings-list">
                  <h3>Reviews</h3>
                  {ratings.length > 0 ? (
                    ratings.map((rating) => (
                      <div key={rating.rating_id} className="rating-item">
                        <div className="rating-header">
                          <span className="rating-username">{rating.username}</span>
                          <div className="rating-stars">{renderStars(rating.rating)}</div>
                        </div>
                        {rating.comment && (
                          <p className="rating-comment">{rating.comment}</p>
                        )}
                        <span className="rating-date">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>No ratings yet. Be the first to rate!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add new Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay-loginmodal-inhairstylescreen">
          <div className="modal-content-loginmodal-inhairstylescreen">
            <h3>Login Required</h3>
            <p>Please login or register to {loginModalAction}</p>
            <div className="modal-buttons-loginmodal-inhairstylescreen">
              <button onClick={() => navigate('/login')}>Login</button>
              <button onClick={() => navigate('/register')}>Register</button>
            </div>
            <button className="modal-close-loginmodal-inhairstylescreen" onClick={() => setShowLoginModal(false)}>×</button>
          </div>
        </div>
      )}

      {/* Add this at the end of your component, before the closing tag */}
      {showRatingModal && (
        <div className="rating-modal-overlay">
          <div className="rating-modal">
            <button className="close-button-Inhairstyle-InUserScreen" onClick={() => setShowRatingModal(false)}>×</button>
            <h3>Rate this Hairstyle</h3>
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`star ${star <= (hoverRating || userRating) ? 'filled' : ''}`}
                  onClick={() => setUserRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ color: star <= (hoverRating || userRating) ? '#ffc107' : '#e4e5e9' }}
                />
              ))}
            </div>
            <textarea
              placeholder="Write your comment (optional)"
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
            />
            <button
              className="submit-rating-button"
              onClick={submitRating}
              disabled={!userRating}
            >
              Submit Rating
            </button>
          </div>
        </div>
      )}

      {/* ...existing modals... */}
    </div>
  );
};

const renderStars = (rating: number) => {
  return [...Array(5)].map((_, index) => (
    <FaStar
      key={index}
      className={index < rating ? 'star filled' : 'star'}
      style={{ color: index < rating ? '#ffc107' : '#e4e5e9' }}
    />
  ));
};

const renderAverageRating = (average: number | undefined, total: number | undefined) => (
  <div className="average-rating">
    <div className="rating-stars">
      {renderStars(Number(average || 0))}
    </div>
    <span className="rating-average">
      {Number(average || 0).toFixed(1)} ({total || 0} {(total || 0) === 1 ? 'review' : 'reviews'})
    </span>
  </div>
);

export default Hairstyle;
