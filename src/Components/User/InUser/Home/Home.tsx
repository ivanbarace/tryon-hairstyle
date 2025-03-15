import React, { useState, useEffect } from 'react';
import { BiMessage } from 'react-icons/bi';  // Add this import at the top
import './Home.css';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';

interface TopHairstyle {
  hairstyle_id: number;
  hairstyle_name: string;
  hairstyle_picture: string;
  average_rating: number;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [topHairstyles, setTopHairstyles] = useState<TopHairstyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTutorialIndex, setCurrentTutorialIndex] = useState(0);
  const [isDarkened, setIsDarkened] = useState(false);
  const [isOpenMessageModal, setisOpenMessageModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    message: '',
    userId: '',
    status: 'pending',
    fullname: ''
  });
  const [submitStatus, setSubmitStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tutorialImages = [
    {
      id: 1,
      src: '/tutorials/home.png',
      title: '1. Browse Hairstyles',
      description: 'Explore our collection of trending and popular hairstyles.'
    },
    {
      id: 2,
      src: '/tutorials/register.png',
      title: '2. Login and Register',
      description: 'Create an account or login to access all features.'
    },
    {
      id: 3,
      src: '/tutorials/hairstyles.png',
      title: '3. View Hairstyles',
      description: 'Check detailed information about each hairstyle.'
    },
    {
      id: 4,
      src: '/tutorials/scanfaceshape.png',
      title: '4. Scan Face Shape',
      description: 'Upload your photo to determine your face shape.'
    },
    {
      id: 5,
      src: '/tutorials/recommended.png',
      title: '5. View Recommended Hairstyles',
      description: 'Get personalized hairstyle suggestions based on your face shape.'
    },
    {
      id: 6,
      src: '/tutorials/profile.png',
      title: '6. Profile',
      description: 'Access your personal profile and saved hairstyles.'
    },
    {
      id: 7,
      src: '/tutorials/settings.png',
      title: '7. Settings',
      description: 'Access edit profile and logout options.'
    },
    {
      id: 8,
      src: '/tutorials/editprofile.png',
      title: '8. Edit Profile',
      description: 'Update your personal information and preferences.'
    }
  ];

  useEffect(() => {
    const checkAuthStatus = () => {
      const userData = localStorage.getItem('userData');
      setIsLoggedIn(!!userData);
    };

    checkAuthStatus();
    // Add event listener for storage changes
    window.addEventListener('storage', checkAuthStatus);

    // Cleanup
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  // Listen for auth changes
  useEffect(() => {
    console.log('Login status changed:', isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    fetchTopHairstyles();
  }, []); // Combined useEffects for better organization

  useEffect(() => {
    console.log('Current showTutorial state:', showTutorial); // Debug log
  }, [showTutorial]);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('.main-footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Check if footer is in view
        if (footerRect.top < windowHeight) {
          setIsDarkened(true);
        } else {
          setIsDarkened(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchTopHairstyles = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/top-rated-hairstyles');
      const data = await response.json();

      if (response.ok) {
        if (data.error) {
          throw new Error(data.error);
        }
        const hairstylesArray = Array.isArray(data) ? data : [];
        setTopHairstyles(hairstylesArray);
      } else {
        throw new Error(data.error || 'Failed to fetch top hairstyles');
      }
    } catch (error: unknown) {
      console.error('Error fetching top hairstyles:', error);
      if (error instanceof Error) {
        setError(error.message || 'Failed to load top hairstyles');
      } else {
        setError('Failed to load top hairstyles');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleTutorial = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Button clicked'); // Debug log
    setShowTutorial(prev => {
      console.log('Setting showTutorial to:', !prev); // Debug log
      return !prev;
    });
  };

  const navigateTutorial = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentTutorialIndex(prev =>
        prev === 0 ? tutorialImages.length - 1 : prev - 1
      );
    } else {
      setCurrentTutorialIndex(prev =>
        prev === tutorialImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userId = userData.id || userData.admin_id;

    if (!userId) {
      setErrorMessage('Please log in to send a message');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    if (!contactForm.message) {
      setErrorMessage('Please enter a message');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          fullname: userData.fullname,
          message: contactForm.message
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('Message sent successfully!');
        setContactForm(prev => ({
          ...prev,
          message: ''
        }));
        setTimeout(() => {
          setisOpenMessageModal(false);
          setSubmitStatus('');
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(`Error sending message: ${errorMessage}`);
      setTimeout(() => setErrorMessage(null), 3000);
      console.error('Contact form error:', error);
    }
  };

  return (
    <div className={`home-inHomeScreen-inUsersScreen ${isDarkened ? 'darkened-inHomeScreen-inUsersScreen' : ''}`}>
      {errorMessage && (
        <div className="error-toast-inHomeScreen-inUsersScreen">
          {errorMessage}
        </div>
      )}
      <div className="home-content-inHomeScreen-inUsersScreen">
        {/* Welcome section first */}
        <section className="welcome-section-inHomeScreen-inUsersScreen">
          <div className="welcome-content-inHomeScreen-inUsersScreen">
            <div className="welcome-text-inHomeScreen-inUsersScreen">
              <h1 className="welcome-title-inHomeScreen-inUsersScreen">Welcome to HairStyle</h1>
              <div className="welcome-subtitles-inHomeScreen-inUsersScreen">
                <p className="welcome-subtitle-inHomeScreen-inUsersScreen first-inHomeScreen-inUsersScreen">
                  Discover the perfect hairstyle for your face shape.
                </p>
                <p className="welcome-subtitle-inHomeScreen-inUsersScreen second-inHomeScreen-inUsersScreen">
                  Try our face shape analysis.
                </p>
                <p className="welcome-subtitle-inHomeScreen-inUsersScreen third-inHomeScreen-inUsersScreen">
                  Get personalized hairstyle recommendations that suit you best.
                </p>
              </div>
              {!isLoggedIn && ( // Only show button if not logged in
                <button
                  className="get-started-button-inHomeScreen-inUsersScreen"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                  <i className="fas fa-arrow-right-inHomeScreen-inUsersScreen"></i>
                </button>
              )}
              <button
                className="tutorial-button-inHomeScreen-inUsersScreen"
                onClick={toggleTutorial}
              >
                How to Use
              </button>
            </div>
          </div>
        </section>
        {/* Top rated section moved below */}
        <section className="top-rated-section-inHomeScreen-inUsersScreen">
          <div className="section-header-inHomeScreen-inUsersScreen">
            <h2 className="section-title-inHomeScreen-inUsersScreen">Top Rated Hairstyles</h2>
            <p className="section-subtitle-inHomeScreen-inUsersScreen">Most loved hairstyles by our community</p>
          </div>
          {loading && <div className="loading-inHomeScreen-inUsersScreen">Loading...</div>}
          {error && <div className="error-inHomeScreen-inUsersScreen">{error}</div>}
          <div className="top-rated-container-inHomeScreen-inUsersScreen">
            <div className="top-rated-scroll-inHomeScreen-inUsersScreen">
              {topHairstyles.length > 0 ? (
                topHairstyles.map((hairstyle) => (
                  <div key={hairstyle.hairstyle_id} className="hairstyle-card-inHomeScreen-inUsersScreen">
                    <div className="hairstyle-image-container-inHomeScreen-inUsersScreen">
                      <img
                        src={`http://localhost:5000/hairstyles/${hairstyle.hairstyle_picture.split('/').pop()}`}
                        alt={hairstyle.hairstyle_name}
                        onError={(e) => {
                          console.error('Image failed to load:', hairstyle.hairstyle_picture);
                          e.currentTarget.src = 'fallback-image-url.jpg';
                        }}
                      />
                      <div className="hairstyle-overlay-inHomeScreen-inUsersScreen">
                        <h3>{hairstyle.hairstyle_name}</h3>
                        <div className="rating-inHomeScreen-inUsersScreen">
                          <span className="star-inHomeScreen-inUsersScreen">★</span>
                          {Number(hairstyle.average_rating).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : !loading && (
                <div className="no-hairstyles-inHomeScreen-inUsersScreen">No top-rated hairstyles found</div>
              )}
            </div>
            <div className="scroll-indicator-inHomeScreen-inUsersScreen">
              <span>Scroll for more →</span>
            </div>
          </div>
        </section>
      </div>
      {showTutorial && (
        <div className="tutorial-modal-overlay-inHomeScreen-inUsersScreen" onClick={toggleTutorial}>
          <div className="tutorial-modal-inHomeScreen-inUsersScreen" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="close-modal-intutorial-inHomeScreen-inUsersScreen"
              onClick={toggleTutorial}
            >
              ×
            </button>
            <h2>How to Use HairStyle Hub</h2>
            <div className="tutorial-content-inHomeScreen-inUsersScreen">
              <button
                className="tutorial-nav-button-inHomeScreen-inUsersScreen prev-inHomeScreen-inUsersScreen"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTutorial('prev');
                }}
                title="Previous"
              >
                &#8249;
              </button>

              <div className="tutorial-step-inHomeScreen-inUsersScreen current-inHomeScreen-inUsersScreen">
                <div className="tutorial-image-container-inHomeScreen-inUsersScreen">
                  <img
                    src={tutorialImages[currentTutorialIndex].src}
                    alt={tutorialImages[currentTutorialIndex].title}
                    onError={(e) => {
                      console.error(`Failed to load tutorial image: ${tutorialImages[currentTutorialIndex].src}`);
                      e.currentTarget.src = '/fallback-tutorial.jpg';
                    }}
                  />
                </div>
                <div className="tutorial-step-content-inHomeScreen-inUsersScreen">
                  <h3>{tutorialImages[currentTutorialIndex].title}</h3>
                  <p>{tutorialImages[currentTutorialIndex].description}</p>
                </div>
              </div>

              <button
                className="tutorial-nav-button-inHomeScreen-inUsersScreen next-inHomeScreen-inUsersScreen"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTutorial('next');
                }}
                title="Next"
              >
                &#8250;
              </button>

              <div className="tutorial-indicators-inHomeScreen-inUsersScreen">
                {tutorialImages.map((_, index) => (
                  <span
                    key={index}
                    className={`indicator-inHomeScreen-inUsersScreen ${index === currentTutorialIndex ? 'active-inHomeScreen-inUsersScreen' : ''}`}
                    onClick={() => setCurrentTutorialIndex(index)}
                  ></span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {isLoggedIn && (
        <button
          className="contact-button-inHomeScreen-inUsersScreen"
          onClick={() => setisOpenMessageModal(true)}
        >
          <BiMessage className="message-icon-inHomeScreen-inUsersScreen" />
          <span>Send us a Message</span>
        </button>
      )}
      {isOpenMessageModal && (
        <div className="modal-overlay-inHomeScreen-inUsersScreen" onClick={() => setisOpenMessageModal(false)}>
          <div className="modal-content-inHomeScreen-inUsersScreen" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close-inHomeScreen-inUsersScreen"
              onClick={() => setisOpenMessageModal(false)}
            >
              ×
            </button>
            <h2>Send Message</h2>
            <form onSubmit={handleContactSubmit} className="contact-form-inHomeScreen-inUsersScreen">
              <textarea
                placeholder="Type your message here..."
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
                className="message-textarea-inHomeScreen-inUsersScreen"
              ></textarea>
              <button type="submit" className="submit-button-inHomeScreen-inUsersScreen">Send Message</button>
            </form>
            {submitStatus && <div className="submit-status-inHomeScreen-inUsersScreen">{submitStatus}</div>}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Home;
