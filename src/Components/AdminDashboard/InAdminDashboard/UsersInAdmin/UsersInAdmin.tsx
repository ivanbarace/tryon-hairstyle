import React, { useState, useEffect } from 'react';
import './UsersInAdmin.css';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';

interface User {
  user_id: number;
  fullname: string;
  username: string;
  role: string;
  created_at: string;
  profile_picture: string; // Add this field
}

const UsersInAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://${window.location.hostname}:5000/users`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
        setLoading(false);
      } catch (err) {
        setError('Error loading users');
        setLoading(false);
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <LoadingAnimation />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="users-content-User-inAdminScreen">
      <h2>Users Management</h2>
      <div className="users-table-User-inAdminScreen">
        <table>
          <thead><tr>
            <th>ID</th>
            <th>Profile Picture</th>
            <th>Full Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Created At</th>
          </tr></thead>
          <tbody>{users.map((user) => (
            <tr key={user.user_id}>
              <td>{user.user_id}</td>
              <td>
                <img
                  src={`http://${window.location.hostname}:5000/${user.profile_picture}`}
                  alt={`${user.fullname}'s profile`}
                  className="profile-picture-User-inAdminScreen"
                />
              </td>
              <td>{user.fullname}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersInAdmin;