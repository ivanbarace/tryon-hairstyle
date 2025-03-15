import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditProfile.css';

interface UserData {
  id: number;
  username: string;
  fullname: string;
  profilePicture?: string;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editData, setEditData] = useState({
    username: '',
    fullname: '',
    profilePicture: null as File | null,
  });

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      fetch(`http://localhost:5000/user/${parsedData.id}`)
        .then((response) => response.json())
        .then((data) => {
          setUserData({
            id: data.user_id,
            username: data.username,
            fullname: data.fullname,
            profilePicture: data.profile_picture,
          });
          setEditData({
            username: data.username,
            fullname: data.fullname,
            profilePicture: null,
          });
          setImagePreview(data.profile_picture ? `http://${window.location.hostname}:5000/${data.profile_picture}` : null);
        });
    }
  }, []);

  const capitalizeFirstLetter = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'fullname') {
      setEditData((prev) => ({
        ...prev,
        [name]: capitalizeFirstLetter(value),
      }));
    } else {
      setEditData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditData(prev => ({ ...prev, profilePicture: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClick = () => {
    if (!userData) return;

    const formData = new FormData();
    formData.append('username', editData.username);
    formData.append('fullname', editData.fullname);
    if (editData.profilePicture) {
      formData.append('profilePicture', editData.profilePicture);
    }

    fetch(`http://localhost:5000/user/${userData.id}`, {
      method: 'PUT',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          return;
        }

        // Update localStorage with new user data
        const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        const updatedUserData = {
          ...currentUserData,
          username: data.username,
          fullname: data.fullname,
          profile_picture: data.profile_picture
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));

        navigate('/user/profile');
      })
      .catch((error) => {
        console.error('Error updating user details:', error);
        alert('Failed to update profile. Please try again.');
      });
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container-ineditprofilescreen">
      <div className="profile-card-ineditprofilescreen">
        <h2>Edit Profile</h2>

        <div className="profile-picture-edit-ineditprofilescreen">
          <div
            className="profile-picture-wrapper-ineditprofilescreen"
            onClick={handleImageClick}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile"
                className="profile-picture-ineditprofilescreen"
              />
            ) : (
              <div className="profile-picture-placeholder-ineditprofilescreen">
                <span>Click to upload image</span>
              </div>
            )}
            <div className="profile-picture-overlay-ineditprofilescreen">
              <span>Change Picture</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            name="profilePicture"
            onChange={handleImageChange}
            accept="image/*"
            className="hidden-input"
            title="Profile Picture"
            placeholder="Upload your profile picture"
          />
        </div>

        <div className="input-group-ineditprofilescreen">
          <label>Username:</label>
          <input
            type="text"
            name="username"
            value={editData.username}
            onChange={handleInputChange}
            placeholder="Enter your username"
          />
        </div>
        <div className="input-group-ineditprofilescreen">
          <label>Full Name:</label>
          <input
            type="text"
            name="fullname"
            value={editData.fullname}
            onChange={handleInputChange}
            placeholder="Enter your full name"
          />
        </div>
        <button className="save-button-ineditprofilescreen" onClick={handleSaveClick}>
          Save Changes
        </button>
        <button className="cancel-button-ineditprofilescreen" onClick={() => navigate('/user/profile')}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
