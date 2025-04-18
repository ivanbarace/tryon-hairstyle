import React, { useState, useEffect } from 'react';
import { BsImage, BsTrash, BsSearch } from 'react-icons/bs';  // Update this line
import './HairstylesInAdmin.css';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';

interface Hairstyle {
  hairstyle_id: number;
  hairstyle_name: string;
  hairstyle_picture: string | File;
  faceshape: string;
  face_shapes: string[];  // Add this line
  hairtype: string;
  hair_length: string;
  description: string;
  created_at: string;
}

interface HairstyleForm {
  hairstyle_name: string;
  hairstyle_picture: File | null;
  faceshape: string;
  additionalFaceShapes: string[];  // Add this line
  hairtype: string;
  hair_length: string;
  description: string;
}

// Add this interface to handle the image preview
interface HairstyleWithPreview extends Hairstyle {
  imagePreview?: string;
}

// Add these new interfaces
interface ValidationMessage {
  type: 'success' | 'error';
  text: string;
}

const HairstylesInAdmin: React.FC = () => {
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addHairstyleModal, setAddHairstyleModal] = useState(false); // Changed from isModalOpen
  const [formData, setFormData] = useState<HairstyleForm>({
    hairstyle_name: '',
    hairstyle_picture: null,
    faceshape: '',
    additionalFaceShapes: [],  // Add this line
    hairtype: '',
    hair_length: '',
    description: ''
  });
  const [selectedHairstyle, setSelectedHairstyle] = useState<HairstyleWithPreview | null>(null);
  // Add these state variables after your existing useState declarations
  const [addMessage, setAddMessage] = useState<ValidationMessage | null>(null);
  const [editMessage, setEditMessage] = useState<ValidationMessage | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    faceshape: '',
    hairtype: '',
    hair_length: ''
  });
  const [showFilterOptions, setShowFilterOptions] = useState({
    faceshape: false,
    hairtype: false,
    hair_length: false
  });

  // Add these filter option arrays
  const faceShapeOptions = ["Triangle", "Round", "Square", "Oval", "Rectangle"];
  const hairTypeOptions = ["Straight", "Wavy", "Curly", "Coily"];
  const hairLengthOptions = ["Short", "Medium", "Long"];

  // Add this function to handle filter changes
  const handleFilterChange = (filterType: 'faceshape' | 'hairtype' | 'hair_length', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value // Toggle filter if clicking same value
    }));
    setShowFilterOptions(prev => ({
      ...prev,
      [filterType]: false // Close dropdown after selection
    }));
  };

  const fetchHairstyles = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}hairstyles`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hairstyles');
      }

      const data = await response.json();
      setHairstyles(data);
      setLoading(false);
    } catch (err) {
      setError('Error loading hairstyles');
      setLoading(false);
      console.error('Error fetching hairstyles:', err);
    }
  };

  useEffect(() => {
    fetchHairstyles();
  }, []);

  // Modify the validateHairstyleName function
  const validateHairstyleName = (value: string) => {
    // Allow empty string during editing
    if (value === '') return true;
    return /^[A-Za-z\s]+$/.test(value);
  };

  // Modify the validateDescription function
  const validateDescription = (value: string) => {
    // Allow empty string during editing
    if (value === '') return true;
    return /^[A-Za-z\s.,!?'"-]+$/.test(value);
  };

  useEffect(() => {
    if (addMessage) {
      const timer = setTimeout(() => {
        setAddMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [addMessage]);

  useEffect(() => {
    if (editMessage) {
      const timer = setTimeout(() => {
        setEditMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [editMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target.name === 'hairstyle_name') {
      if (!validateHairstyleName(e.target.value)) {
        setAddMessage({ type: 'error', text: 'Only letters are allowed in hairstyle name' });
        return;
      }
    }

    if (e.target.name === 'description') {
      if (!validateDescription(e.target.value)) {
        setAddMessage({ type: 'error', text: 'Only letters and basic punctuation are allowed in description' });
        return;
      }
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        hairstyle_picture: e.target.files[0]
      });
    }
  };

  // Add this function
  const handleAddFaceShape = () => {
    if (formData.additionalFaceShapes.length < 4) {
      setFormData({
        ...formData,
        additionalFaceShapes: [...formData.additionalFaceShapes, '']
      });
    }
  };

  // Add this function
  const handleAdditionalFaceShapeChange = (index: number, value: string) => {
    const newFaceShapes = [...formData.additionalFaceShapes];
    newFaceShapes[index] = value;
    setFormData({
      ...formData,
      additionalFaceShapes: newFaceShapes
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    if (!formData.hairstyle_name.trim()) {
      setAddMessage({ type: 'error', text: 'Hairstyle name is required' });
      return;
    }
    if (!formData.hairstyle_picture) {
      setAddMessage({ type: 'error', text: 'Please upload an image' });
      return;
    }
    if (!formData.faceshape) {
      setAddMessage({ type: 'error', text: 'Face shape is required' });
      return;
    }
    if (!formData.hairtype) {
      setAddMessage({ type: 'error', text: 'Hair type is required' });
      return;
    }
    if (!formData.hair_length) {
      setAddMessage({ type: 'error', text: 'Hair length is required' });
      return;
    }
    if (!formData.description.trim()) {
      setAddMessage({ type: 'error', text: 'Description is required' });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('hairstyle_name', formData.hairstyle_name);
      if (formData.hairstyle_picture) {
        formDataToSend.append('hairstyle_picture', formData.hairstyle_picture);
      }
      formDataToSend.append('faceshape', formData.faceshape);
      formDataToSend.append('additionalFaceShapes', JSON.stringify(formData.additionalFaceShapes.filter(shape => shape)));
      formDataToSend.append('hairtype', formData.hairtype);
      formDataToSend.append('hair_length', formData.hair_length);
      formDataToSend.append('description', formData.description);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}hairstyles`, {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to add hairstyle');
      }

      // Close modal immediately after successful addition
      setAddHairstyleModal(false);

      // Show success message
      setAddMessage({ type: 'success', text: 'Hairstyle added successfully!' });

      // Reset form
      setFormData({
        hairstyle_name: '',
        hairstyle_picture: null,
        faceshape: '',
        additionalFaceShapes: [],  // Add this line
        hairtype: '',
        hair_length: '',
        description: ''
      });

      // Fetch updated hairstyles
      fetchHairstyles();

      // Clear success message after delay
      setTimeout(() => {
        setAddMessage(null);
      }, 2000);

    } catch (err) {
      console.error('Error adding hairstyle:', err);
      setAddMessage({ type: 'error', text: 'Failed to add hairstyle. Please try again.' });
      setTimeout(() => {
        setAddMessage(null);
      }, 2000);
    }
  };

  const handleRowClick = (hairstyle: Hairstyle) => {
    setSelectedHairstyle(hairstyle);
  };

  const closeModal = () => {
    if (selectedHairstyle?.imagePreview) {
      URL.revokeObjectURL(selectedHairstyle.imagePreview);
    }
    setSelectedHairstyle(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedHairstyle) {
      setEditMessage({ type: 'error', text: 'No hairstyle selected' });
      return;
    }

    // Filter out empty face shapes
    const validFaceShapes = selectedHairstyle.face_shapes.filter(shape => shape.trim());
    if (validFaceShapes.length === 0) {
      setEditMessage({ type: 'error', text: 'At least one face shape is required' });
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('hairstyle_name', selectedHairstyle.hairstyle_name);
      formDataToSend.append('face_shapes', JSON.stringify(validFaceShapes));
      formDataToSend.append('hairtype', selectedHairstyle.hairtype);
      formDataToSend.append('hair_length', selectedHairstyle.hair_length);
      formDataToSend.append('description', selectedHairstyle.description);

      // Check if a new file is uploaded
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        formDataToSend.append('hairstyle_picture', fileInput.files[0]);
      } else if (typeof selectedHairstyle.hairstyle_picture === 'string') {
        // If no new file, send the existing path without leading slash
        const normalizedPath = selectedHairstyle.hairstyle_picture.replace(/^\/+/, '');
        formDataToSend.append('hairstyle_picture_path', normalizedPath);
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}hairstyles/${selectedHairstyle.hairstyle_id}`,
        {
          method: 'PUT',
          credentials: 'include',
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update hairstyle');
      }

      // Close modal immediately
      closeModal();

      // Show success message
      setEditMessage({ type: 'success', text: 'Hairstyle updated successfully!' });

      // Fetch updated data
      fetchHairstyles();

      // Clear success message after delay
      setTimeout(() => {
        setEditMessage(null);
      }, 2000);

    } catch (err) {
      console.error('Error updating hairstyle:', err);
      setEditMessage({ type: 'error', text: 'Failed to update hairstyle. Please try again.' });
      setTimeout(() => {
        setEditMessage(null);
      }, 2000);
    }
  };

  // Add this function to handle removing a face shape
  const handleRemoveFaceShape = (index: number) => {
    if (!selectedHairstyle) return;

    const newFaceShapes = selectedHairstyle.face_shapes.filter((_, i) => i !== index);
    setSelectedHairstyle({
      ...selectedHairstyle,
      face_shapes: newFaceShapes
    });
  };

  const handleDelete = async () => {
    if (!selectedHairstyle) return;
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!selectedHairstyle) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}hairstyles/${selectedHairstyle.hairstyle_id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete hairstyle');
      }

      if (selectedHairstyle.imagePreview) {
        URL.revokeObjectURL(selectedHairstyle.imagePreview);
      }

      // Close all modals immediately
      setShowDeleteConfirmation(false);
      closeModal();

      // Show success message
      setShowDeleteSuccess(true);

      // Fetch updated data
      fetchHairstyles();

      // Clear success message after delay
      setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error deleting hairstyle:', err);
      alert('Failed to delete hairstyle');
    }
  };

  // Replace the handleEditNameChange function
  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (validateHairstyleName(newValue)) {
      setSelectedHairstyle({
        ...selectedHairstyle!,
        hairstyle_name: newValue
      });
    } else {
      setEditMessage({ type: 'error', text: 'Only letters are allowed in hairstyle name' });
    }
  };

  // Add this function to filter hairstyles
  const filteredHairstyles = hairstyles.filter(hairstyle => {
    const matchesSearch = hairstyle.hairstyle_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFaceShape = !filters.faceshape ||
      (hairstyle.face_shapes && hairstyle.face_shapes.includes(filters.faceshape));
    const matchesHairType = !filters.hairtype || hairstyle.hairtype === filters.hairtype;
    const matchesHairLength = !filters.hair_length || hairstyle.hair_length === filters.hair_length;

    return matchesSearch && matchesFaceShape && matchesHairType && matchesHairLength;
  });

  // Add click outside handler to close filter dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-button') && !target.closest('.filter-options')) {
        setShowFilterOptions({
          faceshape: false,
          hairtype: false,
          hair_length: false
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Add this utility function near the top of your component
  const constructImageUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, ''); // Remove trailing slashes
    const imagePath = path.replace(/^\/+/, ''); // Remove leading slashes
    return `${baseUrl}/${imagePath}`;
  };

  // Add this to your state declarations
  const [expandedFaceShape, setExpandedFaceShape] = useState<number | null>(null);

  // Add this handler function
  const handleFaceShapeClick = (hairstyleId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click event
    setExpandedFaceShape(expandedFaceShape === hairstyleId ? null : hairstyleId);
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="content-hairstyle-inadmin">
      {addMessage && (
        <div className={`validation-message ${addMessage.type}`}>
          {addMessage.text}
        </div>
      )}
      {editMessage && (
        <div className={`validation-message ${editMessage.type}`}>
          {editMessage.text}
        </div>
      )}
      {showDeleteSuccess && (
        <div className="delete-success-message">
          Hairstyle deleted successfully
        </div>
      )}
      <div className="header-container-hairstyle-inadmin">
        <h2>Hairstyles Management</h2>
        <button className="add-button-hairstyle-inadmin" onClick={() => setAddHairstyleModal(true)}>
          Add Hairstyle
        </button>
      </div>

      <div className="search-and-filters-hairstyle-inadmin">
        <div className="search-bar-hairstyle-inadmin">
          <BsSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search hairstyle name..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filters-hairstyle-inadmin">
          <div className="filter-container">
            <button
              className={`filter-button ${filters.faceshape ? 'active' : ''}`}
              onClick={() => setShowFilterOptions(prev => ({
                ...prev,
                faceshape: !prev.faceshape
              }))}
            >
              Face Shape {filters.faceshape && `(${filters.faceshape})`}
              <span className="filter-arrow">▼</span>
            </button>
            {showFilterOptions.faceshape && (
              <div className="filter-options">
                {faceShapeOptions.map(option => (
                  <div
                    key={option}
                    className={`filter-option ${filters.faceshape === option ? 'active' : ''}`}
                    onClick={() => handleFilterChange('faceshape', option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="filter-container">
            <button
              className={`filter-button ${filters.hairtype ? 'active' : ''}`}
              onClick={() => setShowFilterOptions(prev => ({
                ...prev,
                hairtype: !prev.hairtype
              }))}
            >
              Hair Type {filters.hairtype && `(${filters.hairtype})`}
              <span className="filter-arrow">▼</span>
            </button>
            {showFilterOptions.hairtype && (
              <div className="filter-options">
                {hairTypeOptions.map(option => (
                  <div
                    key={option}
                    className={`filter-option ${filters.hairtype === option ? 'active' : ''}`}
                    onClick={() => handleFilterChange('hairtype', option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="filter-container">
            <button
              className={`filter-button ${filters.hair_length ? 'active' : ''}`}
              onClick={() => setShowFilterOptions(prev => ({
                ...prev,
                hair_length: !prev.hair_length
              }))}
            >
              Hair Length {filters.hair_length && `(${filters.hair_length})`}
              <span className="filter-arrow">▼</span>
            </button>
            {showFilterOptions.hair_length && (
              <div className="filter-options">
                {hairLengthOptions.map(option => (
                  <div
                    key={option}
                    className={`filter-option ${filters.hair_length === option ? 'active' : ''}`}
                    onClick={() => handleFilterChange('hair_length', option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {addHairstyleModal && (
        <div className="modal-overlay-hairstyle-inadmin">
          <div className="modal-content-hairstyle-inadmin">
            <h3>Add New Hairstyle</h3>
            <form onSubmit={handleSubmit}>
              <div className="modal-form-container-in-add-hairstyle">
                <div className="image-section-in-add-hairstyle">
                  <input
                    type="file"
                    id="hairstyle_picture"
                    name="hairstyle_picture"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden-input"
                    required
                  />
                  <label htmlFor="hairstyle_picture" className="image-upload-container-in-add-hairstyle">
                    {formData.hairstyle_picture ? (
                      <img
                        src={URL.createObjectURL(formData.hairstyle_picture)}
                        alt="Selected hairstyle"
                      />
                    ) : (
                      <div className="image-upload-placeholder">
                        <BsImage className="upload-icon" />
                        <p>Click to upload image</p>
                      </div>
                    )}
                    <div className="image-upload-hint">Choose new image</div>
                  </label>
                </div>

                <div className="form-section-in-add-hairstyle">
                  {/* Rest of the form inputs */}
                  <div className="form-group-in-adding-hairstyles">
                    <label htmlFor="hairstyle_name">Hairstyle Name</label>
                    <input
                      type="text"
                      id="hairstyle_name"
                      name="hairstyle_name"
                      value={formData.hairstyle_name}
                      onChange={handleInputChange}
                      required
                      pattern="[A-Za-z\s]+"
                      title="Only letters and spaces are allowed"
                    />
                  </div>

                  <div className="form-group-in-adding-hairstyles faceshape-group">
                    <label htmlFor="faceshape">Face Shape</label>
                    <div className="faceshape-input-group">
                      <select
                        aria-label="Primary Face Shape"
                        id="faceshape"
                        name="faceshape"
                        value={formData.faceshape}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Face Shape</option>
                        {faceShapeOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      {formData.additionalFaceShapes.length < 4 && (
                        <button
                          type="button"
                          className="add-faceshape-button"
                          onClick={handleAddFaceShape}
                        >
                          +
                        </button>
                      )}
                    </div>

                    {formData.additionalFaceShapes.map((shape, index) => (
                      <div key={index} className="additional-faceshape-input">
                        <select
                          value={shape}
                          onChange={(e) => handleAdditionalFaceShapeChange(index, e.target.value)}
                          required
                          aria-label={`Additional Face Shape ${index + 1}`}
                        >
                          <option value="">Select Additional Face Shape</option>
                          {faceShapeOptions.map(option => (
                            <option
                              key={option}
                              value={option}
                              disabled={
                                formData.faceshape === option ||
                                formData.additionalFaceShapes.some(
                                  (selectedShape, i) => i !== index && selectedShape === option
                                )
                              }
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="form-group-in-adding-hairstyles">
                    <label htmlFor="hairtype">Hair Type</label>
                    <select
                      id="hairtype"
                      name="hairtype"
                      value={formData.hairtype}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Hair Type</option>
                      <option value="Straight">Straight</option>
                      <option value="Wavy">Wavy</option>
                      <option value="Curly">Curly</option>
                      <option value="Coily">Coily</option>
                    </select>
                  </div>

                  <div className="form-group-in-adding-hairstyles">
                    <label htmlFor="hair_length">Hair Length</label>
                    <select
                      id="hair_length"
                      name="hair_length"
                      value={formData.hair_length}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Hair Length</option>
                      <option value="Short">Short</option>
                      <option value="Medium">Medium</option>
                      <option value="Long">Long</option>
                    </select>
                  </div>

                  <div className="form-group-in-adding-hairstyles">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      title="Only letters, spaces, and basic punctuation are allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-buttons-in-add-hairstyle">
                <button type="submit" className="submit-button-in-adding-hairstyles">Add Hairstyle</button>
                <button type="button" className="cancel-button-in-adding-hairstyles" onClick={() => setAddHairstyleModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container-hairstyle-inadmin">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Image</th>
              <th>Name</th>
              <th>Face Shape</th>
              <th>Hair Type</th>
              <th>Length</th>
              <th>Description</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredHairstyles.map((hairstyle) => (
              <tr key={hairstyle.hairstyle_id} onClick={() => handleRowClick(hairstyle)}>
                <td>{hairstyle.hairstyle_id}</td>
                <td>
                  <img
                    src={constructImageUrl(hairstyle.hairstyle_picture as string)}
                    alt={hairstyle.hairstyle_name}
                    className="hairstyle-thumbnail"
                    onError={(e) => {
                      console.error('Image failed to load:', hairstyle.hairstyle_picture);
                      console.log('Full URL:', constructImageUrl(hairstyle.hairstyle_picture as string));
                      e.currentTarget.src = '/placeholder.png'; // Add a placeholder image
                    }}
                  />
                </td>
                <td>{hairstyle.hairstyle_name}</td>
                <td className="face-shape-cell">
                  {hairstyle.face_shapes?.length > 1 ? (
                    <div className="face-shape-dropdown">
                      <button
                        className={`face-shape-button ${expandedFaceShape === hairstyle.hairstyle_id ? 'expanded' : ''}`}
                        onClick={(e) => handleFaceShapeClick(hairstyle.hairstyle_id, e)}
                      >
                        {hairstyle.face_shapes[0]}
                        <span className="face-shape-count">{` (+${hairstyle.face_shapes.length - 1})`}</span>
                        <span className={`dropdown-arrow ${expandedFaceShape === hairstyle.hairstyle_id ? 'expanded' : ''}`}>▼</span>
                      </button>
                      {expandedFaceShape === hairstyle.hairstyle_id && (
                        <div className="face-shape-dropdown-content">
                          {hairstyle.face_shapes.slice(1).map((shape, index) => (
                            <div key={index} className="dropdown-item">
                              {shape}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    hairstyle.face_shapes[0] || hairstyle.faceshape
                  )}
                </td>
                <td>{hairstyle.hairtype}</td>
                <td>{hairstyle.hair_length}</td>
                <td className="description-cell">{hairstyle.description}</td>
                <td>{new Date(hairstyle.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedHairstyle && (
        <div className="edit-modal-overlay-hairstyle-inadmin">
          <div className="edit-modal-content-hairstyle-inadmin">
            <h3>Edit Hairstyle Details</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-form-container-in-edit-hairstyle">
                <div className="image-section-in-edit-hairstyle">
                  <input
                    type="file"
                    accept="image/*"
                    id="image-upload"
                    onChange={(e) => {
                      if (selectedHairstyle && e.target.files && e.target.files[0]) {
                        const imagePreview = URL.createObjectURL(e.target.files[0]);
                        setSelectedHairstyle({
                          ...selectedHairstyle,
                          hairstyle_picture: e.target.files[0],
                          imagePreview: imagePreview
                        });
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="image-upload" className="image-upload-container-in-edit-hairstyle">
                    <img
                      src={selectedHairstyle.imagePreview ||
                        constructImageUrl(selectedHairstyle.hairstyle_picture as string)}
                      alt={selectedHairstyle.hairstyle_name}
                    />
                    <div className="image-upload-hint">Click to change image</div>
                  </label>
                </div>

                <div className="form-section-in-edit-hairstyle">
                  {/* Rest of the form inputs */}
                  <div className="form-group-in-editing-hairstyles">
                    <label htmlFor="hairstyle_name">Hairstyle Name</label>
                    <input
                      type="text"
                      id="hairstyle_name"
                      value={selectedHairstyle.hairstyle_name}
                      onChange={handleEditNameChange}
                      className="input-field"
                      required
                      title="Only letters and spaces are allowed"
                    />
                  </div>
                  <div className="form-group-in-editing-hairstyles faceshape-group">
                    <label htmlFor="faceshape">Face Shapes</label>
                    <div className="faceshape-input-group">
                      <select
                        id="faceshape"
                        aria-label="Primary Face Shape"
                        value={selectedHairstyle.face_shapes[0] || ''}
                        onChange={(e) => {
                          const newShapes = [e.target.value, ...selectedHairstyle.face_shapes.slice(1)];
                          setSelectedHairstyle({
                            ...selectedHairstyle,
                            face_shapes: newShapes,
                            faceshape: e.target.value // Keep this for backwards compatibility
                          });
                        }}
                        className="input-field"
                        required
                      >
                        <option value="">Select Face Shape</option>
                        {faceShapeOptions.map(option => (
                          <option
                            key={option}
                            value={option}
                            disabled={selectedHairstyle.face_shapes.includes(option) && option !== selectedHairstyle.face_shapes[0]}
                          >
                            {option}
                          </option>
                        ))}
                      </select>
                      {selectedHairstyle.face_shapes.length < 4 && (
                        <button
                          type="button"
                          className="add-faceshape-button"
                          onClick={() => {
                            setSelectedHairstyle({
                              ...selectedHairstyle,
                              face_shapes: [...selectedHairstyle.face_shapes, '']
                            });
                          }}
                        >
                          +
                        </button>
                      )}
                    </div>

                    {selectedHairstyle.face_shapes.slice(1).map((shape, index) => (
                      <div key={index} className="additional-faceshape-input">
                        <select
                          aria-label={`Additional Face Shape ${index + 2}`}
                          value={shape}
                          onChange={(e) => {
                            const newShapes = [...selectedHairstyle.face_shapes];
                            newShapes[index + 1] = e.target.value;
                            setSelectedHairstyle({
                              ...selectedHairstyle,
                              face_shapes: newShapes
                            });
                          }}
                          required
                          className="input-field"
                        >
                          <option value="">Select Additional Face Shape</option>
                          {faceShapeOptions.map(option => (
                            <option
                              key={option}
                              value={option}
                              disabled={selectedHairstyle.face_shapes.includes(option) && option !== shape}
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="remove-faceshape-button"
                          onClick={() => handleRemoveFaceShape(index + 1)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="form-group-in-editing-hairstyles">
                    <label htmlFor="hairtype">Hair Type</label>
                    <select
                      id="hairtype"
                      value={selectedHairstyle.hairtype}
                      onChange={(e) => setSelectedHairstyle({ ...selectedHairstyle, hairtype: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Hair Type</option>
                      <option value="Straight">Straight</option>
                      <option value="Wavy">Wavy</option>
                      <option value="Curly">Curly</option>
                      <option value="Coily">Coily</option>
                    </select>
                  </div>
                  <div className="form-group-in-editing-hairstyles">
                    <label htmlFor="hair_length">Hair Length</label>
                    <select
                      id="hair_length"
                      value={selectedHairstyle.hair_length}
                      onChange={(e) => setSelectedHairstyle({ ...selectedHairstyle, hair_length: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Hair Length</option>
                      <option value="Short">Short</option>
                      <option value="Medium">Medium</option>
                      <option value="Long">Long</option>
                    </select>
                  </div>
                  <div className="form-group-in-editing-hairstyles">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={selectedHairstyle.description}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        if (validateDescription(newValue)) {
                          setSelectedHairstyle({ ...selectedHairstyle, description: newValue });
                        } else {
                          setEditMessage({ type: 'error', text: 'Only letters and basic punctuation are allowed in description' });
                        }
                      }}
                      className="input-field textarea-field"
                      title="Only letters, spaces, and basic punctuation are allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-buttons-in-edit-hairstyle">
                <button type="submit" className="save-button">Save</button>
                <button
                  type="button"
                  className="delete-button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                >
                  Delete
                </button>
                <button type="button" className="cancel-button-in-adding-hairstyles" onClick={closeModal}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirmation && (
        <>
          <div className="delete-confirmation-overlay" />
          <div className="delete-confirmation-modal-in-HairstylesInAdmin">
            <div className="delete-confirmation-content-in-HairstylesInAdmin">
              <BsTrash className="delete-icon" />
              <h3 className="delete-confirmation-title">Delete Hairstyle</h3>
              <p className="delete-confirmation-message">
                Are you sure you want to delete "{selectedHairstyle?.hairstyle_name}"?
              </p>
              <div className="delete-confirmation-buttons">
                <button className="confirm-button" onClick={confirmDelete}>Yes</button>
                <button className="cancel-button" onClick={() => setShowDeleteConfirmation(false)}>No</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HairstylesInAdmin;