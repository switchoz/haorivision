import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORIES = [
  {
    id: "new",
    title: "Новинки",
    thumb: "/artist/page5_img1.jpeg",
    slides: [
      {
        image: "/artist/page5_img1.jpeg",
        caption: "Новая работа «Ихтис» — космический портал",
      },
      {
        image: "/artist/page8_img1.jpeg",
        caption: "«Алиса в стране чудес» — сюрреализм в орнаменте",
      },
    ],
  },
  {
    id: "process",
    title: "Процесс",
    thumb: "/artist/page4_img1.jpeg",
    slides: [
      {
        image: "/artist/page4_img1.jpeg",
        caption: "Потоковое состояние — линия ведёт сама",
      },
      { image: "/artist/page2_img1.jpeg", caption: "В мастерской LiZa" },
    ],
  },
  {
    id: "uv",
    title: "UV-магия",
    thumb: "/artist/haori-dark-uv.jpg",
    slides: [
      {
        image: "/artist/haori-dark-uv.jpg",
        caption: "Скрытый рисунок проявляется под UV",
      },
      {
        image: "/artist/haori-presentation.jpg",
        caption: "Днём — элегантное пальто",
      },
    ],
  },
];

const LS_KEY = "hv_stories_viewed";
const getViewed = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
};
const markViewed = (id) => {
  const v = new Set(getViewed());
  v.add(id);
  localStorage.setItem(LS_KEY, JSON.stringify([...v]));
};

/* ─── Fullscreen viewer ─── */
function StoryViewer({ story, onClose }) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timer = useRef(null);
  const DURATION = 5000;

  const advance = useCallback(() => {
    if (idx < story.slides.length - 1) {
      setIdx((i) => i + 1);
      setProgress(0);
    } else onClose();
  }, [idx, story.slides.length, onClose]);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(elapsed / DURATION, 1));
      if (elapsed < DURATION) timer.current = requestAnimationFrame(tick);
      else advance();
    };
    timer.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timer.current);
  }, [idx, advance]);

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3 && idx > 0) {
      setIdx((i) => i - 1);
      setProgress(0);
    } else advance();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onClick={handleTap}
    >
      {/* Progress bars */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
        {story.slides.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden"
          >
            <div
              className="h-full bg-white rounded transition-none"
              style={{
                width: `${i < idx ? 100 : i === idx ? progress * 100 : 0}%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Close */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-4 z-10 text-white/80 hover:text-white text-3xl leading-none"
      >
        &times;
      </button>

      {/* Title */}
      <div className="absolute top-6 left-4 z-10 text-white text-sm font-semibold">
        {story.title}
      </div>

      {/* Slide image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={story.slides[idx].image}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </AnimatePresence>

      {/* Caption */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pt-16">
        <p className="text-white text-lg font-medium">
          {story.slides[idx].caption}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Stories row ─── */
export default function Stories() {
  const [active, setActive] = useState(null);
  const [viewed, setViewed] = useState(getViewed);

  const open = (story) => {
    setActive(story);
    markViewed(story.id);
    setViewed(getViewed());
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    setActive(null);
    document.body.style.overflow = "";
  };

  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-hide py-6 px-4">
        <div className="flex gap-5 justify-center">
          {STORIES.map((s) => {
            const seen = viewed.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => open(s)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div
                  className={`rounded-full p-[3px] ${
                    seen
                      ? "bg-zinc-600"
                      : "bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400"
                  }`}
                >
                  <img
                    src={s.thumb}
                    alt={s.title}
                    className="w-16 h-16 rounded-full object-cover border-2 border-black"
                  />
                </div>
                <span className="text-[11px] text-zinc-400">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {active && <StoryViewer story={active} onClose={close} />}
      </AnimatePresence>
    </>
  );
}
