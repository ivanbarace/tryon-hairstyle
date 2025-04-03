import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DashboardInAdmin.css';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';
import { FaUsers, FaHeart, FaStar, FaCut } from 'react-icons/fa';
import { MdTimeline } from 'react-icons/md';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  ChartData,
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

interface DashboardStats {
  totalUsers: number;
  totalHairstyles: number;
  faceShapeStats: Array<{ faceshape: string; count: number }>;
  hairTypeStats: Array<{ hairtype: string; count: number }>;
  hairLengthStats: Array<{ hair_length: string; count: number }>;
  averageRating: number;
  totalRatings: number;
  recentHairstyles: Array<{ hairstyle_name: string; created_at: string }>;
  userGrowth: Array<{ month: string; new_users: number }>;
  hairstyleGrowth: Array<{ date: string; hairstyles_added: number }>;
  users: Array<{
    user_id: number;
    fullname: string;
    profile_picture: string | null;
    email: string;
  }>;
}

const DashboardInAdmin: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}dashboard-stats`);
        if (response.data.success) {
          setStats(response.data.data);
        } else {
          setError('Failed to fetch statistics');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError('Error loading dashboard data');
      }
    };

    fetchStats();
  }, []);

  const getChartColors = (count: number) => {
    const brownShades = [
      'rgba(139, 69, 19, 0.8)',    // Dark brown
      'rgba(160, 82, 45, 0.7)',    // Lighter brown
      'rgba(181, 101, 71, 0.6)',   // Even lighter brown
      'rgba(205, 133, 63, 0.5)',   // Light brown
      'rgba(222, 184, 135, 0.4)',  // Very light brown
      'rgba(245, 222, 179, 0.3)',  // Lightest brown
    ];
    return Array(count).fill(0).map((_, i) => brownShades[i % brownShades.length]);
  };

  const createChartData = (stats: { [key: string]: string | number }[], labelKey: string) => {
    const labels = stats.map(stat => stat[labelKey]);
    const data = stats.map(stat => stat.count);
    const colors = getChartColors(labels.length);

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      }]
    };
  };

  const createLineChartData = (): ChartData<'line', number[], string> => {
    if (!stats) return { labels: [], datasets: [] };

    const days = stats.hairstyleGrowth.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    });

    return {
      labels: days,
      datasets: [
        {
          label: 'Hairstyles Added',
          data: stats.hairstyleGrowth.map(item => item.hairstyles_added),
          borderColor: 'rgba(139, 69, 19, 0.8)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.1,
          fill: true,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Daily Hairstyle Activity' // Updated title
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        title: {
          display: true,
          text: 'Hairstyles Added' // Updated axis label
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    maintainAspectRatio: false // This helps with custom sizing
  };

  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return <LoadingAnimation />;

  const faceShapeData = createChartData(stats.faceShapeStats, 'faceshape');
  const hairTypeData = createChartData(stats.hairTypeStats, 'hairtype');
  const hairLengthData = createChartData(stats.hairLengthStats, 'hair_length');

  return (
    <div className="dashboard-content-inDashboard-screen">
      <h2><MdTimeline className="header-icon-inDashboard-screen" /> Dashboard Overview</h2>

      <div className="stats-grid-inDashboard-screen">
        <div className="stat-card-inDashboard-screen">
          <div className="stat-icon-inDashboard-screen">
            <FaUsers />
          </div>
          <div className="stat-info-inDashboard-screen">
            <h3>Total Users</h3>
            <p className="stat-number-inDashboard-screen">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card-inDashboard-screen">
          <div className="stat-icon-inDashboard-screen">
            <FaCut />
          </div>
          <div className="stat-info-inDashboard-screen">
            <h3>Total Hairstyles</h3>
            <p className="stat-number-inDashboard-screen">{stats.totalHairstyles}</p>
          </div>
        </div>

        <div className="stat-card-inDashboard-screen">
          <div className="stat-icon-inDashboard-screen">
            <FaHeart />
          </div>
          <div className="stat-info-inDashboard-screen">
            <h3>Total Ratings</h3>
            <p className="stat-number-inDashboard-screen">{stats.totalRatings}</p>
          </div>
        </div>

        <div className="stat-card-inDashboard-screen">
          <div className="stat-icon-inDashboard-screen">
            <FaStar />
          </div>
          <div className="stat-info-inDashboard-screen">
            <h3>Average Rating</h3>
            <p className="stat-number-inDashboard-screen">
              {typeof stats.averageRating === 'number'
                ? stats.averageRating.toFixed(1)
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-main-content-inDashboard-screen">
        <div className="charts-section-inDashboard-screen">
          <div className="charts-grid-top-inDashboard-screen">
            <div className="chart-section pie-chart-inDashboard-screen">
              <h3>Face Shape Distribution</h3>
              <div className="chart-container-inDashboard-screen">
                <Pie data={faceShapeData} options={chartOptions} />
              </div>
            </div>

            <div className="chart-section doughnut-chart-inDashboard-screen">
              <h3>Hair Type Distribution</h3>
              <div className="chart-container-inDashboard-screen">
                <Doughnut data={hairTypeData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="charts-grid-bottom-inDashboard-screen">
            <div className="chart-section bar-chart-inDashboard-screen">
              <h3>Hair Length Distribution</h3>
              <div className="chart-container-inDashboard-screen">
                <Bar
                  data={hairLengthData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="users-section-inDashboard-screen">
          <h3>Users</h3>
          <div className="users-list-inDashboard-screen">
            {stats.users.map((user) => (
              <div key={user.user_id} className="user-item-inDashboard-screen">
                <div className="user-avatar-inDashboard-screen">
                  {user.profile_picture ? (
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}${user.profile_picture}`}
                      alt={user.fullname}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/24';
                      }}
                    />
                  ) : (
                    <div className="default-avatar-inDashboard-screen">
                      {user.fullname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-info-inDashboard-screen">
                  <div className="user-name-inDashboard-screen">{user.fullname}</div>
                  <div className="user-email-inDashboard-screen">{user.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="growth-trends-section-inDashboard-screen">
        <h3>Daily Hairstyle Activity</h3> {/* Updated section title */}
        <div className="growth-chart-container-inDashboard-screen">
          <Line data={createLineChartData()} options={lineChartOptions} />
        </div>
      </div>

      <div className="recent-section-inDashboard-screen">
        <h3>Recently Added Hairstyles</h3>
        <div className="recent-list-inDashboard-screen">
          {stats.recentHairstyles.map((hairstyle) => (
            <div key={hairstyle.hairstyle_name} className="recent-item-inDashboard-screen">
              <span>{hairstyle.hairstyle_name}</span>
              <span>{new Date(hairstyle.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}</span>
            </div>
          ))}
        </div>
      </div>
    </div >
  );
};

export default DashboardInAdmin;
