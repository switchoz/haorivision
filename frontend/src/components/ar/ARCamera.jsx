import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RotateCcw } from "lucide-react";

/**
 * Компонент камеры для AR примерки
 * Управляет доступом к веб-камере пользователя
 */
export default function ARCamera({ onVideoReady, children }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // 'user' | 'environment'

  const startCamera = async (facing = facingMode) => {
    try {
      setError("");

      // Остановить предыдущий поток
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsReady(true);
          if (onVideoReady) {
            onVideoReady(videoRef);
          }
        };
      }
    } catch (err) {
      console.error("Ошибка доступа к камере:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Разрешите доступ к камере для использования AR примерки"
          : "Не удалось получить доступ к камере",
      );
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const switchCamera = () => {
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    setIsReady(false);
    startCamera(newFacing);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video элемент */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        playsInline
        muted
        autoPlay
      />

      {/* Overlay контент (AR элементы) */}
      {isReady && children && (
        <div className="absolute inset-0 pointer-events-none">
          {typeof children === "function" ? children(videoRef) : children}
        </div>
      )}

      {/* Кнопка переключения камеры */}
      {isReady && (
        <button
          onClick={switchCamera}
          className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors z-10 pointer-events-auto"
          title="Переключить камеру"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      )}

      {/* Сообщение об ошибке */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white p-8 text-center">
          <div>
            <CameraOff className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-lg mb-4">{error}</p>
            <button
              onClick={() => startCamera()}
              className="px-6 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Индикатор загрузки */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white">
          <div className="text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <p className="text-lg">Загрузка камеры...</p>
          </div>
        </div>
      )}
    </div>
  );
}
