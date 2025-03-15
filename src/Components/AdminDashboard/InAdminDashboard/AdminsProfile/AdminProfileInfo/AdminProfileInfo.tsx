import React from 'react';
import './AdminProfileInfo.css';

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

interface AdminProfileInfoProps {
    adminData: AdminData;
}

const AdminProfileInfo: React.FC<AdminProfileInfoProps> = ({ adminData }) => {
    return (
        <div className="admin-info-container">
            <h3>Admin Information</h3>
            <div className="admin-info-grid">
                <div className="info-item">
                    <label>Admin ID:</label>
                    <p>{adminData.admin_id}</p>
                </div>

                <div className="info-item">
                    <label>Username:</label>
                    <p>{adminData.username}</p>
                </div>

                <div className="info-item">
                    <label>Full Name:</label>
                    <p>{adminData.fullname}</p>
                </div>

                <div className="info-item">
                    <label>Role:</label>
                    <p>{adminData.role}</p>
                </div>

                {adminData.email && (
                    <div className="info-item">
                        <label>Email:</label>
                        <p>{adminData.email}</p>
                    </div>
                )}

                {adminData.phone_number && (
                    <div className="info-item">
                        <label>Phone Number:</label>
                        <p>{adminData.phone_number}</p>
                    </div>
                )}

                {adminData.address && (
                    <div className="info-item full-width">
                        <label>Address:</label>
                        <p>{adminData.address}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProfileInfo;
