import React, { useEffect, useRef, useState } from "react";
import { FaceMesh, Results, NormalizedLandmarkList } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import './Scanner.css';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';

interface FaceShapePercentages {
  Triangle: number;
  Round: number;
  Square: number;
  Oval: number;
  Rectangle: number;
}

interface Ratios {
  widthToHeight: number;
  jawToCheek: number;
  chinToJaw: number;
  foreheadToJaw: number;
  midfaceToJaw: number;
  templeToJaw: number;
  verticalThirds: {
    upper: number;
    middle: number;
    lower: number;
  };
}

interface IdealRatios {
  widthToHeight: number;
  jawToCheek: number;
  chinToJaw: number;
  foreheadToJaw: number;
  verticalBalance: number;
}

const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceShape, setFaceShape] = useState<string>("Detecting...");
  const [, setShapePercentages] = useState<FaceShapePercentages>({
    Triangle: 0,
    Round: 0,
    Square: 0,
    Oval: 0,
    Rectangle: 0
  });

  const [showModal, setShowModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [lastDetectedFaceShape, setLastDetectedFaceShape] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isAligned, setIsAligned] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      setUserId(userData.id);
    }
  }, []);

  const captureImage = () => {
    if (videoRef.current) {
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = 640;  // Match video dimensions
      captureCanvas.height = 480;
      const ctx = captureCanvas.getContext('2d');

      if (ctx) {
        // Apply consistent mirroring for the captured image
        ctx.scale(-1, 1);
        ctx.translate(-captureCanvas.width, 0);
        ctx.drawImage(videoRef.current, 0, 0, captureCanvas.width, captureCanvas.height);

        const image = captureCanvas.toDataURL('image/png');
        setCapturedImage(image);
        setLastDetectedFaceShape(faceShape);
        setShowModal(true);
        videoRef.current.pause();
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleRecommendedClick = async () => {
    if (capturedImage && userId && lastDetectedFaceShape) {
      try {
        console.log('Sending data:', {
          userId,
          faceShape: lastDetectedFaceShape,
          imageSize: capturedImage.length
        });

        const response = await fetch('http://localhost:5000/saveFacemesh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId), // Ensure userId is a number
            facemeshData: capturedImage,
            faceShape: lastDetectedFaceShape,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to save facemesh data');
        }

        console.log('Save successful:', data);
        navigate('/user/recommended');
      } catch (error) {
        console.error('Error details:', error);
        alert('Failed to save face data. Please try again.');
      }
    }
  };

  useEffect(() => {
    let isMounted = true; // Add this flag

    if (!videoRef.current || !canvasRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (isMounted && videoRef.current) { // Check the flag
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    camera.start().catch((err) => console.error("Error starting camera:", err));

    return () => {
      isMounted = false; // Update the flag
      camera.stop();
      faceMesh.close();
    };
  }, []);

  const onResults = (results: Results) => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement || !results.multiFaceLandmarks) return;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.scale(-1, 1);
    ctx.translate(-canvasElement.width, 0);
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Define guide box dimensions
      const guideWidth = canvasElement.width * 0.3;
      const guideHeight = canvasElement.height * 0.45;
      const guideX = (canvasElement.width - guideWidth) / 2;
      const guideY = (canvasElement.height - guideHeight) / 2;

      // Calculate face bounding box
      const faceLeft = Math.min(...landmarks.map(l => l.x)) * canvasElement.width;
      const faceRight = Math.max(...landmarks.map(l => l.x)) * canvasElement.width;
      const faceTop = Math.min(...landmarks.map(l => l.y)) * canvasElement.height;
      const faceBottom = Math.max(...landmarks.map(l => l.y)) * canvasElement.height;

      // Check if face is inside guide box with margin
      const margin = 0.1; // 10% margin from box edges
      const isInsideBox =
        faceLeft > guideX + guideWidth * margin &&
        faceRight < guideX + guideWidth * (1 - margin) &&
        faceTop > guideY + guideHeight * margin &&
        faceBottom < guideY + guideHeight * (1 - margin);

      let alignmentMessage = "";
      let isProperlyAligned = false;

      if (!isInsideBox) {
        alignmentMessage = "Position face inside the box";
      } else {
        // Enhanced alignment checks
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const nose = landmarks[1];
        const mouthLeft = landmarks[61];
        const mouthRight = landmarks[291];
        const foreHead = landmarks[10];
        const chin = landmarks[152];

        // Calculate angles and positions
        const noseCenterOffset = Math.abs((nose.x - (leftEye.x + rightEye.x) / 2));
        const mouthCenter = (mouthLeft.x + mouthRight.x) / 2;

        // More strict thresholds
        const ROTATION_THRESHOLD = 0.02; // Reduced from 0.05
        const TILT_THRESHOLD = 0.01;    // Reduced from 0.02
        const VERTICAL_THRESHOLD = 0.03;
        const CENTER_THRESHOLD = 0.02;

        // Check multiple alignment conditions
        const isFacingStraight = noseCenterOffset < ROTATION_THRESHOLD;
        const isLevelTilt = Math.abs(rightEye.y - leftEye.y) < TILT_THRESHOLD;
        const isVerticallyAligned = Math.abs(nose.y - (foreHead.y + chin.y) / 2) < VERTICAL_THRESHOLD;
        const isHorizontallyCentered = Math.abs(mouthCenter - (mouthLeft.x + mouthRight.x) / 2) < CENTER_THRESHOLD;

        if (!isFacingStraight) {
          alignmentMessage = "Face straight ahead";
        } else if (!isLevelTilt) {
          alignmentMessage = "Keep your head level";
        } else if (!isVerticallyAligned) {
          alignmentMessage = "Adjust head up/down";
        } else if (!isHorizontallyCentered) {
          alignmentMessage = "Center your face";
        } else {
          isProperlyAligned = true;
          alignmentMessage = "Perfect!";
        }
      }

      // Draw guide box with appropriate color
      ctx.strokeStyle = isProperlyAligned ? '#FFFFFF' : '#FF0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
      ctx.setLineDash([]);

      // Add glow effect
      ctx.shadowColor = isProperlyAligned ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
      ctx.shadowBlur = 15;
      ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
      ctx.shadowBlur = 0;

      // Add alignment text
      ctx.scale(-1, 1);
      ctx.font = '20px Arial';
      ctx.fillStyle = isProperlyAligned ? '#FFFFFF' : '#FF0000';
      ctx.textAlign = 'center';
      ctx.fillText(
        alignmentMessage,
        -canvasElement.width / 2,
        guideY - 10
      );

      setIsAligned(isProperlyAligned);

      // Draw face mesh
      ctx.scale(-1, 1);
      ctx.strokeStyle = isProperlyAligned ? '#00FF00' : '#FF0000';
      ctx.lineWidth = 1;

      for (const connection of FACEMESH_TESSELATION) {
        const start = landmarks[connection[0]];
        const end = landmarks[connection[1]];

        ctx.beginPath();
        ctx.moveTo(start.x * canvasElement.width, start.y * canvasElement.height);
        ctx.lineTo(end.x * canvasElement.width, end.y * canvasElement.height);
        ctx.stroke();
      }
    } else {
      // Draw default guide box when no face is detected
      const guideWidth = canvasElement.width * 0.3;
      const guideHeight = canvasElement.height * 0.45;
      const guideX = (canvasElement.width - guideWidth) / 2;
      const guideY = (canvasElement.height - guideHeight) / 2;

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
      ctx.setLineDash([]);
      setIsAligned(false);
    }

    ctx.restore();

    if (results.multiFaceLandmarks.length > 0) {
      analyzeFaceShape(results.multiFaceLandmarks[0]);
    }
  };

  const analyzeFaceShape = (landmarks: NormalizedLandmarkList) => {
    // Enhanced measurement points
    const measurements = {
      jaw: {
        left: landmarks[234],
        right: landmarks[454],
        bottom: landmarks[152],
        leftAngle: landmarks[137],
        rightAngle: landmarks[367]
      },
      cheekbone: {
        left: landmarks[123],
        right: landmarks[352],
        leftMid: landmarks[127],
        rightMid: landmarks[356]
      },
      forehead: {
        top: landmarks[10],
        left: landmarks[54],
        right: landmarks[284],
        midLeft: landmarks[68],
        midRight: landmarks[298]
      },
      chin: {
        point: landmarks[152],
        width: { left: landmarks[172], right: landmarks[397] },
        bottom: landmarks[152],
        underChin: landmarks[175]
      },
      temples: {
        left: landmarks[54],
        right: landmarks[284]
      },
      eyes: {
        left: landmarks[33],
        right: landmarks[263]
      }
    };

    // Calculate more detailed dimensions
    const dimensions = {
      faceWidth: Math.abs(measurements.jaw.right.x - measurements.jaw.left.x),
      faceHeight: Math.abs(measurements.forehead.top.y - measurements.chin.point.y),
      jawWidth: Math.abs(measurements.jaw.right.x - measurements.jaw.left.x),
      jawAngle: Math.abs(measurements.jaw.rightAngle.x - measurements.jaw.leftAngle.x),
      cheekboneWidth: Math.abs(measurements.cheekbone.right.x - measurements.cheekbone.left.x),
      chinWidth: Math.abs(measurements.chin.width.left.x - measurements.chin.width.right.x),
      foreheadWidth: Math.abs(measurements.forehead.right.x - measurements.forehead.left.x),
      foreheadMidWidth: Math.abs(measurements.forehead.midRight.x - measurements.forehead.midLeft.x),
      templeWidth: Math.abs(measurements.temples.right.x - measurements.temples.left.x),
      eyeLevel: (measurements.eyes.left.y + measurements.eyes.right.y) / 2,
      chinLength: Math.abs(measurements.chin.bottom.y - measurements.chin.underChin.y)
    };

    // Calculate enhanced ratios
    const ratios: Ratios = {
      widthToHeight: dimensions.faceWidth / dimensions.faceHeight,
      jawToCheek: dimensions.jawWidth / dimensions.cheekboneWidth,
      chinToJaw: dimensions.chinWidth / dimensions.jawWidth,
      foreheadToJaw: dimensions.foreheadWidth / dimensions.jawWidth,
      midfaceToJaw: dimensions.jawAngle / dimensions.jawWidth,
      templeToJaw: dimensions.templeWidth / dimensions.jawWidth,
      verticalThirds: {
        upper: Math.abs(measurements.forehead.top.y - dimensions.eyeLevel),
        middle: Math.abs(dimensions.eyeLevel - measurements.cheekbone.leftMid.y),
        lower: Math.abs(measurements.cheekbone.leftMid.y - measurements.chin.point.y)
      }
    };

    const verticalBalance = Math.abs((ratios.verticalThirds.upper / ratios.verticalThirds.middle) - 1) + Math.abs((ratios.verticalThirds.middle / ratios.verticalThirds.lower) - 1);

    const scores = {
      Triangle: calculateScore(ratios, verticalBalance, { widthToHeight: 1.4, jawToCheek: 1.3, chinToJaw: 0.65, foreheadToJaw: 0.7, verticalBalance: 0.2 }),
      Round: calculateScore(ratios, verticalBalance, { widthToHeight: 1.0, jawToCheek: 0.9, chinToJaw: 0.95, foreheadToJaw: 0.95, verticalBalance: 0.1 }),
      Square: calculateScore(ratios, verticalBalance, { widthToHeight: 1.0, jawToCheek: 1.0, chinToJaw: 0.95, foreheadToJaw: 1.0, verticalBalance: 0.1 }),
      Oval: calculateScore(ratios, verticalBalance, { widthToHeight: 1.5, jawToCheek: 0.85, chinToJaw: 0.75, foreheadToJaw: 0.95, verticalBalance: 0.1 }),
      Rectangle: calculateScore(ratios, verticalBalance, { widthToHeight: 1.6, jawToCheek: 0.95, chinToJaw: 0.9, foreheadToJaw: 1.0, verticalBalance: 0.15 })
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const normalizedScores: FaceShapePercentages = {
      Triangle: (scores.Triangle / totalScore) * 100,
      Round: (scores.Round / totalScore) * 100,
      Square: (scores.Square / totalScore) * 100,
      Oval: (scores.Oval / totalScore) * 100,
      Rectangle: (scores.Rectangle / totalScore) * 100
    };

    setShapePercentages(normalizedScores);
    const primaryShape = Object.entries(normalizedScores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    setFaceShape(primaryShape);
  };


  const calculateWeightedScore = (params: Array<{ value: number, ideal: number, weight: number, tolerance: number }>): number => {
    return params.reduce((score, { value, ideal, weight, tolerance }) => {
      const diff = Math.abs(value - ideal);
      const contribution = diff < tolerance ? weight * (1 - (diff / tolerance)) : 0;
      return score + contribution;
    }, 0);
  };

  const calculateScore = (ratios: Ratios, verticalBalance: number, ideal: IdealRatios): number => {
    return calculateWeightedScore([
      { value: ratios.widthToHeight, ideal: ideal.widthToHeight, weight: 0.3, tolerance: 0.15 },
      { value: ratios.jawToCheek, ideal: ideal.jawToCheek, weight: 0.25, tolerance: 0.1 },
      { value: ratios.chinToJaw, ideal: ideal.chinToJaw, weight: 0.2, tolerance: 0.1 },
      { value: ratios.foreheadToJaw, ideal: ideal.foreheadToJaw, weight: 0.15, tolerance: 0.1 },
      { value: verticalBalance, ideal: ideal.verticalBalance, weight: 0.1, tolerance: 0.05 }
    ]);
  };

  return (
    <div className="scanner-container-in-scanner">

      <div className="video-container-in-scanner">

        <video ref={videoRef} className="input-video-in-scanner" />
        <button className="back-button-in-scanner" onClick={() => navigate('/user/haircuts')}>
          <IoArrowBack /> Back
        </button>
        <canvas ref={canvasRef} className="output-canvas-in-scanner" width="640" height="480" />
        <button
          className="result-button-in-scanner"
          onClick={captureImage}
          disabled={!isAligned}
        >
          Show Result
        </button>
      </div>

      {showModal && (
        <div className="modal-in-scanner">
          <div className="modal-content-in-scanner">
            <button className="close-button-in-scanner" onClick={closeModal}>x</button>
            <div className="captured-image-container-in-scanner">
              {capturedImage && <img src={capturedImage} alt="Captured Face" />}
            </div>
            <h2>Detected Face Shape:</h2>
            <p>{lastDetectedFaceShape}</p>
            <button className="recommended-button-in-scanner" onClick={handleRecommendedClick}>
              Recommended Haircuts
            </button>
          </div>
        </div>
      )}

      <h2>Detected Face Shape:</h2>
      <p>{faceShape}</p>
    </div>
  );
};

export default Scanner;