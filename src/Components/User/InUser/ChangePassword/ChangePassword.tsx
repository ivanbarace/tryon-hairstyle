import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChangePassword.css';
import { FaArrowLeft, FaCheck, FaTimes, FaLock } from 'react-icons/fa';
import axios from 'axios';

const ChangePassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'error' | 'success' }>>([]);

    interface UserData {
        id: string;
    }

    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
        }
    }, []);

    const validatePassword = (password: string) => {
        if (password.length < 8) {
            return "Password must be at least 8 characters long";
        }

        if (/^\d+$/.test(password)) {
            return "Password cannot contain only numbers";
        }

        if (/123456789|987654321|12345678|11111111|00000000/.test(password)) {
            return "Password cannot contain common number sequences";
        }

        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter";
        }

        if (!/[a-z]/.test(password)) {
            return "Password must contain at least one lowercase letter";
        }

        if ((password.match(/\d/g) || []).length < 2) {
            return "Password must contain at least 2 numbers";
        }

        if (!/[~!@#$%^&*()_+{:">?"`|}-]/.test(password)) {
            return "Password must contain at least one special character";
        }

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

        return null;
    };

    const showToast = (message: string, type: 'error' | 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password', { state: { from: 'changePassword' } });
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}verify-credentials`, {
                email,
                password: currentPassword,
                userId: userData?.id
            });

            if (response.data.success) {
                setShowModal(true);
            } else {
                showToast('Invalid email or password', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('An error occurred while verifying credentials', 'error');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            showToast(passwordError, 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (newPassword === currentPassword) {
            showToast('New password must be different from your current password', 'error');
            return;
        }

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}update-password`, {
                email,
                newPassword,
                userId: userData?.id
            });

            if (response.data.success) {
                showToast('Password updated successfully!', 'success');
                setTimeout(() => {
                    setShowModal(false);
                    navigate('/user/profile');
                }, 2000);
            } else {
                showToast(response.data.message || 'Failed to update password', 'error');
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                showToast(error.response?.data?.message || 'An error occurred', 'error');
            } else {
                showToast('An error occurred', 'error');
            }
            console.error('Error:', error);
        }
    };

    const handleBack = () => {
        navigate('/user/profile');
    };

    return (
        <div className="change-password-container-inchangepassword-userscreen">
            <div className="toast-container-inchangepassword-userscreen">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast-message-inchangepassword-userscreen ${toast.type}`}
                        onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    >
                        {toast.type === 'error' ? <FaTimes /> : <FaCheck />}
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>

            <div className="change-password-card-inchangepassword-userscreen">
                <button className="back-button-inchangepassword-userscreen" onClick={handleBack}>
                    <FaArrowLeft /> Back
                </button>
                <h2>Change Password</h2>
                <p>Please enter your details to continue</p>

                {error && <div className="error-message-inchangepassword-userscreen">{error}</div>}

                <form onSubmit={handleConfirm}>
                    <div className="form-group-inchangepassword-userscreen">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                        />
                    </div>

                    <div className="form-group-inchangepassword-userscreen">
                        <label htmlFor="currentPassword">Current Password</label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter your current password"
                            required
                        />
                    </div>

                    <div className="button-group-inchangepassword-userscreen">
                        <button type="submit" className="confirm-button-inchangepassword-userscreen">
                            Confirm
                        </button>
                        <button
                            type="button"
                            className="forgot-password-button-inchangepassword-userscreen"
                            onClick={handleForgotPassword}
                        >
                            Forgot Password?
                        </button>
                    </div>
                </form>
            </div>

            {showModal && (
                <div className="verification-modal-overlay-inchangepassword-userscreen">
                    <div className="verification-modal-inchangepassword-userscreen">
                        <button
                            className="close-modal-button-inchangepassword-userscreen"
                            onClick={() => {
                                setShowModal(false);
                                setError('');
                            }}
                            title="Close"
                        >
                            <FaTimes />
                        </button>
                        <h3>
                            <FaLock style={{ marginRight: '10px' }} />
                            Update Password
                        </h3>
                        <form onSubmit={handleUpdatePassword}>
                            {error && <div className="error-message-inchangepassword-userscreen">{error}</div>}
                            <div className="form-group-inchangepassword-userscreen">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New Password"
                                    required
                                />
                            </div>
                            <div className="form-group-inchangepassword-userscreen">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    required
                                />
                            </div>
                            {successMessage && (
                                <div className="success-message-inchangepassword-userscreen">
                                    <FaCheck /> {successMessage}
                                </div>
                            )}
                            <button type="submit" className="update-button-inchangepassword-userscreen">
                                Update Password
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChangePassword;

