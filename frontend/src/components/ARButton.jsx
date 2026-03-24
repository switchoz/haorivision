import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

/**
 * Кнопка для запуска AR примерки
 * Можно использовать на странице товара
 */
export default function ARButton({ productId, className = "" }) {
  const navigate = useNavigate();

  const handleARClick = () => {
    navigate(`/ar-tryon${productId ? `?product=${productId}` : ""}`);
  };

  return (
    <button
      onClick={handleARClick}
      className={`group relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 ${className}`}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      {/* Content */}
      <div className="relative flex items-center justify-center gap-3">
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="text-lg">Примерить в AR</span>
        <Sparkles className="w-6 h-6 animate-pulse" />
      </div>

      {/* Badge */}
      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
        NEW
      </div>
    </button>
  );
}
