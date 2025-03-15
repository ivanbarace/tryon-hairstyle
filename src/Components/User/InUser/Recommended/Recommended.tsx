import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Recommended.css';
import * as mediapipe from '@mediapipe/face_mesh';
import * as drawing from '@mediapipe/drawing_utils';

const Recommended: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [facemeshImage, setFacemeshImage] = useState<string | null>(null);
  const [userFaceShape, setUserFaceShape] = useState<string | null>(null);
  const [processedBackground, setProcessedBackground] = useState<string | null>(null);
  const [headDimensions, setHeadDimensions] = useState<{
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [facePosition, setFacePosition] = useState<{
    x: number;
    y: number;
    scale: number;
  } | null>(null);
  const [faceRotation, setFaceRotation] = useState<number>(0);
  // Removed unused userData state
  interface Hairstyle {
    id: string;
    image_url: string;
    name: string;
    rating: number;
    description: string;
    hairtype: string;
    hair_length: string;
  }

  const [matchingHairstyles, setMatchingHairstyles] = useState<Hairstyle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const faceMeshRef = useRef<mediapipe.FaceMesh | null>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

  // Add these new states for responsive positioning
  const [responsivePosition, setResponsivePosition] = useState({
    topOffset: 0,
    leftOffset: 1,
    scale: 1
  });

  // Add this new useEffect for handling responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 480) { // Mobile
        setResponsivePosition({
          topOffset: -23,
          leftOffset: 0,
          scale: 1
        });
      } else if (width <= 768) { // Tablet
        setResponsivePosition({
          topOffset: -23,
          leftOffset: 0,
          scale: 1
        });

      }
      else if (width <= 1200) { // Tablet
        setResponsivePosition({
          topOffset: -25,
          leftOffset: 0,
          scale: 1
        });

      } else { // Desktop
        setResponsivePosition({
          topOffset: -20,
          leftOffset: 0,
          scale: 1
        });
      }
    };

    // Initial call
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initializeFaceMesh = async () => {
    const faceMesh = new mediapipe.FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);
    faceMeshRef.current = faceMesh;
  };

  const calculateFaceRotation = (landmarks: mediapipe.NormalizedLandmarkList) => {
    // Use eyes to calculate rotation
    const leftEye = landmarks[33];  // Left eye outer corner
    const rightEye = landmarks[133]; // Right eye outer corner

    // Calculate angle between eyes
    const deltaY = rightEye.y - leftEye.y;
    const deltaX = rightEye.x - leftEye.x;
    const angleInRadians = Math.atan2(deltaY, deltaX);
    const angleInDegrees = angleInRadians * (180 / Math.PI);

    return angleInDegrees;
  };

  const calculateHeadDimensions = (landmarks: mediapipe.NormalizedLandmarkList) => {
    // Top of forehead
    const foreheadTop = landmarks[10];
    // Temple points
    const leftTemple = landmarks[234];
    const rightTemple = landmarks[454];
    // Chin point
    const chin = landmarks[152];
    // Side face points
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    const height = Math.abs(chin.y - foreheadTop.y);
    const centerX = (leftTemple.x + rightTemple.x) / 2;
    // Adjust centerY to be slightly higher for better hair placement
    const centerY = foreheadTop.y + (height * 0.1); // Move down 10% from forehead

    // Calculate face width at different heights for better scaling
    const topWidth = Math.abs(rightTemple.x - leftTemple.x);
    const middleWidth = Math.abs(rightCheek.x - leftCheek.x);
    const maxWidth = Math.max(topWidth, middleWidth) * 1.1; // Add 40% for hair width

    setFacePosition({
      x: centerX * 100,
      y: centerY * 100,
      scale: maxWidth * 150 // Adjust scale based on maximum face width
    });

    // Calculate rotation
    const rotation = calculateFaceRotation(landmarks);
    setFaceRotation(rotation);

    return {
      top: foreheadTop.y * 100,
      width: maxWidth * 100,
      height: height * 100 * 1.8
    };
  };

  const onResults = (results: mediapipe.Results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;

    if (!canvas || !ctx || !results.multiFaceLandmarks || !img) return;

    // Set canvas dimensions
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }

    // Draw original image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Create hair area mask
      ctx.save();
      ctx.beginPath();

      // Define hair area points (top of head to ears)
      const hairAreaPoints = [361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10, 109, 67, 103, 54, 21, 162, 127, 234, 93];

      // Calculate the highest point from landmarks
      const highestY = Math.min(...hairAreaPoints.map(index => landmarks[index].y)) * canvas.height;
      const maxHeight = highestY - (canvas.height * 0.15); // Limit the height to 15% above highest landmark

      // Get leftmost and rightmost points
      const leftPoint = landmarks[234]; // Left temple
      const rightPoint = landmarks[454]; // Right temple

      // Start the path
      ctx.moveTo(leftPoint.x * canvas.width, leftPoint.y * canvas.height);

      // Calculate intermediate control points
      const leftControlX = leftPoint.x * canvas.width * 0.9;
      const rightControlX = rightPoint.x * canvas.width * 1.1;
      const sideHeight = maxHeight + (canvas.height * 0.05); // Slightly higher on the sides

      // Create curved path for left side with two control points
      ctx.bezierCurveTo(
        leftControlX, // First control point X
        sideHeight, // First control point Y
        canvas.width * 0.3, // Second control point X
        maxHeight, // Second control point Y
        canvas.width * 0.5, // End point X (middle)
        maxHeight + (canvas.height * 0.02) // End point Y (slightly higher in middle)
      );

      // Create curved path for right side with two control points
      ctx.bezierCurveTo(
        canvas.width * 0.7, // First control point X
        maxHeight, // First control point Y
        rightControlX, // Second control point X
        sideHeight, // Second control point Y
        rightPoint.x * canvas.width, // End point X
        rightPoint.y * canvas.height // End point Y
      );

      // Create the bottom path following face landmarks
      hairAreaPoints.forEach((index) => {
        const point = landmarks[index];
        ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
      });

      ctx.closePath();

      // Sample skin color from forehead
      const foreheadPoint = landmarks[151]; // Center of forehead
      const sx = Math.floor(foreheadPoint.x * canvas.width);
      const sy = Math.floor(foreheadPoint.y * canvas.height);
      const skinColorData = ctx.getImageData(sx, sy, 1, 1).data;

      // Create temp canvas for blur effect
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        // Copy original image
        tempCtx.drawImage(img, 0, 0);

        // Apply graduated blur effect
        tempCtx.filter = 'blur(12px)';
        tempCtx.drawImage(canvas, 0, 0);

        // Add second blur layer with less intensity
        tempCtx.filter = 'blur(8px)';
        tempCtx.globalAlpha = 0.6;
        tempCtx.drawImage(canvas, 0, 0);

        // Add skin tone overlay with reduced opacity
        tempCtx.globalAlpha = 0.6;
        tempCtx.fillStyle = `rgba(${skinColorData[0]}, ${skinColorData[1]}, ${skinColorData[2]}, 0.6)`;
        tempCtx.globalCompositeOperation = 'overlay';
        tempCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle highlight
        tempCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        tempCtx.globalCompositeOperation = 'soft-light';
        tempCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Reset composite operation
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.globalAlpha = 1.0;

        // Only apply the effect to hair area
        ctx.clip();
        ctx.drawImage(tempCanvas, 0, 0);
      }
      ctx.restore();

      // Draw face oval with subtle line
      drawing.drawConnectors(
        ctx,
        landmarks,
        mediapipe.FACEMESH_FACE_OVAL,
        { color: 'rgba(0, 255, 0, 0)', lineWidth: 1 }  // Changed opacity to 0
      );

      // Calculate and store head dimensions
      const dimensions = calculateHeadDimensions(landmarks);
      setHeadDimensions(dimensions);
    }
    createBackgroundImage();
    processBackgroundForHairstyle();
  };

  const processImage = async () => {
    if (!faceMeshRef.current || !imageRef.current || !canvasRef.current) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Create an HTMLImageElement with crossOrigin attribute
    const tempImage = new Image();
    tempImage.crossOrigin = "anonymous";  // Add this line
    tempImage.src = img.src;

    tempImage.onload = async () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(tempImage, 0, 0, canvas.width, canvas.height);

      try {
        await faceMeshRef.current?.send({ image: tempImage });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    };
  };

  const createBackgroundImage = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setProcessedBackground(dataUrl);
    } catch (error) {
      console.error('Error creating background image:', error);
    }
  };

  const processBackgroundForHairstyle = async () => {
    if (!canvasRef.current || !backgroundCanvasRef.current) return;

    const originalCanvas = canvasRef.current;
    const bgCanvas = backgroundCanvasRef.current;
    const bgCtx = bgCanvas.getContext('2d');

    if (!bgCtx) return;

    // Match dimensions
    bgCanvas.width = originalCanvas.width;
    bgCanvas.height = originalCanvas.height;

    // Draw the original canvas with face mesh
    bgCtx.drawImage(originalCanvas, 0, 0);

    // Store the processed background
    try {
      const dataUrl = bgCanvas.toDataURL('image/png');
      setProcessedBackground(dataUrl);
    } catch (error) {
      console.error('Error creating background image:', error);
    }
  };

  useEffect(() => {
    initializeFaceMesh();
    return () => {
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  },);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          const response = await axios.get(`http://localhost:5000/getFacemesh/${userData.id}`);
          console.log('Facemesh response:', response.data);

          // Construct the full URL for the image
          const imageUrl = `http://localhost:5000${response.data.facemeshImage}`;
          setFacemeshImage(imageUrl);
          setUserFaceShape(response.data.faceShape);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (facemeshImage && imageRef.current) {
      // Wait for both the image to load and FaceMesh to initialize
      const loadImage = async () => {
        await initializeFaceMesh();
        processImage();
      };
      loadImage();
    }
  }, [facemeshImage]);

  useEffect(() => {
    const fetchMatchingHairstyles = async () => {
      if (userFaceShape) {
        try {
          // Updated to use the correct route and include status filter
          const response = await axios.get(`http://localhost:5000/matching-hairstyles/${userFaceShape}`, {
            params: {
              faceshape: userFaceShape,
              status: 'active'
            }
          });

          if (response.data.length === 0) {
            console.log('No matching hairstyles found for face shape:', userFaceShape);
          } else {
            console.log('Found matching hairstyles:', response.data);
          }

          setMatchingHairstyles(response.data);
        } catch (error) {
          console.error('Error fetching matching hairstyles:', error);
        }
      }
    };

    fetchMatchingHairstyles();
  }, [userFaceShape]);

  if (loading) {
    return <div className="recommended-inRecommendedScreen">Loading...</div>;
  }

  return (
    <div className="recommended-inRecommendedScreen">
      <div className="recommended-header-inRecommendedScreen">
        <h2>Your Face Shape Analysis</h2>
        <button className="scanner-button-inRecommendedScreen" onClick={() => navigate('/user/scanner')}>
          Scan Again
        </button>
      </div>

      {facemeshImage && (
        <div className="facemesh-container-inRecommendedScreen" style={{ display: 'none' }}>
          <h3>Your Facemesh Image:</h3>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              ref={imageRef}
              crossOrigin="anonymous"  // Add this line
              src={facemeshImage || ''}
              alt="Facemesh"
              className="facemesh-image-inRecommendedScreen"
              style={{ display: 'block' }}
              onError={(e) => {
                console.error('Error loading image:', e);
                console.log('Image URL:', facemeshImage);
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                pointerEvents: 'none',
                width: '100%',
                height: '100%'
              }}
            />
          </div>
          <p className="face-shape-info-inRecommendedScreen">Your Face Shape: {userFaceShape}</p>
        </div>
      )}

      <canvas
        ref={backgroundCanvasRef}
        style={{ display: 'none' }}
      />

      <div className="recommended-hairstyles-section-inRecommendedScreen">
        <h3>Recommended Hairstyles for {userFaceShape} Face Shape</h3>
        <div className="hairstyles-grid-inRecommendedScreen">
          {matchingHairstyles.map((hairstyle) => (
            <div key={hairstyle.id} className="hairstyle-card-inRecommendedScreen">
              <div className="hairstyle-canvas-container-inRecommendedScreen">
                {processedBackground && headDimensions && facePosition && (
                  <>
                    <img
                      src={processedBackground}
                      alt="background"
                      className="hairstyle-background-canvas-inRecommendedScreen"
                    />
                    <img
                      src={`http://localhost:5000${hairstyle.image_url}`}
                      alt={hairstyle.name}
                      className="hairstyle-overlay-image-inRecommendedScreen"
                      style={{
                        position: 'absolute',
                        top: `${facePosition.y + responsivePosition.topOffset}%`,
                        left: `${facePosition.x + responsivePosition.leftOffset}%`,
                        transform: `
                          translate(-50%, -50%) 
                          scale(${facePosition.scale * responsivePosition.scale}%) 
                          rotate(${faceRotation}deg)
                        `,
                        width: '100%',
                        height: 'auto',
                        opacity: 1,
                        zIndex: 10,
                        transformOrigin: 'center 60%'
                      }}
                    />
                  </>
                )}
              </div>
              <div className="hairstyle-info-inRecommendedScreen">
                <h4>{hairstyle.name}</h4>
                <p>Hair Type: {hairstyle.hairtype}</p>
                <p>Hair Length: {hairstyle.hair_length}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommended;