import React from 'react';
import './AdminProfileNavigation.css';
import { FiEdit2, FiLock, FiInfo } from 'react-icons/fi';

interface AdminProfileNavigationProps {
    activeSection: 'info' | 'edit' | 'password';
    setActiveSection: (section: 'info' | 'edit' | 'password') => void;
}

const AdminProfileNavigation: React.FC<AdminProfileNavigationProps> = ({
    activeSection,
    setActiveSection,
}) => {
    return (
        <div className="admin-profile-navigation">
            <button
                className={`nav-button ${activeSection === 'info' ? 'active' : ''}`}
                onClick={() => setActiveSection('info')}
            >
                <FiInfo /> Info
            </button>
            <button
                className={`nav-button ${activeSection === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveSection('edit')}
            >
                <FiEdit2 /> Edit Profile
            </button>
            <button
                className={`nav-button ${activeSection === 'password' ? 'active' : ''}`}
                onClick={() => setActiveSection('password')}
            >
                <FiLock /> Change Password
            </button>
        </div>
    );
};

export default AdminProfileNavigation;
