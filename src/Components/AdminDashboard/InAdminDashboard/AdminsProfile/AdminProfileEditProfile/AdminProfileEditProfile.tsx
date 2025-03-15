import React, { useState, useRef } from 'react';
import './AdminProfileEditProfile.css';
import { FiPlus } from 'react-icons/fi';
import LoadingAnimation from '../../LoadingAnimation/LoadingAnimation';

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

interface AdminProfileEditProps {
    adminData: AdminData | null;
    setAdminData: (data: AdminData) => void;
    setActiveSection: (section: 'info' | 'edit' | 'password') => void;
}

const AdminProfileEditProfile: React.FC<AdminProfileEditProps> = ({
    adminData,
    setAdminData,
    setActiveSection
}) => {
    const [editForm, setEditForm] = useState({
        fullname: adminData?.fullname || '',
        profile_picture: null as File | null,
        phone_number: adminData?.phone_number || '',
        address: adminData?.address || '',
    });
    const [previewImage, setPreviewImage] = useState<string>(
        adminData?.profile_picture
            ? `http://${window.location.hostname}:5000/uploads/${adminData.profile_picture}`
            : ''
    );
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fieldErrors, setFieldErrors] = useState({
        fullname: '',
        phone_number: '',
        address: ''
    });

    const handleProfileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditForm(prev => ({ ...prev, profile_picture: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const capitalizeWords = (str: string) => {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const validateFullName = (name: string): boolean => {
        if (!name.trim()) {
            setFieldErrors(prev => ({ ...prev, fullname: 'Full name is required' }));
            return false;
        }
        if (!/^[A-Za-z\s.,.-]+$/.test(name)) {
            setFieldErrors(prev => ({ ...prev, fullname: 'Full name can only contain letters, spaces, dots, commas, and hyphens' }));
            return false;
        }
        setFieldErrors(prev => ({ ...prev, fullname: '' }));
        return true;
    };

    const validatePhoneNumber = (phone: string): boolean => {
        if (!phone.trim()) {
            setFieldErrors(prev => ({ ...prev, phone_number: 'Phone number is required' }));
            return false;
        }
        if (!/^\d+$/.test(phone)) {
            setFieldErrors(prev => ({ ...prev, phone_number: 'Phone number can only contain numbers' }));
            return false;
        }
        setFieldErrors(prev => ({ ...prev, phone_number: '' }));
        return true;
    };

    const validateAddress = (address: string): boolean => {
        if (!address.trim()) {
            setFieldErrors(prev => ({ ...prev, address: 'Address is required' }));
            return false;
        }
        if (!/^[A-Za-z\s.,.-]+$/.test(address)) {
            setFieldErrors(prev => ({ ...prev, address: 'Address can only contain letters, spaces, dots, commas, and hyphens' }));
            return false;
        }
        setFieldErrors(prev => ({ ...prev, address: '' }));
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const isFullNameValid = validateFullName(editForm.fullname);
        const isPhoneValid = validatePhoneNumber(editForm.phone_number);
        const isAddressValid = validateAddress(editForm.address);

        if (!isFullNameValid || !isPhoneValid || !isAddressValid) {
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('fullname', capitalizeWords(editForm.fullname));
            formData.append('phone_number', editForm.phone_number);
            formData.append('address', editForm.address);
            if (editForm.profile_picture) {
                formData.append('profile_picture', editForm.profile_picture);
            }

            const response = await fetch(`http://${window.location.hostname}:5000/admin/${adminData?.admin_id}/update`, {
                method: 'PUT',
                body: formData,
            });

            if (response.ok) {
                const updatedData = await response.json();
                setAdminData(updatedData);
                console.log('Update successful, changing section to info');
                setActiveSection('info');
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            setError(err instanceof Error ? err.message : 'Error updating profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (
        field: 'fullname' | 'phone_number' | 'address',
        value: string
    ) => {
        let newValue = value;

        switch (field) {
            case 'fullname':
                newValue = value.replace(/[^A-Za-z\s.,.-]/g, '');
                validateFullName(newValue);
                break;

            case 'phone_number':
                newValue = value.replace(/[^0-9]/g, '');
                validatePhoneNumber(newValue);
                break;

            case 'address':
                newValue = value.replace(/[^A-Za-z\s.,.-]/g, '');
                validateAddress(newValue);
                break;
        }

        setEditForm(prev => ({ ...prev, [field]: newValue }));
    };

    if (isSubmitting) return <LoadingAnimation />;

    return (
        <div className="edit-profile-section-inAdminProfileEditProfile">
            <h3>Edit Profile</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group-inAdminProfileEditProfile">
                    <label>Profile Picture</label>
                    <div className="profile-upload-container-inAdminProfileEditProfile" onClick={handleProfileClick}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden-input-inAdminProfileEditProfile"
                            title="Upload Profile Picture"
                        />
                        {previewImage ? (
                            <img src={previewImage} alt="Preview" className="profile-upload-preview-inAdminProfileEditProfile" />
                        ) : (
                            <div className="profile-upload-placeholder-inAdminProfileEditProfile">
                                <FiPlus />
                                <span>Click to upload profile picture</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group-inAdminProfileEditProfile">
                    <label>Full Name</label>
                    <input
                        type="text"
                        value={editForm.fullname}
                        onChange={(e) => handleInputChange('fullname', e.target.value)}
                        required
                        placeholder="Enter full name"
                        maxLength={50} // Add character limit
                        className={fieldErrors.fullname ? 'error-input-inAdminProfileEditProfile' : ''}
                    />
                    {fieldErrors.fullname && (
                        <span className="input-error-message">{fieldErrors.fullname}</span>
                    )}
                </div>

                <div className="form-group-inAdminProfileEditProfile">
                    <label>Phone Number</label>
                    <input
                        type="tel"
                        value={editForm.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        required
                        placeholder="Enter phone number"
                        maxLength={15} // Add character limit
                        className={fieldErrors.phone_number ? 'error-input-inAdminProfileEditProfile' : ''}
                    />
                    {fieldErrors.phone_number && (
                        <span className="input-error-message">{fieldErrors.phone_number}</span>
                    )}
                </div>

                <div className="form-group-inAdminProfileEditProfile">
                    <label>Address</label>
                    <textarea
                        value={editForm.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className={`address-input-inAdminProfileEditProfile ${fieldErrors.address ? 'error-input-inAdminProfileEditProfile' : ''
                            }`}
                        placeholder="Enter address"
                        title="Address"
                        maxLength={200} // Add character limit
                    />
                    {fieldErrors.address && (
                        <span className="input-error-message">{fieldErrors.address}</span>
                    )}
                </div>

                {error && <div className="error-message-inAdminProfileEditProfile">{error}</div>}

                <div className="form-buttons-inAdminProfileEditProfile">
                    <button type="submit" className="save-btn-inAdminProfileEditProfile">Save Changes</button>
                </div>
            </form>
        </div>
    );
};

export default AdminProfileEditProfile;
