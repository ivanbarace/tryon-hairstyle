import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Recommended.css';
import * as mediapipe from '@mediapipe/face_mesh';
import * as drawing from '@mediapipe/drawing_utils';
import { FaCamera, FaDownload } from 'react-icons/fa';  // Add FaDownload import

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
  const [downloadSettings, setDownloadSettings] = useState({
    scale: 1.0,
    verticalOffset: 0,
    horizontalOffset: 0
  });

  interface Hairstyle {
    id: string;
    image_url: string;
    name: string;
    description: string;
    hairtype: string;
    hair_length: string;
    created_at: string;
    faceshapes: string[];
  }

  const [matchingHairstyles, setMatchingHairstyles] = useState<Hairstyle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const faceMeshRef = useRef<mediapipe.FaceMesh | null>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

  const [responsivePosition, setResponsivePosition] = useState({
    topOffset: -17,
    leftOffset: 0,
    scale: 0.85
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 480) { // Mobile
        setResponsivePosition({
          topOffset: -18,
          leftOffset: 0,
          scale: 0.84
        });
      } else if (width <= 768) { // Tablet
        setResponsivePosition({
          topOffset: -18,
          leftOffset: 0,
          scale: 0.85
        });
      } else if (width <= 1200) { // Small Desktop
        setResponsivePosition({
          topOffset: -17,
          leftOffset: 0,
          scale: 0.85
        });
      } else { // Large Desktop
        setResponsivePosition({
          topOffset: -18,
          leftOffset: 0.09,
          scale: 0.76
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleDownloadSettings = () => {
      const width = window.innerWidth;
      if (width <= 480) { // Mobile
        setDownloadSettings({
          scale: 1.07,
          verticalOffset: 0,
          horizontalOffset: 2.25
        });
      } else if (width <= 768) { // Tablet
        setDownloadSettings({
          scale: 1.07,
          verticalOffset: 0,
          horizontalOffset: 2.3
        });
      } else if (width <= 1200) { // Small Desktop
        setDownloadSettings({
          scale: 1.07,
          verticalOffset: 0,
          horizontalOffset: 2.3
        });
      } else { // Large Desktop
        setDownloadSettings({
          scale: 1.2,
          verticalOffset: -1.5,
          horizontalOffset: 2
        });
      }
    };

    handleDownloadSettings();
    window.addEventListener('resize', handleDownloadSettings);
    return () => window.removeEventListener('resize', handleDownloadSettings);
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
    const leftEye = landmarks[33];
    const rightEye = landmarks[133];

    const deltaY = rightEye.y - leftEye.y;
    const deltaX = rightEye.x - leftEye.x;
    const angleInRadians = Math.atan2(deltaY, deltaX);
    const angleInDegrees = angleInRadians * (180 / Math.PI);

    return angleInDegrees;
  };

  const calculateHeadDimensions = (landmarks: mediapipe.NormalizedLandmarkList) => {
    const foreheadTop = landmarks[10];
    const leftTemple = landmarks[234];
    const rightTemple = landmarks[454];
    const chin = landmarks[152];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];

    const height = Math.abs(chin.y - foreheadTop.y);
    const centerX = (leftTemple.x + rightTemple.x) / 2;
    const centerY = foreheadTop.y + (height * 0.1);

    const topWidth = Math.abs(rightTemple.x - leftTemple.x);
    const middleWidth = Math.abs(rightCheek.x - leftCheek.x);
    const maxWidth = Math.max(topWidth, middleWidth) * 1.1;

    setFacePosition({
      x: centerX * 100,
      y: centerY * 100,
      scale: maxWidth * 150
    });

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

    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      ctx.save();
      ctx.beginPath();

      const hairAreaPoints = [361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10, 109, 67, 103, 54, 21, 162, 127, 234, 93];

      const highestY = Math.min(...hairAreaPoints.map(index => landmarks[index].y)) * canvas.height;
      const maxHeight = highestY - (canvas.height * 0.15);

      const leftPoint = landmarks[234];
      const rightPoint = landmarks[454];

      const adjustedLeftY = leftPoint.y - 0.02;
      const adjustedRightY = rightPoint.y - 0.02;

      const extraWidth = canvas.width * 0.08;
      const leftX = (leftPoint.x * canvas.width) - extraWidth;
      const rightX = (rightPoint.x * canvas.width) + extraWidth;

      ctx.moveTo(leftX, adjustedLeftY * canvas.height);

      const leftControlX = leftX * 0.95;
      const rightControlX = rightX * 1.05;
      const sideHeight = maxHeight + (canvas.height * 0.08);

      ctx.bezierCurveTo(
        leftControlX,
        sideHeight,
        canvas.width * 0.25,
        maxHeight - (canvas.height * 0.05),
        canvas.width * 0.5,
        maxHeight
      );

      ctx.bezierCurveTo(
        canvas.width * 0.75,
        maxHeight - (canvas.height * 0.05),
        rightControlX,
        sideHeight,
        rightX,
        adjustedRightY * canvas.height
      );

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

      const foreheadPoint = landmarks[151];
      const sx = Math.floor(foreheadPoint.x * canvas.width);
      const sy = Math.floor(foreheadPoint.y * canvas.height);
      const skinColorData = ctx.getImageData(sx, sy, 1, 1).data;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0);

        tempCtx.filter = 'blur(10px)';
        tempCtx.globalAlpha = 0.8;
        tempCtx.drawImage(canvas, 0, 0);

        tempCtx.filter = 'blur(12px)';
        tempCtx.globalAlpha = 0.5;
        const middleScale = 1.02;
        tempCtx.scale(middleScale, middleScale);
        tempCtx.drawImage(canvas,
          -canvas.width * (middleScale - 1) / 2,
          -canvas.height * (middleScale - 1) / 2
        );
        tempCtx.setTransform(1, 0, 0, 1, 0, 0);

        tempCtx.filter = 'blur(15px)';
        tempCtx.globalAlpha = 0.3;
        const outerScale = 1.04;
        tempCtx.scale(outerScale, outerScale);
        tempCtx.drawImage(canvas,
          -canvas.width * (outerScale - 1) / 2,
          -canvas.height * (outerScale - 1) / 2
        );
        tempCtx.setTransform(1, 0, 0, 1, 0, 0);

        const gradient = tempCtx.createRadialGradient(
          sx, sy, 0,
          sx, sy, canvas.width * 0.3
        );
        gradient.addColorStop(0, `rgba(${skinColorData[0]}, ${skinColorData[1]}, ${skinColorData[2]}, 0.5)`);
        gradient.addColorStop(1, `rgba(${skinColorData[0]}, ${skinColorData[1]}, ${skinColorData[2]}, 0)`);

        tempCtx.globalAlpha = 0.5;
        tempCtx.fillStyle = gradient;
        tempCtx.globalCompositeOperation = 'overlay';
        tempCtx.fillRect(0, 0, canvas.width, canvas.height);

        const highlightGradient = tempCtx.createRadialGradient(
          sx, sy, 0,
          sx, sy, canvas.width * 0.25
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        tempCtx.fillStyle = highlightGradient;
        tempCtx.globalCompositeOperation = 'soft-light';
        tempCtx.fillRect(0, 0, canvas.width, canvas.height);

        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.globalAlpha = 1.0;

        ctx.clip();
        ctx.drawImage(tempCanvas, 0, 0);
      }
      ctx.restore();

      drawing.drawConnectors(
        ctx,
        landmarks,
        mediapipe.FACEMESH_FACE_OVAL,
        { color: 'rgba(0, 255, 0, 0)', lineWidth: 1 }
      );

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

    const tempImage = new Image();
    tempImage.crossOrigin = "anonymous";
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

    bgCanvas.width = originalCanvas.width;
    bgCanvas.height = originalCanvas.height;

    bgCtx.drawImage(originalCanvas, 0, 0);

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
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}getFacemesh/${userData.id}`);
          console.log('Facemesh response:', response.data);

          if (response.data.success) {
            const baseUrl = import.meta.env.VITE_BACKEND_URL.endsWith('/')
              ? import.meta.env.VITE_BACKEND_URL.slice(0, -1)
              : import.meta.env.VITE_BACKEND_URL;

            const imageUrl = `${baseUrl}/facemesh/${response.data.facemeshData}`;
            console.log('Constructed image URL:', imageUrl);

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
              status: 'active'
            }
          });

          if (response.data && Array.isArray(response.data)) {
            if (response.data.length === 0) {
              console.log('No matching hairstyles found for face shape:', userFaceShape);
            } else {
              const processedHairstyles = response.data.map(hairstyle => ({
                ...hairstyle,
                faceshapes: hairstyle.faceshapes || [],
                image_url: hairstyle.image_url.startsWith('/')
                  ? hairstyle.image_url.substring(1)
                  : hairstyle.image_url
              }));
              setMatchingHairstyles(processedHairstyles);
            }
          } else {
            console.error('Invalid response format:', response.data);
          }
        } catch (error) {
          console.error('Error fetching matching hairstyles:', error);
          if (axios.isAxiosError(error)) {
            console.error('Server error details:', error.response?.data);
          }
        }
      }
    };

    fetchMatchingHairstyles();
  }, [userFaceShape]);

  const renderFaceShapes = (faceshapes: string[]) => {
    return faceshapes.join(', ');
  };

  const handleSaveTryOn = async (hairstyleId: string, backgroundImage: string, hairstyleName: string) => {
    try {
      setSavingTryOn(true);

      const selectedHairstyle = matchingHairstyles.find(h => h.id === hairstyleId);
      if (!selectedHairstyle) {
        throw new Error('Hairstyle not found');
      }

      const mergeCanvas = document.createElement('canvas');
      const mergeCtx = mergeCanvas.getContext('2d');
      if (!mergeCtx) return;

      const bgImage = new Image();
      bgImage.crossOrigin = "anonymous";
      bgImage.src = backgroundImage;

      await new Promise((resolve) => {
        bgImage.onload = async () => {
          mergeCanvas.width = bgImage.width;
          mergeCanvas.height = bgImage.height;
          mergeCtx.drawImage(bgImage, 0, 0);

          const hairstyleImage = new Image();
          hairstyleImage.crossOrigin = "anonymous";
          const hairstyleUrl = `${import.meta.env.VITE_BACKEND_URL}${selectedHairstyle.image_url.replace(/^\//, '')}`;
          hairstyleImage.src = hairstyleUrl;

          await new Promise((resolve) => {
            hairstyleImage.onload = () => {
              if (facePosition) {
                mergeCtx.save();

                const centerX = (mergeCanvas.width * facePosition.x) / 100 + downloadSettings.horizontalOffset;
                const centerY = (mergeCanvas.height * facePosition.y) / 100 + downloadSettings.verticalOffset;

                // Calculate the desired width with adjusted scale
                const desiredWidth = (mergeCanvas.width * facePosition.scale * responsivePosition.scale * downloadSettings.scale) / 100;

                // Calculate scale factors to maintain aspect ratio while matching desired width
                const scaleX = desiredWidth / hairstyleImage.width;
                const scaleY = scaleX; // Keep aspect ratio

                mergeCtx.translate(centerX, centerY);
                mergeCtx.rotate((faceRotation * Math.PI) / 180);

                // Draw red border lines at consistent width
                mergeCtx.strokeStyle = 'red';
                mergeCtx.lineWidth = 2;
                mergeCtx.beginPath();

                const borderWidth = desiredWidth / 2;
                // Left border
                mergeCtx.moveTo(-borderWidth, -hairstyleImage.height * scaleY / 2);
                mergeCtx.lineTo(-borderWidth, hairstyleImage.height * scaleY / 2);
                // Right border
                mergeCtx.moveTo(borderWidth, -hairstyleImage.height * scaleY / 2);
                mergeCtx.lineTo(borderWidth, hairstyleImage.height * scaleY / 2);
                mergeCtx.stroke();

                mergeCtx.globalCompositeOperation = 'multiply';
                mergeCtx.filter = 'contrast(1.2) brightness(1.1)';

                // Draw the hairstyle with consistent scaling
                mergeCtx.drawImage(
                  hairstyleImage,
                  -hairstyleImage.width * scaleX / 2,
                  -hairstyleImage.height * scaleY / 2,
                  hairstyleImage.width * scaleX,
                  hairstyleImage.height * scaleY
                );

                mergeCtx.restore();
              }
              resolve(true);
            };
            hairstyleImage.onerror = () => {
              console.error('Error loading hairstyle image');
              resolve(true);
            };
          });

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
              crossOrigin="anonymous"
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
                  <FaDownload />
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
                <p>Face Shapes: {renderFaceShapes(hairstyle.faceshapes)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommended;