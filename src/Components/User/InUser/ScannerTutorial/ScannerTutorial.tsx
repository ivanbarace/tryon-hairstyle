import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ScannerTutorial.css';

const ScannerTutorial: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="scanner-tutorial-inScannerTutorial">
            <div className="tutorial-content-inScannerTutorial">
                <h1>Face Scanning Tutorial</h1>
                <div className="tutorial-section-inScannerTutorial">
                    <h2>Correct Way to Scan</h2>
                    <div className="tutorial-items-inScannerTutorial">
                        <div className="tutorial-item-inScannerTutorial do-inScannerTutorial">
                            <h3>✓ Do This</h3>
                            <div className="tutorial-image-grid-inScannerTutorial">
                                <div className="image-container-inScannerTutorial">
                                    <img src="/barber.png" alt="Correct face scanning position 1" />
                                </div>
                                <div className="image-container-inScannerTutorial">
                                    <img src="/barber.png" alt="Correct face scanning position 2" />
                                </div>
                                <div className="image-container-inScannerTutorial">
                                    <img src="/barber.png" alt="Correct face scanning position 3" />
                                </div>
                                <div className="image-container-inScannerTutorial">
                                    <img src="/barber.png" alt="Correct face scanning position 4" />
                                </div>
                                <ul className="tutorial-tips-inScannerTutorial">
                                    <li>Face the camera directly</li>
                                    <li>Ensure good lighting</li>
                                    <li>Keep a neutral expression</li>
                                    <li>Remove glasses or accessories</li>
                                </ul>
                            </div>
                        </div>
                        <div className="tutorial-item-inScannerTutorial dont-inScannerTutorial">
                            <h3>✗ Don't Do This</h3>
                            <div className="tutorial-image-grid-inScannerTutorial">
                                <div className="image-container-inScannerTutorial">
                                    <img src="/barber.png" alt="Incorrect face scanning position 1" />
                                </div>
                                <div className="image-container-inScannerTutorial">
                                    <img src="/barber.png" alt="Incorrect face scanning position 2" />
                                </div>
                                <div className="image-container-inScannerTutorial">
                                    <img src="/barber.png" alt="Incorrect face scanning position 3" />
                                </div>
                                <div className="image-container-inScannerTutorial">
                                    <img src="/barber.png" alt="Incorrect face scanning position 4" />
                                </div>
                                <ul className="tutorial-tips-inScannerTutorial">
                                    <li>Don't tilt your head</li>
                                    <li>Avoid poor lighting</li>
                                    <li>Don't wear hats or accessories</li>
                                    <li>Avoid extreme expressions</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <button className="proceed-button-inScannerTutorial" onClick={() => navigate('/user/scanner')}>
                    Proceed to Scanner
                </button>
            </div>
        </div>
    );
};

export default ScannerTutorial;
