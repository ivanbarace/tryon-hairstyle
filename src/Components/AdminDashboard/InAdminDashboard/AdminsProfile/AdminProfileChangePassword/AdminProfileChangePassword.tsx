import React, { useState } from 'react';
import './AdminProfileChangePassword.css';
import LoadingAnimation from '../../LoadingAnimation/LoadingAnimation';

interface AdminProfileChangePasswordProps {
    adminId?: number;
    setActiveSection: (section: 'info' | 'edit' | 'password') => void;
}

interface PasswordForm {
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface ApiResponse {
    success?: boolean;
    error?: string;
    admin_id?: number;
    message?: string;
}

const AdminProfileChangePassword: React.FC<AdminProfileChangePasswordProps> = ({
    adminId,
    setActiveSection
}) => {
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [passwordForm, setPasswordForm] = useState<PasswordForm>({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handlePasswordVerification = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}admin/verify-credentials`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: passwordForm.email,
                    currentPassword: passwordForm.currentPassword,
                }),
            });

            const data: ApiResponse = await response.json();

            if (response.ok && data.success) {
                setIsVerified(true);
                setSuccessMessage('Credentials verified. Please enter your new password.');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch {
            setError('Error verifying credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (!adminId) {
            setError('Admin ID is missing');
            setIsLoading(false);
            return;
        }

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
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}admin/update-password/${adminId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data: ApiResponse = await response.json();

            if (response.ok && data.success) {
                setSuccessMessage(data.message || 'Password updated successfully');
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
                setError(data.error || 'Error updating password');
            }
        } catch {
            setError('Error updating password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <LoadingAnimation />;

    return (
        <div className="change-password-section-inAdminProfileChangePassword">
            {(error || successMessage) && (
                <div className="message-container-inAdminProfileChangePassword">
                    {error && <div className="error-message-inAdminProfileChangePassword">{error}</div>}
                    {successMessage && <div className="success-message-inAdminProfileChangePassword">{successMessage}</div>}
                </div>
            )}
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

                    <div className="form-buttons-inAdminProfileChangePassword">
                        <button type="submit" className="update-btn-inAdminProfileChangePassword">Update Password</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AdminProfileChangePassword;
