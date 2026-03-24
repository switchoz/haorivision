import { useEffect, useRef } from "react";

/**
 * Компонент для наложения изображения хаори на тело пользователя
 * Использует canvas для отрисовки с учётом позы
 */
export default function HaoriOverlay({
  videoRef,
  shoulderPoints,
  haoriImage,
  opacity = 0.85,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (
      !canvasRef.current ||
      !videoRef.current ||
      !shoulderPoints ||
      !haoriImage
    ) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const video = videoRef.current;

    // Установить размеры canvas по размерам видео
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Очистить canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Создать изображение хаори
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = haoriImage;

    img.onload = () => {
      ctx.save();

      // Установить прозрачность
      ctx.globalAlpha = opacity;

      // Рассчитать позицию и размер хаори на основе плеч
      const { leftShoulder, rightShoulder, leftHip, rightHip, width, height } =
        shoulderPoints;

      // Масштабирование хаори относительно ширины плеч
      const haoriWidth = width * 2.5; // Хаори шире плеч
      const haoriHeight = height * 1.8; // Длина хаори

      // Центр для размещения (чуть выше плеч)
      const centerX = (leftShoulder.x + rightShoulder.x) / 2;
      const centerY = leftShoulder.y - haoriHeight * 0.1;

      // Отрисовка с центрированием и flip (зеркало)
      ctx.translate(centerX, centerY);
      ctx.scale(-1, 1); // Зеркальное отражение
      ctx.drawImage(img, -haoriWidth / 2, 0, haoriWidth, haoriHeight);

      ctx.restore();

      // Опционально: отрисовать точки для отладки
      if (process.env.NODE_ENV === "development") {
        drawDebugPoints(ctx, shoulderPoints);
      }
    };
  }, [videoRef, shoulderPoints, haoriImage, opacity]);

  // Отладочная визуализация точек
  const drawDebugPoints = (ctx, points) => {
    ctx.fillStyle = "red";
    const radius = 5;

    [
      points.leftShoulder,
      points.rightShoulder,
      points.leftHip,
      points.rightHip,
    ].forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points.leftShoulder.x, points.leftShoulder.y);
    ctx.lineTo(points.rightShoulder.x, points.rightShoulder.y);
    ctx.lineTo(points.rightHip.x, points.rightHip.y);
    ctx.lineTo(points.leftHip.x, points.leftHip.y);
    ctx.closePath();
    ctx.stroke();
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
      style={{ pointerEvents: "none" }}
    />
  );
}
