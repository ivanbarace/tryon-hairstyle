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

    const handleForgotPassword = () => {
        navigate('/forgot-password', { state: { from: 'changePassword' } });
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`http://localhost:5000/verify-credentials`, {
                email,
                password: currentPassword,
                userId: userData?.id
            });

            if (response.data.success) {
                setShowModal(true); // Show password update modal directly
            } else {
                setError('Invalid email or password');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred while verifying credentials');
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword === currentPassword) {
            setError('New password must be different from your current password');
            return;
        }

        try {
            const response = await axios.post(`http://localhost:5000/update-password`, {
                email,
                newPassword,
                userId: userData?.id
            });

            if (response.data.success) {
                setSuccessMessage('Password updated successfully!');
                setTimeout(() => {
                    setShowModal(false);
                    navigate('/user/profile');
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to update password');
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || 'An error occurred');
            } else {
                setError('An error occurred');
            }
            console.error('Error:', error);
        }
    };

    const handleBack = () => {
        navigate('/user/profile');
    };

    return (
        <div className="change-password-container">
            <div className="change-password-card">
                <button className="back-button" onClick={handleBack}>
                    <FaArrowLeft /> Back
                </button>
                <h2>Change Password</h2>
                <p>Please enter your details to continue</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleConfirm}>
                    <div className="form-group">
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

                    <div className="form-group">
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

                    <div className="button-group">
                        <button type="submit" className="confirm-button">
                            Confirm
                        </button>
                        <button
                            type="button"
                            className="forgot-password-button"
                            onClick={handleForgotPassword}
                        >
                            Forgot Password?
                        </button>
                    </div>
                </form>
            </div>

            {showModal && (
                <div className="verification-modal-overlay">
                    <div className="verification-modal">
                        <button
                            className="close-modal-button"
                            onClick={() => setShowModal(false)}
                            title="Close"
                        >
                            <FaTimes />
                        </button>
                        <h3>
                            <FaLock style={{ marginRight: '10px' }} />
                            Update Password
                        </h3>
                        <form onSubmit={handleUpdatePassword}>
                            <div className="password-requirements">
                                Password requirements:
                                <ul>
                                    <li>At least 6 characters long</li>
                                    <li>Both passwords must match</li>
                                </ul>
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New Password"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    required
                                />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            {successMessage && (
                                <div className="success-message">
                                    <FaCheck /> {successMessage}
                                </div>
                            )}
                            <button type="submit" className="update-button">
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

