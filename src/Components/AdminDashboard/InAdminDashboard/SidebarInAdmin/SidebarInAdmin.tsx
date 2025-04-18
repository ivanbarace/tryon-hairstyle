import React, { useState, useEffect } from 'react';
import './SidebarInAdmin.css';
import { RiDashboardLine, RiMessage2Line } from 'react-icons/ri';
import { FiUsers } from 'react-icons/fi';
import { MdOutlineContentCut } from 'react-icons/md';
import { HiMenuAlt2 } from 'react-icons/hi';
import { BsArchive } from 'react-icons/bs';

interface SidebarProps {
  setCurrentPage: (page: string) => void;
  refreshTrigger?: number; // Add this prop
}

const SidebarInAdmin: React.FC<SidebarProps> = ({ setCurrentPage, refreshTrigger }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePage, setActivePage] = useState(() => {
    // Get initial state from localStorage or default to 'dashboard'
    return localStorage.getItem('adminActivePage') || 'dashboard';
  });
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    fetchTotalPending();
    // Reduce interval to 1 second for faster updates
    const interval = setInterval(fetchTotalPending, 1000);

    // Set current page on component mount
    setCurrentPage(activePage);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [refreshTrigger]); // Add refreshTrigger to dependencies

  const fetchTotalPending = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}messages/total-pending`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setTotalPending(data.total);
    } catch (error) {
      console.error('Error fetching total pending:', error);
    }
  };

  const handlePageChange = (page: string) => {
    setActivePage(page);
    setCurrentPage(page);
    // If switching to messages page, reset the badge
    if (page === 'messages') {
      setTotalPending(0);
    }
    // Store the active page in localStorage
    localStorage.setItem('adminActivePage', page);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        className="collapse-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title="Collapse Sidebar"
      >
        <HiMenuAlt2 />
      </button>

      <div className="logo-container">
        {!isCollapsed && (
          <>
            <div className="logo">
              <img src="/LOGO2.png" alt="TryOnHair Logo" />
            </div>
          </>
        )}
      </div>

      <nav className="nav-menu">
        <button
          onClick={() => handlePageChange('dashboard')}
          className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
        >
          <RiDashboardLine className="icon" />
          {!isCollapsed && <span>Dashboard</span>}
        </button>

        <button
          onClick={() => handlePageChange('users')}
          className={`nav-item ${activePage === 'users' ? 'active' : ''}`}
        >
          <FiUsers className="icon" />
          {!isCollapsed && <span>Users</span>}
        </button>

        <button
          onClick={() => handlePageChange('hairstyles')}
          className={`nav-item ${activePage === 'hairstyles' ? 'active' : ''}`}
        >
          <MdOutlineContentCut className="icon" />
          {!isCollapsed && <span>Hairstyles</span>}
        </button>

        <button
          onClick={() => handlePageChange('archive')}
          className={`nav-item ${activePage === 'archive' ? 'active' : ''}`}
        >
          <BsArchive className="icon" />
          {!isCollapsed && <span>Archive</span>}
        </button>

        <button
          onClick={() => handlePageChange('comments')}
          className={`nav-item ${activePage === 'comments' ? 'active' : ''}`}
        >
          <RiMessage2Line className="icon" />
          {!isCollapsed && <span>Comments & Ratings</span>}
        </button>

        <button
          onClick={() => handlePageChange('messages')}
          className={`nav-item ${activePage === 'messages' ? 'active' : ''}`}
        >
          <div className="nav-item-content">
            <RiMessage2Line className="icon" />
            {!isCollapsed && <span>Messages</span>}
            {totalPending > 0 && (
              <div className="message-badge">{totalPending}</div>
            )}
          </div>
        </button>
      </nav>
    </div>
  );
};

export default SidebarInAdmin;
