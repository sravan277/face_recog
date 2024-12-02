import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import LoadingScreen from '../components/LoadingScreen';
import Footer from '../components/Footer';

const CameraAnalysis = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const validTypes = ['face', 'group', 'crowd'];
    if (!type || !validTypes.includes(type)) {
      navigate('/dashboard');
      return;
    }

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
          faceapi.nets.ageGenderNet.loadFromUri('/models')
        ]);
        setIsModelLoaded(true);
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [type, navigate]);

  useEffect(() => {
    let animationFrame: number;
    
    const detectFaces = async () => {
      if (!videoRef.current || !canvasRef.current || !isCameraActive || !isModelLoaded) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      
      faceapi.matchDimensions(canvas, displaySize);

      const detectAndDraw = async () => {
        if (!video || !canvas) return;

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const context = canvas.getContext('2d');
        
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

          // Draw age and gender
          resizedDetections.forEach(detection => {
            const { age, gender, genderProbability } = detection;
            const box = detection.detection.box;
            const text = `${Math.round(age)} years ${gender} (${Math.round(genderProbability * 100)}%)`;
            const anchor = { x: box.x, y: box.bottom + 15 };
            const drawOptions = {
              anchorPosition: 'TOP_LEFT' as faceapi.draw.DrawTextFieldOptions['anchorPosition'],
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              fontColor: 'white',
              fontSize: 16,
              padding: 5
            };
            
            new faceapi.draw.DrawTextField(
              [text],
              anchor,
              drawOptions
            ).draw(canvas);
          });
        }

        animationFrame = requestAnimationFrame(detectAndDraw);
      };

      detectAndDraw();
    };

    if (isCameraActive) {
      detectFaces();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isCameraActive, isModelLoaded]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4"
    >
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Real-time {type?.charAt(0).toUpperCase()}{type?.slice(1)} Analysis</h1>
          <button
            onClick={() => navigate(`/analysis/${type}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Analysis
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Camera Feed</h2>
              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`px-4 py-2 rounded-md ${
                  isCameraActive 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isCameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {!isModelLoaded && (
          <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
            Loading AI models... Please wait.
          </div>
        )}
      </div>

      <div className="mt-20"></div>
      <Footer />
    </motion.div>
  );
};

export default CameraAnalysis;
