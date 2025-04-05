import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ScannerTutorial.css';

const ScannerTutorial: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="scanner-tutorial-inScannerTutorial">
            <div className="tutorial-content-inScannerTutorial">
                <h1>Face Scanning Guide</h1>

                <div className="tutorial-image-section-inScannerTutorial">
                    <img src="/tutorial-face.png" alt="Face scanning example" />
                    <p className="image-caption-inScannerTutorial">Example of correct face positioning</p>
                </div>

                <div className="tutorial-section-inScannerTutorial">
                    <div className="instruction-container-inScannerTutorial">
                        <div className="instruction-card-inScannerTutorial correct-inScannerTutorial">
                            <h3>✓ Correct Way</h3>
                            <div className="instruction-points-inScannerTutorial">
                                <div className="point-inScannerTutorial">
                                    <ul className="tutorial-list-inScannerTutorial">
                                        <li>Face the camera directly</li>
                                        <li>Ensure good lighting</li>
                                        <li>Keep a neutral expression</li>
                                        <li>Clear hair from your forehead</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="instruction-card-inScannerTutorial incorrect-inScannerTutorial">
                            <h3>✗ Avoid These</h3>
                            <div className="instruction-points-inScannerTutorial">
                                <div className="point-inScannerTutorial">
                                    <ul className="tutorial-list-inScannerTutorial">
                                        <li>Don't tilt your head</li>
                                        <li>Avoid poor lighting</li>
                                        <li>Don't wear hats or accessories</li>
                                        <li>Avoid extreme expressions</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button className="proceed-button-inScannerTutorial" onClick={() => navigate('/user/scanner')}>
                    Start Scanning
                </button>
            </div>
        </div>
    );
};

export default ScannerTutorial;
