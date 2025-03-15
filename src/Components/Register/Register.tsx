import React, { useState } from 'react';
import './Register.css';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa'; // Add this import

interface Message {
  id: number;
  text: string;
  type: 'error' | 'success';
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',  // Added email field
    password: '',
    role: 'user'  // Default role is set to 'user'
  });
  const [confirmPassword, setConfirmPassword] = useState(''); // Add this line
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [actualCode, setActualCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false); // Create a separate loading state for verification
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState(''); // Add this new state
  const [isResending, setIsResending] = useState(false); // Add this new state
  const [fullnameError, setFullnameError] = useState(''); // Add this new state
  interface FormData {
    fullname: string;
    username: string;
    email: string;
    password: string;
    role: string;
    profilePicture: File | null;
  }

  const [tempFormData, setTempFormData] = useState<FormData | null>(null);

  // Add this function after the component declaration
  const capitalizeWords = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Modify the handleChange function
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Clear error message when user starts typing
    setFullnameError(''); // Clear fullname error

    // Remove field from invalidFields when user starts typing
    setInvalidFields(prev => prev.filter(field => field !== name));

    // Validate fullname - only allow letters and ., -
    if (name === 'fullname') {
      const nameRegex = /^[A-Za-z\s.,.-]*$/;
      if (!nameRegex.test(value)) {
        // Check what invalid character was typed
        const lastChar = value.slice(-1);
        if (/\d/.test(lastChar)) {
          setFullnameError('Numbers are not allowed in names');
        } else {
          setFullnameError('Only letters, .,- are allowed');
        }
        return; // Don't update the state if invalid characters are entered
      }
    }

    // Only keep email validation while typing
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setInvalidFields(prev => [...prev.filter(f => f !== 'email'), 'email']);
        showMessage('Please enter a valid email address', 'error');
      }
    }

    // Handle confirm password without showing error message
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData({
        ...formData,
        [name]: name === 'fullname' ? capitalizeWords(value) : value
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add cleanup for preview URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check empty fields
    const emptyFields: string[] = [];
    if (!profilePicture) emptyFields.push('profilePicture');
    if (!formData.fullname.trim()) emptyFields.push('fullname');
    if (!formData.username.trim()) emptyFields.push('username');
    if (!formData.email.trim()) emptyFields.push('email');
    if (!formData.password.trim()) emptyFields.push('password');
    if (!confirmPassword.trim()) emptyFields.push('confirmPassword');

    if (emptyFields.length > 0) {
      setInvalidFields(emptyFields);
      showMessage('Please input all fields', 'error');
      return;
    }

    // Password validation - moved here from handleChange
    if (formData.password.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      setInvalidFields(prev => [...prev.filter(f => f !== 'password'), 'password']);
      return;
    }

    // Confirm password validation - moved here from handleChange
    if (formData.password !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      setInvalidFields(prev => [...prev.filter(f => f !== 'confirmPassword'), 'confirmPassword']);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showMessage('Please enter a valid email address', 'error');
      setInvalidFields(prev => [...prev.filter(f => f !== 'email'), 'email']);
      return;
    }

    // Only set loading state after all validations pass
    setInvalidFields([]);
    setIsLoading(true);

    try {
      // First, check if username exists
      const checkUsernameResponse = await fetch('http://localhost:5000/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
        }),
      });

      const checkUsernameData = await checkUsernameResponse.json();

      if (checkUsernameData.exists) {
        showMessage('Username already exists. Please choose a different username.', 'error');
        setInvalidFields(prev => [...prev.filter(f => f !== 'username'), 'username']);
        setIsLoading(false);
        return;
      }

      // Then check if email exists in database
      const checkEmailResponse = await fetch('http://localhost:5000/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const checkEmailData = await checkEmailResponse.json();

      if (checkEmailData.exists) {
        showMessage('Email already exists. Please use a different email.', 'error');
        setInvalidFields(prev => [...prev.filter(f => f !== 'email'), 'email']);
        setIsLoading(false);
        return;
      }

      // Generate and send verification code
      const code = generateVerificationCode();
      setActualCode(code);

      const verificationResponse = await fetch('http://localhost:5000/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          verificationCode: code,
        }),
      });

      const verificationData = await verificationResponse.json();

      if (!verificationResponse.ok || !verificationData.success) {
        showMessage(verificationData.message || 'Failed to verify email', 'error');
        setInvalidFields(prev => [...prev.filter(f => f !== 'email'), 'email']);
        setIsLoading(false);
        return;
      }

      // Only proceed with verification modal if email was sent successfully
      setTempFormData({
        ...formData,
        profilePicture,
      });
      setShowVerification(true);
      setIsLoading(false);

    } catch {
      showMessage('Failed to send verification code. Please check your email address.', 'error');
      setInvalidFields(prev => [...prev.filter(f => f !== 'email'), 'email']);
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    setIsVerifying(true);
    // Clear any existing messages
    setVerificationError('');
    setVerificationSuccessMessage(''); // Use this instead of setSuccessMessage

    if (verificationCode === actualCode) {
      setVerificationSuccessMessage('Verification successful! Creating your account...'); // Change this line
      // Create FormData object for the actual registration
      const formDataToSend = new FormData();
      if (tempFormData) {
        formDataToSend.append('fullname', tempFormData.fullname);
        formDataToSend.append('username', tempFormData.username);
        formDataToSend.append('email', tempFormData.email);
        formDataToSend.append('password', tempFormData.password);
        formDataToSend.append('role', tempFormData.role);
        if (tempFormData.profilePicture) {
          formDataToSend.append('profilePicture', tempFormData.profilePicture);
        }
      }

      try {
        // Proceed with registration
        const registerResponse = await fetch('http://localhost:5000/register', {
          method: 'POST',
          credentials: 'include',
          body: formDataToSend,
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          throw new Error(registerData.message || 'Registration failed');
        }

        // Auto-login after successful registration
        if (!tempFormData) {
          throw new Error('Temporary form data is missing');
        }

        const loginResponse = await fetch('http://localhost:5000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: tempFormData.username,
            password: tempFormData.password,
          }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          localStorage.setItem('userRole', loginData.role);
          localStorage.setItem('userData', JSON.stringify(loginData.user));
          navigate('/user', { replace: true });
        }
      } catch {
        setVerificationError('Registration failed. Please try again.');
      }
    } else {
      setVerificationError('Invalid verification code');
      // Clear the input field on invalid code
      setVerificationCode('');
    }
    setIsVerifying(false);  // Clear verification loading state
  };

  const resendVerificationCode = async () => {
    setIsResending(true);
    setVerificationError('');
    setVerificationCode('');

    const newCode = generateVerificationCode();
    setActualCode(newCode);

    try {
      const response = await fetch('http://localhost:5000/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: tempFormData?.email || '',
          verificationCode: newCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setVerificationError(data.message || 'Failed to resend verification code');
        return;
      }

      setVerificationSuccessMessage('New verification code sent!');
      setTimeout(() => {
        setVerificationSuccessMessage('');
      }, 3000);
    } catch {
      setVerificationError('Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
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

  return (
    <div className="register-container">
      {renderMessages()}
      <div className="curved-bg-top-register"></div>
      <div className="curved-bg-bottom-register"></div>
      <div className="registerPage-inregisterscreen">
        <div className="image-column-inregisterscreen">
          <div className="overlay"></div>
          <div className="image-content">
            <div className="image-text">
              <h2>Join Our Community</h2>
              <p>Start your journey to amazing hairstyles</p>
            </div>
            <div className="image-wrapper">
              <img src="/barber.png" alt="Barber Shop" className="feature-image" />
            </div>
            <div className="Login-btn-inregisterscreen">
              Already have an account?
              <a onClick={() => navigate('/login')}> Login now</a>
            </div>
          </div>
        </div>
        <div className="register-form-inregisterscreen">
          <div className="logo-inregisterscreen">
            <img src="/LOGO1.png" alt="Logo" className="logo-image" />
          </div>
          <h2>Register</h2>
          <form onSubmit={handleSubmit}>
            <div className="profile-picture-input-container">
              <label htmlFor="profilePicture"
                className={`profile-picture-circle ${invalidFields.includes('profilePicture') ? 'input-error' : ''
                  }`}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile preview" />
                ) : (
                  <div className="profile-picture-placeholder">
                    <FaUserCircle />
                  </div>
                )}
              </label>
              <input
                type="file"
                id="profilePicture"
                name="profilePicture"
                className="profile-picture-input"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            <div className="input-container-inregisterscreen">
              <input
                type="text"
                id="fullname"
                name="fullname"
                placeholder=" "
                value={formData.fullname}
                onChange={handleChange}
                className={invalidFields.includes('fullname') ? 'input-error' : ''}
              />
              <label htmlFor="fullname">Full Name</label>
              {fullnameError && <div className="input-error-message">{fullnameError}</div>}
            </div>
            <div className="input-container-inregisterscreen">
              <input
                type="text"
                id="username"
                name="username"
                placeholder=" "
                value={formData.username}
                onChange={handleChange}
                className={invalidFields.includes('username') ? 'input-error' : ''}
              />
              <label htmlFor="username">Username</label>
            </div>
            <div className="input-container-inregisterscreen">
              <input
                type="email"
                id="email"
                name="email"
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
                className={invalidFields.includes('email') ? 'input-error' : ''}
              />
              <label htmlFor="email">Email</label>
            </div>
            <div className="input-container-inregisterscreen">
              <input
                type="password"
                id="password"
                name="password"
                placeholder=" "
                value={formData.password}
                onChange={handleChange}
                className={invalidFields.includes('password') ? 'input-error' : ''}
              />
              <label htmlFor="password">Password</label>
            </div>
            <div className="input-container-inregisterscreen">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder=" "
                value={confirmPassword}
                onChange={handleChange}
                className={invalidFields.includes('confirmPassword') ? 'input-error' : ''}
              />
              <label htmlFor="confirmPassword">Confirm Password</label>
            </div>
            <button
              type="submit"
              className="btn-inregisterscreen"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                <>Register <span>→</span></>
              )}
            </button>
          </form>
          {/* Add mobile-only class to this div */}
          <div className="Login-btn-inregisterscreen mobile-only">
            Already have an account?
            <a onClick={() => navigate('/login')}> Login now</a>
          </div>
        </div>
      </div>

      {showVerification && (
        <div className="verification-modal-overlay">
          <div className="verification-modal">
            <h2>Email Verification</h2>
            <p className="verification-text">We've sent a verification code to:</p>
            <p className="verification-email">{formData.email}</p>
            <p className="verification-hint">Please check your inbox and enter the code below</p>

            {verificationError && (
              <div className="error-message" style={{ marginBottom: '1rem' }}>
                {verificationError}
              </div>
            )}
            {verificationSuccessMessage && (
              <div className="success-message" style={{ marginBottom: '1rem' }}>
                {verificationSuccessMessage}
              </div>
            )}

            <div className="verification-input-container">
              <input
                type="text"
                className="verification-input"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  // Clear error message when user starts typing
                  if (verificationError) {
                    setVerificationError('');
                  }
                }}
                maxLength={6}
                placeholder="Enter code"
              />
            </div>

            <div className="verification-buttons">
              <button
                className="verification-button verify-btn"
                onClick={handleVerificationSubmit}
                disabled={isVerifying}
              >
                {isVerifying ? <div className="spinner"></div> : 'Verify'}
              </button>
              <button
                className="verification-button resend-btn"
                onClick={resendVerificationCode}
                disabled={isVerifying || isResending}
              >
                {isResending ? <div className="spinner"></div> : 'Resend Code'}
              </button>
            </div>

            <p className="verification-footer">
              Didn't receive the code? Check your spam folder or click resend
            </p>
          </div >
        </div >
      )}
    </div >
  );
};

export default Register;
