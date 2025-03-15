import React, { useState, useRef, useEffect } from 'react';
import './TopbarInAdmin.css';
import { FiUser } from 'react-icons/fi';
import { RiLogoutBoxRLine } from 'react-icons/ri';

interface TopbarProps {
  onLogout: () => void;
  setCurrentPage: (page: string) => void;
  adminData?: AdminData;  // Add this prop
  onAdminDataChange?: (data: AdminData) => void;  // Add this prop
}

interface AdminData {
  admin_id: number;  // Update interface to match backend
  profile_picture?: string;
  fullname?: string;
}

const TopbarInAdmin: React.FC<TopbarProps> = ({
  onLogout,
  setCurrentPage,
  adminData: propAdminData,  // Rename to avoid conflict
  onAdminDataChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [localAdminData, setLocalAdminData] = useState<AdminData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If we receive adminData as a prop, use it
    if (propAdminData) {
      setLocalAdminData(propAdminData);
      return;
    }

    // Otherwise, fetch it from the server
    const fetchAdminData = async () => {
      try {
        const userData = localStorage.getItem('userData');
        if (!userData) return;

        const parsedData = JSON.parse(userData);
        // Check both possible locations of admin_id
        const adminId = parsedData.admin_id || parsedData.user?.admin_id;

        console.log('Parsed userData:', parsedData); // Debug log
        console.log('Admin ID:', adminId); // Debug log

        if (!adminId) {
          throw new Error('Admin ID not found in user data');
        }

        const response = await fetch(`http://${window.location.hostname}:5000/admin/${adminId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch admin data');
        }

        const data = await response.json();
        console.log('Fetched admin data:', data); // Debug log
        setLocalAdminData(data);
        if (onAdminDataChange) {
          onAdminDataChange(data);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    fetchAdminData();
  }, [propAdminData, onAdminDataChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setIsDropdownOpen(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="topbar-right" ref={dropdownRef}>
          <div className="admin-info">
            <span className="admin-name">{localAdminData?.fullname || 'Admin'}</span>
            <button
              className="profile-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="Profile Menu"
            >
              {localAdminData?.profile_picture ? (
                <img
                  src={`http://${window.location.hostname}:5000/uploads/${localAdminData.profile_picture}`}
                  alt="Admin profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-placeholder">
                  {localAdminData?.fullname?.charAt(0) || 'A'}
                </div>
              )}
            </button>
          </div>

          {isDropdownOpen && (
            <div className="settings-dropdown">
              <button
                className="dropdown-item"
                onClick={() => {
                  setCurrentPage('admin-profile');
                  setIsDropdownOpen(false);
                }}
              >
                <FiUser className="dropdown-icon" />
                <span>My Profile</span>
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={handleLogoutClick}>
                <RiLogoutBoxRLine className="dropdown-icon" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className="logout-modal-buttons">
              <button className="confirm-logout-btn" onClick={handleConfirmLogout}>
                Yes, Logout
              </button>
              <button className="cancel-logout-btn" onClick={handleCancelLogout}>
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopbarInAdmin;
