import React, { useState, useEffect } from 'react';
import './MessageInAdmin.css';
import { format } from 'date-fns';

interface User {
    user_id: number;
    fullname: string;
    profile_picture?: string;
    email: string;
    unread_count: number;
    pending_count: number;
}

interface Message {
    id: number;
    message: string;
    created_at: string;
    status: 'pending' | 'seen';
}

const MessageInAdmin: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchUsers();
        const usersInterval = setInterval(fetchUsers, 1000);

        return () => clearInterval(usersInterval);
    }, [refreshKey]);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.user_id);
            const messagesInterval = setInterval(() => fetchMessages(selectedUser.user_id), 1000);

            return () => clearInterval(messagesInterval);
        }
    }, [selectedUser, refreshKey]);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}messages/users`);
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchMessages = async (userId: number) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}messages/user/${userId}`);
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleUserClick = async (user: User) => {
        setSelectedUser(user);
        await fetchMessages(user.user_id);

        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}messages/update-status/${user.user_id}`, {
                method: 'PUT'
            });
            fetchUsers();
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error updating message status:', error);
        }
    };

    return (
        <div className="message-container" key={refreshKey}>
            <div className="users-list">
                <h2>Users with Messages</h2>
                {users.map((user) => (
                    <div
                        key={user.user_id}
                        className={`user-item ${selectedUser?.user_id === user.user_id ? 'active' : ''} ${user.pending_count > 0 ? 'has-pending' : ''}`}
                        onClick={() => handleUserClick(user)}
                    >
                        <div className="user-item-content">
                            <div className="user-avatar">
                                {user.profile_picture ? (
                                    <img
                                        src={`${import.meta.env.VITE_BACKEND_URL}${user.profile_picture}`}
                                        alt={user.fullname}
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user.fullname.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="user-info">
                                <div className="user-name">{user.fullname}</div>
                                <div className="user-email">{user.email}</div>
                            </div>
                            {user.pending_count > 0 && (
                                <div className="pending-badge">{user.pending_count}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="message-content">
                {selectedUser ? (
                    <>
                        <h2>Messages from {selectedUser.fullname}</h2>
                        <div className="messages-list">
                            {messages.map((message) => (
                                <div key={message.id} className={`message-item ${message.status}`}>
                                    <div className="message-text">{message.message}</div>
                                    <div className="message-time">
                                        {format(new Date(message.created_at), 'MMMM d, yyyy h:mm a')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="no-selection">
                        <p>Select a user to view their messages</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageInAdmin;
