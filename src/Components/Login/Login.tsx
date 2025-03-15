import React, { useState, useEffect } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  text: string;
  type: 'error' | 'success';
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    // Clear any existing authentication data when arriving at login page
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('isAdminAuthenticated');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const showMessage = (text: string, type: 'error' | 'success') => {
    const newMessage: Message = {
      id: Date.now(),
      text,
      type
    };
    setMessages(prev => [...prev, newMessage]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeMessage(newMessage.id);
    }, 5000);
  };

  const removeMessage = (id: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const renderMessages = () => (
    <div className="toast-container">
      {messages.map(message => (
        <div
          key={message.id}
          className={`toast-message ${message.type}`}
          onClick={() => removeMessage(message.id)}
        >
          {message.text}
        </div>
      ))}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const serverUrl = `http://${window.location.hostname}:5000/login`;
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Login response data:', data); // Debug log

      if (response.ok) {
        showMessage('Login successful!', 'success');

        // Store user data differently based on whether it's an admin or regular user
        if (data.isAdmin) {
          // For admin users
          localStorage.setItem('userData', JSON.stringify({
            admin_id: data.user.admin_id,
            fullname: data.user.fullname,
            username: data.user.username,
            role: 'admin'
          }));
          // Set admin authentication flag
          localStorage.setItem('isAdminAuthenticated', 'true');
        } else {
          // For regular users
          localStorage.setItem('userData', JSON.stringify({
            id: data.user.id,
            fullname: data.user.fullname,
            username: data.user.username,
            role: data.role
          }));
          // Clear admin authentication flag for non-admin users
          localStorage.removeItem('isAdminAuthenticated');
        }

        // Navigate based on role
        if (data.isAdmin) {
          navigate('/admin-dashboard/dashboard', { replace: true });
        } else {
          navigate('/user', { replace: true });
        }
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage('An error occurred during login.', 'error');
    }
  };

  return (
    <div className="login-container">
      {renderMessages()}
      <div className="curved-bg-top"></div>
      <div className="curved-bg-bottom"></div>
      <div className="loginPage-inloginscreen">
        <div className="login-form-inloginscreen">
          <div className="welcome-section">
            <p>Please login to your account</p>
          </div>
          <div className="logo-inloginscreen">
            <img src="/LOGO1.png" alt="Logo" className="logo-image" />
          </div>
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-container-inloginscreen">
              <input
                type="text"
                id="username"
                name="username"
                placeholder=" "
                value={formData.username}
                onChange={handleChange}
              />
              <label htmlFor="username">Username</label>
            </div>
            <div className="input-container-inloginscreen">
              <input
                type="password"
                id="password"
                name="password"
                placeholder=" "
                value={formData.password}
                onChange={handleChange}
              />
              <label htmlFor="password">Password</label>
            </div>
            <div className="forgot-password-inloginscreen">
              Forgot Password? <a onClick={() => navigate('/forgot-password')}>Reset Password</a>
            </div>
            <button type="submit" className="btn-inloginscreen">
              Login <span>→</span>
            </button>
          </form>
          <button
            onClick={() => navigate('/user')}
            className="guest-btn-inloginscreen"
          >
            Continue as Guest <span>→</span>
          </button>
          {/* Add mobile-only register button */}
          <div className="Register-btn-inloginscreen mobile-only">
            Don't have an account?
            <a onClick={() => navigate('/register')}> Register now</a>
          </div>
        </div>
        <div className="image-column-inloginscreen">
          <div className="overlay"></div>
          <div className="image-content">
            <div className="image-text">
              <h2>Style with Confidence</h2>
              <p>Discover your perfect look with our expert style recommendations</p>
            </div>
            <div className="image-wrapper">
              <img src="/barber.png" alt="Barber Shop" className="feature-image" />
            </div>
            <div className="Register-btn-inloginscreen">
              Don't have an account?
              <a onClick={() => navigate('/register')}> Register now</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
