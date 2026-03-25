import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook для детекции позы пользователя с использованием TensorFlow.js
 * TensorFlow загружается динамически для оптимизации бандла (~1.7MB)
 * Отслеживает ключевые точки тела для наложения AR одежды
 */
export const usePoseDetection = (videoRef) => {
  const [detector, setDetector] = useState(null);
  const [poses, setPoses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const animationFrameRef = useRef();

  // Инициализация детектора позы (динамическая загрузка tensorflow)
  useEffect(() => {
    const initDetector = async () => {
      try {
        // Динамический import — tensorflow грузится только при открытии AR
        const [poseDetection] = await Promise.all([
          import("@tensorflow-models/pose-detection"),
          import("@tensorflow/tfjs-core"),
          import("@tensorflow/tfjs-backend-webgl"),
        ]);

        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.25,
        };

        const det = await poseDetection.createDetector(model, detectorConfig);
        setDetector(det);
        setIsLoading(false);
      } catch (error) {
        console.error("Ошибка инициализации детектора позы:", error);
        setIsLoading(false);
      }
    };

    initDetector();

    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, []);

  // Детекция позы в реальном времени
  const detectPose = useCallback(async () => {
    if (!detector || !videoRef.current || videoRef.current.readyState !== 4) {
      return;
    }

    try {
      const poses = await detector.estimatePoses(videoRef.current, {
        flipHorizontal: true,
      });
      setPoses(poses);
    } catch (error) {
      console.error("Ошибка детекции позы:", error);
    }

    animationFrameRef.current = requestAnimationFrame(detectPose);
  }, [detector, videoRef]);

  // Запуск/остановка детекции
  useEffect(() => {
    if (detector && videoRef.current) {
      detectPose();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [detector, detectPose]);

  // Получить координаты ключевых точек для одежды
  const getShoulderPoints = useCallback(() => {
    if (!poses.length || !poses[0].keypoints) return null;

    const keypoints = poses[0].keypoints;
    const leftShoulder = keypoints.find((kp) => kp.name === "left_shoulder");
    const rightShoulder = keypoints.find((kp) => kp.name === "right_shoulder");
    const leftHip = keypoints.find((kp) => kp.name === "left_hip");
    const rightHip = keypoints.find((kp) => kp.name === "right_hip");

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

    // Проверка минимального порога уверенности
    const minScore = 0.3;
    if (
      leftShoulder.score < minScore ||
      rightShoulder.score < minScore ||
      leftHip.score < minScore ||
      rightHip.score < minScore
    ) {
      return null;
    }

    return {
      leftShoulder: { x: leftShoulder.x, y: leftShoulder.y },
      rightShoulder: { x: rightShoulder.x, y: rightShoulder.y },
      leftHip: { x: leftHip.x, y: leftHip.y },
      rightHip: { x: rightHip.x, y: rightHip.y },
      center: {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2,
      },
      width: Math.abs(rightShoulder.x - leftShoulder.x),
      height: Math.abs(leftHip.y - leftShoulder.y),
    };
  }, [poses]);

  return {
    poses,
    isLoading,
    getShoulderPoints,
    isDetected: poses.length > 0,
  };
};
