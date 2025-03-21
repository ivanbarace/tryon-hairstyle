import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Recommended.css';
import * as mediapipe from '@mediapipe/face_mesh';
import * as drawing from '@mediapipe/drawing_utils';
import { FaCamera, FaRegBookmark } from 'react-icons/fa';  // Add FaRegBookmark import

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
  const [savingTryOn, setSavingTryOn] = useState<boolean>(false);
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
          topOffset: -19,
          leftOffset: 0,
          scale: .83
        });
      } else if (width <= 768) { // Tablet
        setResponsivePosition({
          topOffset: -19,
          leftOffset: 0,
          scale: .83
        });

      }
      else if (width <= 1200) { // Tablet
        setResponsivePosition({
          topOffset: -20,
          leftOffset: 0,
          scale: .85
        });

      } else { // Desktop
        setResponsivePosition({
          topOffset: -18,
          leftOffset: 0,
          scale: .75
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

      // Get leftmost and rightmost points with wider spread and adjusted height
      const leftPoint = landmarks[234]; // Left temple
      const rightPoint = landmarks[454]; // Right temple

      // Calculate adjusted ear positions (moved up by 2%)
      const adjustedLeftY = leftPoint.y - 0.02;  // Move up by 2%
      const adjustedRightY = rightPoint.y - 0.02; // Move up by 2%

      // Calculate wider points for more circular effect with adjusted height
      const extraWidth = canvas.width * 0.08; // Reduced from 0.1 to 0.08 for less width
      const leftX = (leftPoint.x * canvas.width) - extraWidth;
      const rightX = (rightPoint.x * canvas.width) + extraWidth;

      // Start the path from the wider left point with adjusted height
      ctx.moveTo(leftX, adjustedLeftY * canvas.height);

      // Calculate intermediate control points with wider spread
      const leftControlX = leftX * 0.95;
      const rightControlX = rightX * 1.05;
      const sideHeight = maxHeight + (canvas.height * 0.08);

      // Create curved path for left side with enhanced curve and adjusted height
      ctx.bezierCurveTo(
        leftControlX,
        sideHeight,
        canvas.width * 0.25,
        maxHeight - (canvas.height * 0.05),
        canvas.width * 0.5,
        maxHeight
      );

      // Create curved path for right side with enhanced curve and adjusted height
      ctx.bezierCurveTo(
        canvas.width * 0.75,
        maxHeight - (canvas.height * 0.05),
        rightControlX,
        sideHeight,
        rightX,
        adjustedRightY * canvas.height // Use adjusted right ear height
      );

      // Create the bottom path with smoother transition
      hairAreaPoints.forEach((index, i) => {
        const point = landmarks[index];
        if (i === 0) {
          ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
        } else {
          const prevPoint = landmarks[hairAreaPoints[i - 1]];
          const cpX = (prevPoint.x + point.x) / 2 * canvas.width;
          const cpY = (prevPoint.y + point.y) / 2 * canvas.height;
          ctx.quadraticCurveTo(cpX, cpY, point.x * canvas.width, point.y * canvas.height);
        }
      });

      ctx.closePath();

      // Sample skin color from forehead
      const foreheadPoint = landmarks[151];
      const sx = Math.floor(foreheadPoint.x * canvas.width);
      const sy = Math.floor(foreheadPoint.y * canvas.height);
      const skinColorData = ctx.getImageData(sx, sy, 1, 1).data;

      // Create temp canvas for enhanced blur effect
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        // Copy original image
        tempCtx.drawImage(img, 0, 0);

        // Create gradient blur effect
        // Inner strong blur (close to face)
        tempCtx.filter = 'blur(10px)';
        tempCtx.globalAlpha = 0.8;
        tempCtx.drawImage(canvas, 0, 0);

        // Middle blur layer (transition)
        tempCtx.filter = 'blur(12px)';
        tempCtx.globalAlpha = 0.5;
        // Scale and position for middle layer
        const middleScale = 1.02;
        tempCtx.scale(middleScale, middleScale);
        tempCtx.drawImage(canvas,
          -canvas.width * (middleScale - 1) / 2,
          -canvas.height * (middleScale - 1) / 2
        );
        tempCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

        // Outer blur layer (edges)
        tempCtx.filter = 'blur(15px)';
        tempCtx.globalAlpha = 0.3;
        // Scale and position for outer layer
        const outerScale = 1.04;
        tempCtx.scale(outerScale, outerScale);
        tempCtx.drawImage(canvas,
          -canvas.width * (outerScale - 1) / 2,
          -canvas.height * (outerScale - 1) / 2
        );
        tempCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

        // Add skin tone overlay with gradient
        const gradient = tempCtx.createRadialGradient(
          sx, sy, 0,          // Inner circle center and radius
          sx, sy, canvas.width * 0.3  // Outer circle radius
        );
        gradient.addColorStop(0, `rgba(${skinColorData[0]}, ${skinColorData[1]}, ${skinColorData[2]}, 0.5)`);
        gradient.addColorStop(1, `rgba(${skinColorData[0]}, ${skinColorData[1]}, ${skinColorData[2]}, 0)`);

        tempCtx.globalAlpha = 0.5;
        tempCtx.fillStyle = gradient;
        tempCtx.globalCompositeOperation = 'overlay';
        tempCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle highlight with fade
        const highlightGradient = tempCtx.createRadialGradient(
          sx, sy, 0,
          sx, sy, canvas.width * 0.25
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        tempCtx.fillStyle = highlightGradient;
        tempCtx.globalCompositeOperation = 'soft-light';
        tempCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Reset composite operation
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.globalAlpha = 1.0;

        // Apply the effect to hair area
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

  const handleSaveTryOn = async (hairstyleId: string, backgroundImage: string, hairstyleName: string) => {
    try {
      setSavingTryOn(true);

      // Create a temporary canvas to merge the images
      const mergeCanvas = document.createElement('canvas');
      const mergeCtx = mergeCanvas.getContext('2d');
      if (!mergeCtx) return;

      // Create background image element
      const bgImage = new Image();
      bgImage.crossOrigin = "anonymous";
      bgImage.src = backgroundImage;

      await new Promise((resolve) => {
        bgImage.onload = async () => {
          // Set canvas size to match background image
          mergeCanvas.width = bgImage.width;
          mergeCanvas.height = bgImage.height;

          // Draw background image
          mergeCtx.drawImage(bgImage, 0, 0);

          // Create hairstyle image element
          const hairstyleImage = new Image();
          hairstyleImage.crossOrigin = "anonymous";
          hairstyleImage.src = `${import.meta.env.VITE_BACKEND_URL}${matchingHairstyles.find(h => h.id === hairstyleId)?.image_url.replace(/^\//, '')}`;

          await new Promise((resolve) => {
            hairstyleImage.onload = () => {
              // Apply the same transformations as in the display
              mergeCtx.save();
              if (facePosition) {
                const centerX = (mergeCanvas.width * facePosition.x) / 100;
                const centerY = (mergeCanvas.height * facePosition.y) / 100;

                mergeCtx.translate(centerX, centerY);
                mergeCtx.rotate((faceRotation * Math.PI) / 180);

                // Calculate the scale to match what's shown on screen
                const displayScale = (facePosition.scale * responsivePosition.scale) / 100;
                // Adjust scale factor to match display size
                const scaleFactor = 1.2; // Increase this value to make the hair larger
                const finalScale = displayScale * scaleFactor;

                mergeCtx.scale(finalScale, finalScale);

                // Set blend mode and filters
                mergeCtx.globalCompositeOperation = 'multiply';
                // Add contrast and brightness filters
                mergeCtx.filter = 'contrast(1.2) brightness(1.1)';

                // Draw hairstyle image
                mergeCtx.drawImage(
                  hairstyleImage,
                  -hairstyleImage.width / 2,
                  -hairstyleImage.height / 2
                );
              }
              mergeCtx.restore();
              resolve(true);
            };
            hairstyleImage.onerror = () => {
              console.error('Error loading hairstyle image');
              resolve(true);
            };
          });

          // Create a download link
          const downloadLink = document.createElement('a');
          downloadLink.download = `tryon-${hairstyleName}-${new Date().getTime()}.png`;
          downloadLink.href = mergeCanvas.toDataURL('image/png');
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          resolve(true);
        };
      });
    } catch (error) {
      console.error('Error creating image:', error);
      alert('Error creating image');
    } finally {
      setSavingTryOn(false);
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
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}getFacemesh/${userData.id}`);
          console.log('Facemesh response:', response.data);

          if (response.data.success) {
            // Ensure proper URL construction by removing any double slashes
            const baseUrl = import.meta.env.VITE_BACKEND_URL.endsWith('/')
              ? import.meta.env.VITE_BACKEND_URL.slice(0, -1)
              : import.meta.env.VITE_BACKEND_URL;

            const imageUrl = `${baseUrl}/facemesh/${response.data.facemeshData}`;
            console.log('Constructed image URL:', imageUrl); // Debug log

            setFacemeshImage(imageUrl);
            setUserFaceShape(response.data.faceShape);
          } else {
            console.error('Failed to fetch facemesh data:', response.data.error);
          }
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
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}matching-hairstyles/${userFaceShape}`, {
            params: {
              faceshape: userFaceShape,
              status: 'active'
            }
          });

          if (response.data.length === 0) {
            console.log('No matching hairstyles found for face shape:', userFaceShape);
          } else {
            // Log the full URL to debug
            console.log('First hairstyle image URL:', `${import.meta.env.VITE_BACKEND_URL}${response.data[0].image_url}`);
            setMatchingHairstyles(response.data);
          }
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
          <FaCamera /> Scan Again
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
                <button
                  className="save-button-inRecommendedScreen"
                  aria-label="Download_tryon_hairstyle"
                  onClick={() => processedBackground && handleSaveTryOn(hairstyle.id, processedBackground, hairstyle.name)}
                  disabled={savingTryOn}
                >
                  <FaRegBookmark />
                </button>
                {processedBackground && headDimensions && facePosition && (
                  <>
                    <img
                      src={processedBackground}
                      alt="background"
                      className="hairstyle-background-canvas-inRecommendedScreen"
                    />
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}${hairstyle.image_url.replace(/^\//, '')}`}
                      alt={hairstyle.name}
                      className="hairstyle-overlay-image-inRecommendedScreen"
                      onError={(e) => {
                        console.error('Error loading hairstyle image:', e);
                        console.log('Attempted URL:', `${import.meta.env.VITE_BACKEND_URL}${hairstyle.image_url.replace(/^\//, '')}`);
                      }}
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