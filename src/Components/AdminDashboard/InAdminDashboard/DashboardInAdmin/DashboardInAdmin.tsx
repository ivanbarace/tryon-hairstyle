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
  hairstyleGrowth: Array<{ month: string; new_hairstyles: number }>;
}

const DashboardInAdmin: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/dashboard-stats');
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
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
    ];
    return Array(count).fill(0).map((_, i) => colors[i % colors.length]);
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

    const months = stats.userGrowth.map(item => {
      const date = new Date(item.month + '-01');
      return date.toLocaleString('default', { month: 'short' });
    });

    return {
      labels: months,
      datasets: [
        {
          label: 'New Users',
          data: stats.userGrowth.map(item => item.new_users),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          fill: false,
        },
        {
          label: 'New Hairstyles',
          data: stats.hairstyleGrowth.map(item => item.new_hairstyles),
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1,
          fill: false,
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
        text: 'Growth Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return <LoadingAnimation />;

  const faceShapeData = createChartData(stats.faceShapeStats, 'faceshape');
  const hairTypeData = createChartData(stats.hairTypeStats, 'hairtype');
  const hairLengthData = createChartData(stats.hairLengthStats, 'hair_length');

  return (
    <div className="dashboard-content">
      <h2><MdTimeline className="header-icon" /> Dashboard Overview</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaCut />
          </div>
          <div className="stat-info">
            <h3>Total Hairstyles</h3>
            <p className="stat-number">{stats.totalHairstyles}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaHeart />
          </div>
          <div className="stat-info">
            <h3>Total Ratings</h3>
            <p className="stat-number">{stats.totalRatings}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaStar />
          </div>
          <div className="stat-info">
            <h3>Average Rating</h3>
            <p className="stat-number">
              {typeof stats.averageRating === 'number'
                ? stats.averageRating.toFixed(1)
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-section pie-chart">
          <h3>Face Shape Distribution</h3>
          <div className="chart-container">
            <Pie data={faceShapeData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-section doughnut-chart">
          <h3> Hair Type Distribution</h3>
          <div className="chart-container">
            <Doughnut data={hairTypeData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-section bar-chart">
          <h3>Hair Length Distribution</h3>
          <div className="chart-container">
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
        <div className="chart-section full-width">
          <h3>Growth Trends</h3>
          <div className="chart-container">
            <Line data={createLineChartData()} options={lineChartOptions} />
          </div>
        </div>
      </div>

      <div className="recent-section">
        <h3>Recently Added Hairstyles</h3>
        <div className="recent-list">
          {stats.recentHairstyles.map((hairstyle) => (
            <div key={hairstyle.hairstyle_name} className="recent-item">
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
