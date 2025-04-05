import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ForgotPassword.css';

interface Message {
  id: number;
  text: string;
  type: 'error' | 'success';
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isFromChangePassword, setIsFromChangePassword] = useState(false);
  const [email, setEmail] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [actualCode, setActualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('');

  useEffect(() => {
    // Check if user came from change password screen by checking the previous path
    const fromChangePwd = location.state?.from === 'changePassword';
    setIsFromChangePassword(fromChangePwd);
  }, [location]);

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

  const validatePassword = (password: string) => {
    // Check minimum length
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }

    // Check if password is only numbers
    if (/^\d+$/.test(password)) {
      return "Password cannot contain only numbers";
    }

    // Check for common number sequences
    if (/123456789|987654321|12345678|11111111|00000000/.test(password)) {
      return "Password cannot contain common number sequences";
    }

    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }

    // Check for lowercase
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }

    // Check for at least 2 numbers
    if ((password.match(/\d/g) || []).length < 2) {
      return "Password must contain at least 2 numbers";
    }

    // Check for special characters
    if (!/[~!@#$%^&*()_+{:">?"`|}-]/.test(password)) {
      return "Password must contain at least one special character";
    }

    // Check for common phrases
    const commonPhrases = [
      "iloveyou",
      "password",
      "qwerty",
      "abc123",
      "admin123",
      "welcome",
      "monkey",
    ];
    const lowerPassword = password.toLowerCase().replace(/\s/g, '');
    if (commonPhrases.some(phrase => lowerPassword.includes(phrase))) {
      return "Password contains common phrases that are not allowed";
    }

    return null; // Password is valid
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Verification code has been sent to your email.', 'success');
        setShowVerification(true);
        setActualCode(data.verificationCode);
        setAccountType(data.accountType); // Store the account type
      } else {
        showMessage(data.message || 'An error occurred', 'error');
      }
    } catch {
      showMessage('An error occurred. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode === actualCode) {
      setShowVerification(false);
      setShowPasswordReset(true);
    } else {
      showMessage('Invalid verification code', 'error');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showMessage(passwordError, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
          accountType // Include the account type in the request
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Password reset successful!', 'success');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        showMessage(data.message || 'Failed to reset password', 'error');
      }
    } catch {
      showMessage('An error occurred. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('New verification code has been sent!', 'success');
        setActualCode(data.verificationCode);
      } else {
        showMessage(data.message || 'Failed to resend code', 'error');
      }
    } catch {
      showMessage('Failed to resend code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (isFromChangePassword) {
      navigate('/user/profile/change-password');
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <div className="forgot-password-container-inForgotPasswordScreen">
        {renderMessages()}
        <div className="curved-bg-top-fp"></div>
        <div className="curved-bg-bottom-fp"></div>
        <div className="forgot-password-form-inForgotPasswordScreen">
          <h2>Forgot Password</h2>
          <p>Enter your email address to reset your password.</p>

          <form onSubmit={handleSubmit}>
            <div className="input-container-inForgotPasswordScreen">
              <input
                type="email"
                id="email"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}

              />
              <label htmlFor="email">Email Address</label>
            </div>

            <button type="submit" className="submit-btn-inForgotPasswordScreen" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Reset Password'} <span>→</span>
            </button>
          </form>

          <button
            type="button"
            className="back-btn-inForgotPasswordScreen"
            onClick={handleBack}
          >
            {isFromChangePassword ? 'Back to Change Password' : 'Back to Login'}
          </button>
        </div>
      </div>

      {showVerification && (
        <div className="verification-modal-overlay-inForgotPasswordScreen">
          <div className="verification-modal-inForgotPasswordScreen">
            <h3>Enter Verification Code</h3>
            <p className="verification-text-inForgotPasswordScreen">We've sent a code to:</p>
            <p className="verification-email-inForgotPasswordScreen">{email}</p>
            <p className="verification-hint-inForgotPasswordScreen">Please check your inbox and enter the code below</p>

            <form onSubmit={handleVerification}>
              <div className="verification-input-container-inForgotPasswordScreen">
                <input
                  type="text"
                  className="verification-input-inForgotPasswordScreen"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  placeholder="Enter code"
                  required
                />
              </div>

              <div className="verification-buttons-inForgotPasswordScreen">
                <button type="submit" className="verification-button-inForgotPasswordScreen verify-btn-inForgotPasswordScreen">
                  Verify Code
                </button>
                <button
                  type="button"
                  className="verification-button-inForgotPasswordScreen resend-btn-inForgotPasswordScreen"
                  onClick={resendVerificationCode}
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </form>

            <p className="verification-footer-inForgotPasswordScreen">
              Didn't receive the code? Check your spam folder or click resend
            </p>
          </div>
        </div>
      )}

      {showPasswordReset && (
        <div className="verification-modal-overlay-inForgotPasswordScreen">
          <div className="verification-modal-inForgotPasswordScreen">
            <h3>Reset Password</h3>
            <p className="verification-text-inForgotPasswordScreen">Create your new password</p>

            <form onSubmit={handlePasswordReset}>
              <div className="input-container-inForgotPasswordScreen">
                <input
                  type="password"
                  id="newPassword"
                  placeholder=" "
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <label htmlFor="newPassword">New Password</label>
              </div>

              <div className="input-container-inForgotPasswordScreen">
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <label htmlFor="confirmPassword">Confirm Password</label>
              </div>

              <button type="submit" className="submit-btn-inForgotPasswordScreen" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'} <span>→</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ForgotPassword;
