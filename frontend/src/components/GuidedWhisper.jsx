/**
 * 🎧 GUIDED WHISPER
 *
 * Наушниковый аудиогид для шоу
 * - Мягкий голос, 60-90 сек на сцену
 * - Переключатель RU/EN
 * - Автосинхронизация со сценами
 */

import React, { useState, useEffect, useRef } from "react";
import "./GuidedWhisper.css";

// Audio guide metadata
const AUDIO_GUIDES = {
  en: {
    intro_dark: {
      url: "/audio/whisper/en/intro_dark.mp3",
      duration: 75,
      title: "Intro: Darkness Before Light",
      text: "Welcome to Eclipse of Light. In this moment, we stand in darkness... waiting for the light to awaken.",
    },
    light_awaken: {
      url: "/audio/whisper/en/light_awaken.mp3",
      duration: 90,
      title: "Light Awaken: Mycelium Dreams",
      text: "Observe the network of light emerging... like mycelium connecting beneath the surface, weaving dreams of bioluminescence.",
    },
    eclipse_phase: {
      url: "/audio/whisper/en/eclipse_phase.mp3",
      duration: 85,
      title: "Eclipse Phase: Void Bloom",
      text: "In the void, flowers bloom... cosmic petals unfolding in ultraviolet radiance. This is the eclipse, where darkness meets light.",
    },
    bloom_ascend: {
      url: "/audio/whisper/en/bloom_ascend.mp3",
      duration: 80,
      title: "Bloom Ascend: Neon Ancestors",
      text: "Ancient calligraphy illuminates... ancestors speak through neon light, their wisdom ascending through generations.",
    },
    finale: {
      url: "/audio/whisper/en/finale.mp3",
      duration: 90,
      title: "Finale: Unity of Light",
      text: "All becomes one... mycelium, void bloom, neon ancestors merge. You are the light. You are the art. Wear it. Become it.",
    },
  },
  ru: {
    intro_dark: {
      url: "/audio/whisper/ru/intro_dark.mp3",
      duration: 75,
      title: "Интро: Тьма перед светом",
      text: "Добро пожаловать в Eclipse of Light. В этот момент мы стоим во тьме... ожидая пробуждения света.",
    },
    light_awaken: {
      url: "/audio/whisper/ru/light_awaken.mp3",
      duration: 90,
      title: "Пробуждение: Мицелий снов",
      text: "Наблюдайте за появляющейся сетью света... как мицелий, соединяющий всё под поверхностью, сплетающий биолюминесцентные сны.",
    },
    eclipse_phase: {
      url: "/audio/whisper/ru/eclipse_phase.mp3",
      duration: 85,
      title: "Фаза затмения: Цветение пустоты",
      text: "В пустоте расцветают цветы... космические лепестки раскрываются в ультрафиолетовом сиянии. Это затмение, где тьма встречает свет.",
    },
    bloom_ascend: {
      url: "/audio/whisper/ru/bloom_ascend.mp3",
      duration: 80,
      title: "Восхождение: Неоновые предки",
      text: "Древняя каллиграфия озаряется... предки говорят через неоновый свет, их мудрость восходит сквозь поколения.",
    },
    finale: {
      url: "/audio/whisper/ru/finale.mp3",
      duration: 90,
      title: "Финал: Единство света",
      text: "Всё становится одним... мицелий, цветение пустоты, неоновые предки сливаются. Вы — свет. Вы — искусство. Носите его. Станьте им.",
    },
  },
};

export default function GuidedWhisper({
  currentScene,
  isPlaying,
  language: initialLanguage = "en",
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentGuide, setCurrentGuide] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const audioRef = useRef(null);
  const previousSceneRef = useRef(null);

  useEffect(() => {
    // Инициализация audio element
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    audioRef.current.addEventListener("ended", () => {
      setIsAudioPlaying(false);
    });

    audioRef.current.addEventListener("play", () => {
      setIsAudioPlaying(true);
    });

    audioRef.current.addEventListener("pause", () => {
      setIsAudioPlaying(false);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Синхронизация с текущей сценой
  useEffect(() => {
    if (!isEnabled || !currentScene) return;

    const sceneId = currentScene.id;

    // Если сцена изменилась
    if (sceneId !== previousSceneRef.current) {
      previousSceneRef.current = sceneId;

      const guide = AUDIO_GUIDES[language][sceneId];

      if (guide) {
        setCurrentGuide(guide);

        // Автоматически воспроизвести если шоу играет
        if (isPlaying) {
          playGuide(guide);
        }
      }
    }
  }, [currentScene, isEnabled, isPlaying, language]);

  // Пауза при остановке шоу
  useEffect(() => {
    if (!isPlaying && audioRef.current && isAudioPlaying) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Обновить громкость
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playGuide = (guide) => {
    if (!audioRef.current) return;

    audioRef.current.src = guide.url;
    audioRef.current.load();

    audioRef.current.play().catch((error) => {
      console.error("[Guided Whisper] Play failed:", error);
    });
  };

  const toggleEnabled = () => {
    setIsEnabled(!isEnabled);

    if (isEnabled && audioRef.current) {
      audioRef.current.pause();
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ru" : "en";
    setLanguage(newLanguage);

    // Обновить текущий гайд
    if (currentScene && isEnabled) {
      const guide = AUDIO_GUIDES[newLanguage][currentScene.id];
      if (guide) {
        setCurrentGuide(guide);
        if (isPlaying) {
          playGuide(guide);
        }
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentGuide) return;

    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      if (!audioRef.current.src) {
        playGuide(currentGuide);
      } else {
        audioRef.current.play().catch((error) => {
          console.error("[Guided Whisper] Play failed:", error);
        });
      }
    }
  };

  return (
    <div className={`guided-whisper ${isEnabled ? "enabled" : ""}`}>
      {/* Toggle Button */}
      <button
        className="whisper-toggle"
        onClick={toggleEnabled}
        title="Toggle Guided Whisper"
      >
        <span className="whisper-icon">🎧</span>
        {isEnabled && <span className="whisper-active-dot"></span>}
      </button>

      {/* Control Panel */}
      {isEnabled && (
        <div className="whisper-panel">
          <div className="whisper-header">
            <h3 className="whisper-title">Guided Whisper</h3>
            <button
              className="whisper-close"
              onClick={toggleEnabled}
              title="Close"
            >
              ×
            </button>
          </div>

          {currentGuide ? (
            <>
              <div className="whisper-info">
                <p className="whisper-scene-title">{currentGuide.title}</p>
                <p className="whisper-scene-text">{currentGuide.text}</p>
              </div>

              <div className="whisper-controls">
                {/* Play/Pause */}
                <button
                  className="whisper-play-btn"
                  onClick={togglePlayPause}
                  title={isAudioPlaying ? "Pause" : "Play"}
                >
                  {isAudioPlaying ? "⏸" : "▶"}
                </button>

                {/* Volume */}
                <div className="whisper-volume">
                  <span className="volume-icon">🔊</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="volume-slider"
                  />
                </div>

                {/* Language Toggle */}
                <button
                  className="whisper-lang-btn"
                  onClick={toggleLanguage}
                  title="Switch language"
                >
                  {language.toUpperCase()}
                </button>
              </div>
            </>
          ) : (
            <div className="whisper-placeholder">
              <p>No audio guide available for this scene</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
