import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarInAdmin from './InAdminDashboard/SidebarInAdmin/SidebarInAdmin';
import TopbarInAdmin from './InAdminDashboard/TopbarInAdmin/TopbarInAdmin';
import DashboardInAdmin from './InAdminDashboard/DashboardInAdmin/DashboardInAdmin';
import UsersInAdmin from './InAdminDashboard/UsersInAdmin/UsersInAdmin';
import HairstylesInAdmin from './InAdminDashboard/HairstylesInAdmin/HairstylesInAdmin';
import CommentsRatings from './InAdminDashboard/CommentsRatings/CommentsRatings';
import AdminsProfile from './InAdminDashboard/AdminsProfile/AdminsProfile';
import ArchiveInAdmin from './InAdminDashboard/ArchiveInAdmin/ArchiveInAdmin';
import MessageInAdmin from './InAdminDashboard/MessageInAdmin/MessageInAdmin';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'admin-dashboard') {
      setCurrentPage(path);
    } else {
      navigate('/admin-dashboard/dashboard');
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('isAdminAuthenticated');
    navigate('/login');
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    navigate(`/admin-dashboard/${page}`);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardInAdmin />;
      case 'users':
        return <UsersInAdmin />;
      case 'hairstyles':
        return <HairstylesInAdmin />;
      case 'archive':
        return <ArchiveInAdmin />;
      case 'comments':
        return <CommentsRatings />;
      case 'admin-profile':
        return <AdminsProfile />;
      case 'messages':
        return <MessageInAdmin />;
      default:
        return <DashboardInAdmin />;
    }
  };

  return (
    <div className="admin-container">
      <SidebarInAdmin setCurrentPage={handlePageChange} />
      <div className="main-content">
        <TopbarInAdmin
          onLogout={handleLogout}
          setCurrentPage={handlePageChange}
        />
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
