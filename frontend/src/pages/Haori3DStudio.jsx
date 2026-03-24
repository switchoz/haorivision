/**
 * Haori3DStudio — Загрузка фото хаори и 3D-визуализация
 */

import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

const HaoriViewer = lazy(() => import("../components/HaoriModelViewer.jsx"));

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3010";

const SLOTS = [
  { key: "front", label: "Перёд", desc: "Фото хаори спереди", required: true },
  { key: "back", label: "Спина", desc: "Фото хаори сзади", required: false },
  {
    key: "front_uv",
    label: "Перёд UV",
    desc: "Под ультрафиолетом (спереди)",
    required: false,
  },
  {
    key: "back_uv",
    label: "Спина UV",
    desc: "Под ультрафиолетом (сзади)",
    required: false,
  },
];

const Loader3D = () => (
  <div className="aspect-[3/4] bg-zinc-900 rounded-2xl flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
      <p className="text-zinc-500 text-sm">Загрузка 3D...</p>
    </div>
  </div>
);

export default function Haori3DStudio() {
  const { isUVMode } = useTheme();
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [error, setError] = useState("");

  // Load saved items on mount
  useEffect(() => {
    fetch(`${API_URL}/api/haori-3d`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setSavedItems(data.items);
      })
      .catch(() => {});
  }, []);

  const handleFile = useCallback((key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
    const reader = new FileReader();
    reader.onload = (ev) =>
      setPreviews((prev) => ({ ...prev, [key]: ev.target.result }));
    reader.readAsDataURL(file);
    setError("");
  }, []);

  const handleDrop = useCallback((key, e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/\.(jpg|jpeg|png|webp)$/i.test(file.name)) {
      setError("Только JPG, PNG, WEBP");
      return;
    }
    setFiles((prev) => ({ ...prev, [key]: file }));
    const reader = new FileReader();
    reader.onload = (ev) =>
      setPreviews((prev) => ({ ...prev, [key]: ev.target.result }));
    reader.readAsDataURL(file);
    setError("");
  }, []);

  const handleUpload = async () => {
    if (!files.front) {
      setError("Загрузите хотя бы фото перёда");
      return;
    }

    const itemId = title.trim()
      ? title
          .trim()
          .toLowerCase()
          .replace(/[^a-zа-яё0-9]+/gi, "-")
          .replace(/-+$/, "")
      : `haori-${Date.now()}`;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      for (const [key, file] of Object.entries(files)) {
        formData.append(key, file);
      }

      const res = await fetch(`${API_URL}/api/haori-3d/${itemId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки");
      }

      const data = await res.json();
      const newItem = {
        itemId: data.itemId,
        textures: data.textures,
        title: title || itemId,
      };
      setSavedItems((prev) => [
        newItem,
        ...prev.filter((i) => i.itemId !== data.itemId),
      ]);
      setActiveItem(newItem);
      setFiles({});
      setPreviews({});
      setTitle("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getViewerProps = (item) => {
    if (!item) return {};
    return {
      frontUrl: item.textures.front || null,
      backUrl: item.textures.back || null,
      frontUvUrl: item.textures.front_uv || null,
      backUvUrl: item.textures.back_uv || null,
      title: item.title || item.itemId,
    };
  };

  // Determine what to show in the 3D viewer
  const viewerContent = activeItem ? (
    <Suspense fallback={<Loader3D />}>
      <HaoriViewer {...getViewerProps(activeItem)} />
    </Suspense>
  ) : previews.front ? (
    <Suspense fallback={<Loader3D />}>
      <HaoriViewer
        frontUrl={previews.front}
        backUrl={previews.back || previews.front}
        frontUvUrl={previews.front_uv}
        backUvUrl={previews.back_uv}
        title={title || "Превью"}
      />
    </Suspense>
  ) : null;

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className={`text-4xl md:text-6xl font-display font-bold mb-4 ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            3D Студия
          </h1>
          <p className="text-lg text-zinc-400">
            Загрузите фотографии хаори и посмотрите в 3D со всех сторон
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Upload */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="mb-6">
              <label className="block text-zinc-400 text-sm mb-2">
                Название хаори
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: DARK, Phoenix, Mycelium..."
                className={`w-full px-4 py-3 rounded-xl bg-zinc-900 border text-white outline-none transition-colors ${
                  isUVMode
                    ? "border-purple-500/30 focus:border-purple-500"
                    : "border-zinc-700 focus:border-zinc-500"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {SLOTS.map((slot) => (
                <div
                  key={slot.key}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(slot.key, e)}
                  className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                    previews[slot.key]
                      ? "border-green-500/50"
                      : isUVMode
                        ? "border-purple-500/30 hover:border-purple-500/60"
                        : "border-zinc-700 hover:border-zinc-500"
                  } ${slot.key.includes("uv") ? "bg-purple-900/10" : "bg-zinc-900/50"}`}
                >
                  {previews[slot.key] ? (
                    <div className="aspect-[3/4] relative group">
                      <img
                        src={previews[slot.key]}
                        alt={slot.label}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm">Заменить</span>
                      </div>
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {slot.label}
                      </div>
                    </div>
                  ) : (
                    <label className="aspect-[3/4] flex flex-col items-center justify-center cursor-pointer p-4">
                      <div
                        className={`text-3xl mb-2 ${slot.key.includes("uv") ? "text-purple-400" : "text-zinc-500"}`}
                      >
                        {slot.key.includes("uv") ? "🔮" : "📷"}
                      </div>
                      <span className="text-white text-sm font-medium">
                        {slot.label}
                      </span>
                      <span className="text-zinc-500 text-xs mt-1 text-center">
                        {slot.desc}
                      </span>
                      {slot.required && (
                        <span className="text-red-400 text-xs mt-1">
                          * обязательно
                        </span>
                      )}
                    </label>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFile(slot.key, e)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={!files.front || uploading}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                !files.front || uploading
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : isUVMode
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30"
                    : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {uploading ? "Загрузка..." : "Создать 3D модель"}
            </motion.button>

            {savedItems.length > 0 && (
              <div className="mt-8">
                <h3 className="text-zinc-400 text-sm uppercase tracking-wider mb-4">
                  Загруженные хаори
                </h3>
                <div className="space-y-2">
                  {savedItems.map((item) => (
                    <button
                      key={item.itemId}
                      onClick={() => setActiveItem(item)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        activeItem?.itemId === item.itemId
                          ? isUVMode
                            ? "bg-purple-600/20 border border-purple-500/40"
                            : "bg-zinc-800 border border-zinc-600"
                          : "bg-zinc-900/50 border border-transparent hover:bg-zinc-800"
                      }`}
                    >
                      {item.textures.front && (
                        <img
                          src={item.textures.front}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {item.title || item.itemId}
                        </p>
                        <p className="text-zinc-500 text-xs">
                          {Object.keys(item.textures).length} фото
                          {item.textures.front_uv ? " + UV" : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* RIGHT: 3D Viewer */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-20"
          >
            {viewerContent || (
              <div
                className={`aspect-[3/4] rounded-2xl flex items-center justify-center border-2 border-dashed ${
                  isUVMode
                    ? "border-purple-500/20 bg-purple-900/5"
                    : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">👘</div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    3D Превью
                  </h3>
                  <p className="text-zinc-500 text-sm max-w-xs">
                    Загрузите фото перёда хаори — 3D модель появится здесь.
                    Добавьте UV-фото для переключения режимов.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
