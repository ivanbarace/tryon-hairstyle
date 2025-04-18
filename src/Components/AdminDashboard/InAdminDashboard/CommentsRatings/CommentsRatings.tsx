import React, { useEffect, useState } from 'react';
import './CommentsRatings.css';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';

interface Hairstyle {
  hairstyle_id: number;
  hairstyle_name: string;
  hairstyle_picture: string;
  description: string;
  faceshape: string;  // Changed from face_shape
  hairtype: string;   // Changed from hair_type
  hair_length: string;
  face_shapes: string[];  // Add this line
}

interface Rating {
  rating_id: number;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface RatingData {
  ratings: Rating[];
  averageRating: number;
  totalRatings: number;
}

const CommentsRatings: React.FC = () => {
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null);
  const [ratingData, setRatingData] = useState<RatingData | null>(null);
  const [expandedFaceShapes, setExpandedFaceShapes] = useState<number | null>(null);

  const constructImageUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, ''); // Remove trailing slashes
    const imagePath = path.replace(/^\/+/, ''); // Remove leading slashes
    return `${baseUrl}/${imagePath}`;
  };

  const fetchHairstyles = async () => {
    try {
      const hairstylesResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}hairstyles`, {
        credentials: 'include'
      });
      const hairstylesData = await hairstylesResponse.json();
      setHairstyles(hairstylesData);
      setLoading(false);
    } catch (err) {
      setError('Error loading hairstyles');
      setLoading(false);
      console.error('Error:', err);
    }
  };

  const fetchRatings = async (hairstyleId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}admin/ratings/${hairstyleId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setRatingData(data);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  useEffect(() => {
    fetchHairstyles();
  }, []);

  const selectHairstyle = (hairstyle: Hairstyle) => {
    setSelectedHairstyle(hairstyle);
    fetchRatings(hairstyle.hairstyle_id);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="comments-ratings-container-CommentsRatings-in-Adminscreen">
      <div className="split-screen-container">
        <div>
          <h2 className="hairstyles-heading">Hairstyles</h2>
          <div className="hairstyles-list">
            {hairstyles.map((hairstyle) => (
              <div
                key={hairstyle.hairstyle_id}
                className={`hairstyle-box-CommentsRatings-in-Adminscreen ${selectedHairstyle?.hairstyle_id === hairstyle.hairstyle_id ? 'selected' : ''
                  }`}
                onClick={() => selectHairstyle(hairstyle)}
              >
                <img
                  src={constructImageUrl(hairstyle.hairstyle_picture as string)}
                  alt={hairstyle.hairstyle_name}
                  className="hairstyle-image-CommentsRatings-in-Adminscreen"
                  onError={(e) => {
                    console.error('Image failed to load:', hairstyle.hairstyle_picture);
                    console.log('Full URL:', constructImageUrl(hairstyle.hairstyle_picture as string));
                    e.currentTarget.src = '/placeholder.png';
                  }}
                />
                <h3 className="hairstyle-name-CommentsRatings-in-Adminscreen">
                  {hairstyle.hairstyle_name}
                </h3>
              </div>
            ))}
          </div>
        </div>

        <div className="hairstyle-details-panel">
          {selectedHairstyle ? (
            <>
              <div className="details-panel-content">
                <h3>{selectedHairstyle.hairstyle_name}</h3>
                {ratingData && (
                  <div className="rating-info-CommentsRatings-in-Adminscreen">
                    <h4>Rating Overview</h4>
                    <div className="average-rating-inCommentRatings">
                      <span className="stars">{renderStars(Math.round(ratingData.averageRating))}</span>
                      <span className="rating-text">{ratingData.averageRating.toFixed(1)} / 5</span>
                      <span className="total-ratings">({ratingData.totalRatings} ratings)</span>
                    </div>
                  </div>
                )}
                <div className="hairstyle-details-CommentsRatings-in-Adminscreen">
                  <div className="detail-item-CommentsRatings-in-Adminscreen">
                    <span className="detail-label-CommentsRatings-in-Adminscreen">Face Shape:</span>
                    <div className="face-shapes-dropdown">
                      <button
                        className="face-shapes-button"
                        onClick={() => setExpandedFaceShapes(
                          expandedFaceShapes === selectedHairstyle.hairstyle_id
                            ? null
                            : selectedHairstyle.hairstyle_id
                        )}
                      >
                        {selectedHairstyle.face_shapes[0]}
                        {selectedHairstyle.face_shapes.length > 1 &&
                          <span className="additional-count">
                            {` (+${selectedHairstyle.face_shapes.length - 1})`}
                          </span>
                        }
                        <span className={`dropdown-arrow ${expandedFaceShapes === selectedHairstyle.hairstyle_id ? 'expanded' : ''}`}>
                          ▼
                        </span>
                      </button>
                      {expandedFaceShapes === selectedHairstyle.hairstyle_id && selectedHairstyle.face_shapes.length > 1 && (
                        <div className="face-shapes-dropdown-content">
                          {selectedHairstyle.face_shapes.slice(1).map((shape, index) => (
                            <div key={index} className="dropdown-item">
                              {shape}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="detail-item-CommentsRatings-in-Adminscreen">
                    <span className="detail-label-CommentsRatings-in-Adminscreen">Hair Type:</span>
                    <span className="detail-value-CommentsRatings-in-Adminscreen">{selectedHairstyle.hairtype}</span>
                  </div>
                  <div className="detail-item-CommentsRatings-in-Adminscreen">
                    <span className="detail-label-CommentsRatings-in-Adminscreen">Hair Length:</span>
                    <span className="detail-value-CommentsRatings-in-Adminscreen">{selectedHairstyle.hair_length}</span>
                  </div>
                </div>
                {ratingData && (
                  <div className="comments-section-CommentsRatings-in-Adminscreen">
                    <h4>User Reviews</h4>
                    <div className="reviews-table">
                      {ratingData.ratings.length > 0 ? (
                        <>
                          <div className="reviews-header">
                            <div className="review-col user-col">User</div>
                            <div className="review-col rating-col">Rating</div>
                            <div className="review-col comment-col">Comment</div>
                            <div className="review-col date-col">Date</div>
                          </div>
                          <div className="reviews-body">
                            {ratingData.ratings.map((rating) => (
                              <div key={rating.rating_id} className="review-row">
                                <div className="review-col user-col">{rating.username}</div>
                                <div className="review-col rating-col">
                                  <span className="stars">{renderStars(rating.rating)}</span>
                                </div>
                                <div className="review-col comment-col">{rating.comment}</div>
                                <div className="review-col date-col">
                                  {new Date(rating.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="no-reviews-message">
                          <p>No reviews available for this hairstyle yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection-message">
              <h4>Select a hairstyle to view details</h4>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsRatings;