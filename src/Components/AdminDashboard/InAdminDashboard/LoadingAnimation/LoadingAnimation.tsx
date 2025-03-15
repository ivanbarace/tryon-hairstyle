import React from 'react';
import './LoadingAnimation.css';

const LoadingAnimation: React.FC = () => {
    return (
        <div className="loading-container">
            <div className="loading-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
            </div>
            <p className="loading-text">Loading...</p>
        </div>
    );
};

export default LoadingAnimation;
