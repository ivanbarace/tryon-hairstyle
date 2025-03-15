import React, { useState, useEffect } from 'react';
import { BsArrowCounterclockwise, BsSearch } from 'react-icons/bs';
import './ArchiveInAdmin.css';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';

interface ArchivedHairstyle {
    hairstyle_id: number;
    hairstyle_name: string;
    hairstyle_picture: string;
    faceshape: string;
    hairtype: string;
    hair_length: string;
    description: string;
    created_at: string;
}

const ArchiveInAdmin: React.FC = () => {
    const [archivedHairstyles, setArchivedHairstyles] = useState<ArchivedHairstyle[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
    // Add new state variables
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

    // Add filter options arrays
    const faceShapeOptions = ["Triangle", "Round", "Square", "Oval", "Rectangle"];
    const hairTypeOptions = ["Straight", "Wavy", "Curly", "Coily"];
    const hairLengthOptions = ["Short", "Medium", "Long"];

    const fetchArchivedHairstyles = async () => {
        try {
            const response = await fetch('http://localhost:5000/archived-hairstyles', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch archived hairstyles');
            }

            const data = await response.json();
            setArchivedHairstyles(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching archived hairstyles:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchivedHairstyles();
    }, []);

    // Add handleFilterChange function
    const handleFilterChange = (filterType: 'faceshape' | 'hairtype' | 'hair_length', value: string) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: prev[filterType] === value ? '' : value
        }));
        setShowFilterOptions(prev => ({
            ...prev,
            [filterType]: false
        }));
    };

    // Add click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.filter-button-inArchive_Inadminscreen') && !target.closest('.filter-options-inArchive_Inadminscreen')) {
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

    // Filter hairstyles based on search and filters
    const filteredHairstyles = archivedHairstyles.filter(hairstyle => {
        const matchesSearch = hairstyle.hairstyle_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFaceShape = !filters.faceshape || hairstyle.faceshape === filters.faceshape;
        const matchesHairType = !filters.hairtype || hairstyle.hairtype === filters.hairtype;
        const matchesHairLength = !filters.hair_length || hairstyle.hair_length === filters.hair_length;

        return matchesSearch && matchesFaceShape && matchesHairType && matchesHairLength;
    });

    const handleRestore = async (hairstyleId: number) => {
        try {
            const response = await fetch(`http://localhost:5000/restore-hairstyle/${hairstyleId}`, {
                method: 'PUT',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to restore hairstyle');
            }

            // Update the list immediately
            setArchivedHairstyles(prev => prev.filter(h => h.hairstyle_id !== hairstyleId));

            // Show success message
            setRestoreMessage('Hairstyle restored successfully');

            // Clear success message after delay
            setTimeout(() => {
                setRestoreMessage(null);
            }, 2000);

        } catch (err) {
            console.error('Error restoring hairstyle:', err);
            setRestoreMessage('Failed to restore hairstyle');
            setTimeout(() => {
                setRestoreMessage(null);
            }, 2000);
        }
    };

    if (loading) return <LoadingAnimation />;

    return (
        <div className="archive-container-inArchive_Inadminscreen">
            <h2>Archived Hairstyles</h2>

            {restoreMessage && (
                <div className="restore-message-inArchive_Inadminscreen">
                    {restoreMessage}
                </div>
            )}

            <div className="search-and-filters-inArchive_Inadminscreen">
                <div className="search-bar-inArchive_Inadminscreen">
                    <BsSearch className="search-icon-inArchive_Inadminscreen" />
                    <input
                        type="text"
                        placeholder="Search hairstyle name..."
                        className="search-input-inArchive_Inadminscreen"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filters-inArchive_Inadminscreen">
                    <div className="filter-container-inArchive_Inadminscreen">
                        <button
                            className={`filter-button-inArchive_Inadminscreen ${filters.faceshape ? 'active' : ''}`}
                            onClick={() => setShowFilterOptions(prev => ({
                                ...prev,
                                faceshape: !prev.faceshape
                            }))}
                        >
                            Face Shape {filters.faceshape && `(${filters.faceshape})`}
                            <span className="filter-arrow-inArchive_Inadminscreen">▼</span>
                        </button>
                        {showFilterOptions.faceshape && (
                            <div className="filter-options-inArchive_Inadminscreen">
                                {faceShapeOptions.map(option => (
                                    <div
                                        key={option}
                                        className={`filter-option-inArchive_Inadminscreen ${filters.faceshape === option ? 'active' : ''}`}
                                        onClick={() => handleFilterChange('faceshape', option)}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="filter-container-inArchive_Inadminscreen">
                        <button
                            className={`filter-button-inArchive_Inadminscreen ${filters.hairtype ? 'active' : ''}`}
                            onClick={() => setShowFilterOptions(prev => ({
                                ...prev,
                                hairtype: !prev.hairtype
                            }))}
                        >
                            Hair Type {filters.hairtype && `(${filters.hairtype})`}
                            <span className="filter-arrow-inArchive_Inadminscreen">▼</span>
                        </button>
                        {showFilterOptions.hairtype && (
                            <div className="filter-options-inArchive_Inadminscreen">
                                {hairTypeOptions.map(option => (
                                    <div
                                        key={option}
                                        className={`filter-option-inArchive_Inadminscreen ${filters.hairtype === option ? 'active' : ''}`}
                                        onClick={() => handleFilterChange('hairtype', option)}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="filter-container-inArchive_Inadminscreen">
                        <button
                            className={`filter-button-inArchive_Inadminscreen ${filters.hair_length ? 'active' : ''}`}
                            onClick={() => setShowFilterOptions(prev => ({
                                ...prev,
                                hair_length: !prev.hair_length
                            }))}
                        >
                            Hair Length {filters.hair_length && `(${filters.hair_length})`}
                            <span className="filter-arrow-inArchive_Inadminscreen">▼</span>
                        </button>
                        {showFilterOptions.hair_length && (
                            <div className="filter-options-inArchive_Inadminscreen">
                                {hairLengthOptions.map(option => (
                                    <div
                                        key={option}
                                        className={`filter-option-inArchive_Inadminscreen ${filters.hair_length === option ? 'active' : ''}`}
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

            <div className="archive-table-container-inArchive_Inadminscreen">
                {filteredHairstyles.length === 0 ? (
                    <div className="no-data-message-inArchive_Inadminscreen">
                        <p>No archived hairstyles found</p>
                    </div>
                ) : (
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
                                <th>Archived Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHairstyles.map((hairstyle) => (
                                <tr key={hairstyle.hairstyle_id}>
                                    <td>{hairstyle.hairstyle_id}</td>
                                    <td>
                                        <img
                                            src={`http://localhost:5000${hairstyle.hairstyle_picture}`}
                                            alt={hairstyle.hairstyle_name}
                                            className="archive-thumbnail-inArchive_Inadminscreen"
                                        />
                                    </td>
                                    <td>{hairstyle.hairstyle_name}</td>
                                    <td>{hairstyle.faceshape}</td>
                                    <td>{hairstyle.hairtype}</td>
                                    <td>{hairstyle.hair_length}</td>
                                    <td className="description-cell-inArchive_Inadminscreen">{hairstyle.description}</td>
                                    <td>{new Date(hairstyle.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="restore-button-inArchive_Inadminscreen"
                                            onClick={() => handleRestore(hairstyle.hairstyle_id)}
                                        >
                                            <BsArrowCounterclockwise /> Restore
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ArchiveInAdmin;
