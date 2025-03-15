import React, { useState } from 'react';
import './AdminProfileChangePassword.css';
import LoadingAnimation from '../../LoadingAnimation/LoadingAnimation';

interface AdminProfileChangePasswordProps {
    adminId?: number;
    setActiveSection: (section: 'info' | 'edit' | 'password') => void;
}

const AdminProfileChangePassword: React.FC<AdminProfileChangePasswordProps> = ({
    adminId,
    setActiveSection
}) => {
    const [isVerified, setIsVerified] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`http://${window.location.hostname}:5000/admin/verify-credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: passwordForm.email,
                    currentPassword: passwordForm.currentPassword,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setIsVerified(true);
                setSuccessMessage('Credentials verified. Please enter your new password.');
            } else {
                setError(data.error);
            }
        } catch {
            setError('Error verifying credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (passwordForm.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://${window.location.hostname}:5000/admin/update-password/${adminId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccessMessage('Password updated successfully');
                setPasswordForm({
                    email: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                setIsVerified(false);
                setTimeout(() => {
                    setActiveSection('info');
                }, 1500);
            } else {
                setError(data.error);
            }
        } catch (err) {
            console.error('Error updating password:', err);
            setError('Error updating password');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingAnimation />;

    return (
        <div className="change-password-section-inAdminProfileChangePassword">
            <h3>Change Password</h3>
            {!isVerified ? (
                <form onSubmit={handlePasswordVerification}>
                    <div className="form-group-inAdminProfileChangePassword">
                        <label>Email</label>
                        <input
                            type="email"
                            value={passwordForm.email}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group-inAdminProfileChangePassword">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            required
                            title="Current Password"
                            placeholder="Enter your current password"
                        />
                    </div>

                    {error && <div className="error-message-inAdminProfileChangePassword">{error}</div>}
                    {successMessage && <div className="success-message-inAdminProfileChangePassword">{successMessage}</div>}

                    <div className="form-buttons-inAdminProfileChangePassword">
                        <button type="submit" className="verify-btn-inAdminProfileChangePassword">Verify</button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handlePasswordUpdate}>
                    <div className="form-group-inAdminProfileChangePassword">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            required
                            minLength={6}
                            title="New Password"
                            placeholder="Enter your new password"
                        />
                    </div>

                    <div className="form-group-inAdminProfileChangePassword">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            minLength={6}
                            title="Confirm New Password"
                            placeholder="Confirm your new password"
                        />
                    </div>

                    {error && <div className="error-message-inAdminProfileChangePassword">{error}</div>}
                    {successMessage && <div className="success-message-inAdminProfileChangePassword">{successMessage}</div>}

                    <div className="form-buttons-inAdminProfileChangePassword">
                        <button type="submit" className="update-btn-inAdminProfileChangePassword">Update Password</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AdminProfileChangePassword;
