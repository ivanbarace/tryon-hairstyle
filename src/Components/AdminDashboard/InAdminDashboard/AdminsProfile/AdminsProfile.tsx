import React, { useState, useEffect } from 'react';
import './AdminsProfile.css';
import AdminProfileNavigation from './AdminProfileNavigation/AdminProfileNavigation';
import AdminProfileEditProfile from './AdminProfileEditProfile/AdminProfileEditProfile';
import AdminProfileChangePassword from './AdminProfileChangePassword/AdminProfileChangePassword';
import AdminProfileInfo from './AdminProfileInfo/AdminProfileInfo';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';

interface AdminData {
  admin_id: number;
  fullname: string;
  username: string;
  email?: string;
  profile_picture?: string;
  role: string;
  phone_number?: string;
  address?: string;
}

const AdminsProfile: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'info' | 'edit' | 'password'>('info');
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const userData = localStorage.getItem('userData');
        if (!userData) {
          throw new Error('No user data found');
        }

        const parsedData = JSON.parse(userData);
        const adminId = parsedData.admin_id || parsedData.user?.admin_id;

        if (!adminId) {
          throw new Error('Admin ID not found in user data');
        }

        const response = await fetch(`http://${window.location.hostname}:5000/admin/${adminId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch admin data');
        }

        const data = await response.json();
        const adminDataWithUsername = {
          ...data,
          username: data.username || parsedData.username || parsedData.user?.username
        };

        setAdminData(adminDataWithUsername);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching admin data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (isLoading) return <LoadingAnimation />;
  if (error) return <div className="admin-profile-error">{error}</div>;

  return (
    <div className="admin-profile-layout">
      <div className="admin-profile-left">
        <div className="admin-profile-header">
          <div className="profile-picture-container">
            {adminData?.profile_picture ? (
              <img
                src={`http://${window.location.hostname}:5000/uploads/${adminData.profile_picture}`}
                alt="Admin profile"
                className="admin-profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                {adminData?.fullname?.charAt(0) || 'A'}
              </div>
            )}
          </div>
          <h2>{adminData?.fullname}</h2>
          <span className="admin-role-badge">{adminData?.role}</span>
        </div>
      </div>

      <div className="admin-profile-right">
        <div className="admin-profile-nav">
          <AdminProfileNavigation
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        </div>
        <div className="admin-profile-content">
          {activeSection === 'info' && adminData && (
            <AdminProfileInfo adminData={adminData} />
          )}
          {activeSection === 'edit' && adminData && (
            <AdminProfileEditProfile
              adminData={adminData}
              setAdminData={setAdminData}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === 'password' && (
            <AdminProfileChangePassword
              adminId={adminData?.admin_id}
              setActiveSection={setActiveSection}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminsProfile;