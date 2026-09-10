import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon } from 'lucide-react';

interface CameraCaptureModalProps {
  title: string;
  subtitle?: string;
  facingMode?: 'user' | 'environment';
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
  isOpen?: boolean;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  title,
  subtitle,
  facingMode = 'user',
  onCapture,
  onClose,
  isOpen = true
}) => {
  if (isOpen === false) return null;
  const [currentFacing, setCurrentFacing] = useState<'user' | 'environment'>(facingMode);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Camera Stream
  const startCamera = async (facing: 'user' | 'environment') => {
    setErrorMsg(null);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device API not supported in this browser. Please use the file upload option.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(newStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Camera access notice:', err);
      setIsCameraActive(false);
      setErrorMsg('Camera access is restricted or unavailable. You can upload a photo from your gallery/files below.');
    }
  };

  useEffect(() => {
    startCamera(currentFacing);
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [currentFacing]);

  // Take Snapshot from video canvas
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera for natural mirror selfie
    if (currentFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);

    // Stop stream
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
  };

  // Flip Camera between user and environment
  const toggleFacing = () => {
    const next = currentFacing === 'user' ? 'environment' : 'user';
    setCurrentFacing(next);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(currentFacing);
  };

  // Confirm photo
  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  // File Upload fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-black text-zinc-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              <span>{title}</span>
            </h3>
            {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
          </div>

          <button
            onClick={() => {
              if (stream) stream.getTracks().forEach(t => t.stop());
              onClose();
            }}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport / Preview Canvas */}
        <div className="relative bg-zinc-950 aspect-[4/3] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          ) : isCameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${currentFacing === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Viewfinder Target Guide */}
              <div className="absolute inset-8 border-2 border-dashed border-amber-400/60 rounded-3xl pointer-events-none flex items-center justify-center">
                <span className="text-[10px] font-bold text-amber-300 bg-zinc-950/70 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  Align within frame
                </span>
              </div>
            </>
          ) : (
            <div className="p-6 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                {errorMsg || 'Initializing camera feed...'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs inline-flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload From Device</span>
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture={currentFacing === 'user' ? 'user' : 'environment'}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Controls */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between gap-2">
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Photo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              {/* Flip camera */}
              <button
                type="button"
                onClick={toggleFacing}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-zinc-300 hover:text-amber-400 transition-colors"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Shutter Button */}
              {isCameraActive && (
                <button
                  type="button"
                  onClick={handleSnap}
                  className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-300 border-4 border-zinc-900 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  title="Take Photo"
                >
                  <div className="w-5 h-5 rounded-full bg-zinc-950" />
                </button>
              )}

              {/* File upload shortcut */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-300 hover:text-zinc-100 flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Device Gallery</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
