import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ARCamera from "../components/ar/ARCamera";
import HaoriOverlay from "../components/ar/HaoriOverlay";
import { usePoseDetection } from "../components/ar/usePoseDetection";
import {
  X,
  Camera,
  Sparkles,
  ShoppingBag,
  Share2,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import html2canvas from "html2canvas";

/**
 * Страница AR примерки хаори
 * Использует камеру и детекцию позы для виртуальной примерки
 */
export default function ARTryOn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // Получить ID товара из URL
  const productId = searchParams.get("product");
  const [selectedHaori, setSelectedHaori] = useState(null);
  const [opacity, setOpacity] = useState(0.85);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [haoriOptions, setHaoriOptions] = useState([]);

  // Детекция позы
  const {
    poses,
    isLoading: isPoseLoading,
    getShoulderPoints,
    isDetected,
  } = usePoseDetection(videoRef);
  const shoulderPoints = getShoulderPoints();

  // Загрузить реальные товары из каталога
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3010";
    fetch(`${apiUrl}/api/products?category=haori&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        const products = (data.products || []).map((product) => ({
          id: product.id,
          name: product.name,
          image: product.images?.daylight?.hero,
          uvImage: product.images?.uv?.hero,
          price: `$${product.price?.toLocaleString()}`,
          pattern: product.tagline,
          collection: product.productCollection,
        }));

        setHaoriOptions(products);

        if (productId) {
          const selectedProduct = products.find((p) => p.id === productId);
          if (selectedProduct) setSelectedHaori(selectedProduct);
        }
      })
      .catch(() => {});
  }, [productId]);

  // Обработчик готовности видео
  const handleVideoReady = useCallback((ref) => {
    videoRef.current = ref.current;
  }, []);

  // Сделать скриншот
  const capturePhoto = async () => {
    if (!containerRef.current) return;

    setIsCapturing(true);
    try {
      const canvas = await html2canvas(containerRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      const image = canvas.toDataURL("image/png");
      setCapturedImage(image);
    } catch (error) {
      console.error("Ошибка создания фото:", error);
      alert("Не удалось сделать фото. Попробуйте ещё раз.");
    } finally {
      setIsCapturing(false);
    }
  };

  // Скачать фото
  const downloadPhoto = () => {
    if (!capturedImage) return;

    const link = document.createElement("a");
    link.download = `haori-vision-tryon-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
  };

  // Поделиться
  const sharePhoto = async () => {
    if (!capturedImage) return;

    try {
      const blob = await (await fetch(capturedImage)).blob();
      const file = new File([blob], "haori-tryon.png", { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          title: "Моя примерка HaoriVision",
          text: `Попробуйте ${selectedHaori?.name}!`,
          files: [file],
        });
      } else {
        // Fallback: скопировать ссылку
        alert('Функция "Поделиться" не поддерживается в этом браузере');
      }
    } catch (error) {
      console.error("Ошибка при попытке поделиться:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Модальное окно с результатом */}
      {capturedImage && (
        <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full rounded-2xl shadow-2xl mb-6"
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={downloadPhoto}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Скачать
              </button>
              <button
                onClick={sharePhoto}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Поделиться
              </button>
              <button
                onClick={() => setCapturedImage(null)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Главный контейнер AR */}
      <div ref={containerRef} className="relative w-full h-full">
        {/* Камера с AR overlay */}
        <ARCamera onVideoReady={handleVideoReady}>
          {selectedHaori && shoulderPoints && (
            <HaoriOverlay
              videoRef={videoRef}
              shoulderPoints={shoulderPoints}
              haoriImage={selectedHaori.image}
              opacity={opacity}
            />
          )}
        </ARCamera>

        {/* Верхняя панель */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-white text-center">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5" />
                <h1 className="text-xl font-bold">AR Примерка</h1>
              </div>
              {selectedHaori && (
                <div>
                  <p className="text-sm opacity-80">{selectedHaori.name}</p>
                  <p className="text-xs text-purple-400">
                    {selectedHaori.collection} • {selectedHaori.price}
                  </p>
                </div>
              )}
            </div>
            <div className="w-12" /> {/* Spacer */}
          </div>
        </div>

        {/* Статус детекции */}
        {!isDetected && !isPoseLoading && selectedHaori && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-black px-6 py-3 rounded-full flex items-center gap-2 z-10">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Встаньте перед камерой</span>
          </div>
        )}

        {/* Индикатор загрузки детекции */}
        {isPoseLoading && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-6 py-3 rounded-full flex items-center gap-2 z-10">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Загрузка AI детекции...</span>
          </div>
        )}

        {/* Выбор хаори - нижняя панель */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent z-10">
          {/* Slider прозрачности */}
          {selectedHaori && (
            <div className="mb-4 px-4">
              <label className="block text-white text-sm mb-2">
                Прозрачность
              </label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Галерея хаори */}
          <div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {haoriOptions.map((haori) => (
              <button
                key={haori.id}
                onClick={() => setSelectedHaori(haori)}
                className={`flex-shrink-0 relative rounded-xl overflow-hidden border-2 transition-all ${
                  selectedHaori?.id === haori.id
                    ? "border-blue-500 scale-105 shadow-lg shadow-blue-500/50"
                    : "border-white/30 hover:border-white/60"
                }`}
              >
                <div className="w-24 h-32">
                  <img
                    src={haori.image}
                    alt={haori.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Product info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">
                    {haori.pattern}
                  </p>
                  <p className="text-purple-400 text-xs">{haori.price}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Действия */}
          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              disabled={!selectedHaori || !isDetected || isCapturing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Захват...
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6" />
                  Сделать фото
                </>
              )}
            </button>

            {selectedHaori && (
              <button
                onClick={() =>
                  navigate(`/product/${productId || selectedHaori.id}`)
                }
                className="flex items-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <ShoppingBag className="w-6 h-6" />
                Купить
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
