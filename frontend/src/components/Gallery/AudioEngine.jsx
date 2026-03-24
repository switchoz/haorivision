import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

/**
 * 🔊 AUDIO ENGINE
 *
 * Аудио движок на базе Tone.js для сценического звука
 * Синхронизация с таймлайном и визуальными эффектами
 */

class HaoriAudioEngine {
  constructor() {
    this.initialized = false;
    this.players = {};
    this.synths = {};
    this.effects = {};
    this.masterVolume = new Tone.Volume(0).toDestination();
    this.currentScene = null;
  }

  // Инициализация (требуется user interaction)
  async initialize() {
    if (this.initialized) return;

    await Tone.start();
    if (import.meta.env.DEV) console.log("[◇] Audio Engine initialized");

    // Создаём эффекты
    this.effects.reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.3,
    }).connect(this.masterVolume);

    this.effects.delay = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: 0.3,
      wet: 0.2,
    }).connect(this.masterVolume);

    this.effects.filter = new Tone.Filter({
      frequency: 1000,
      type: "lowpass",
    }).connect(this.masterVolume);

    this.effects.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7,
      wet: 0.3,
    }).connect(this.masterVolume);

    await this.effects.reverb.generate();

    this.initialized = true;
  }

  // Загрузка аудио трека
  async loadTrack(name, url) {
    if (this.players[name]) {
      this.players[name].dispose();
    }

    return new Promise((resolve, reject) => {
      const player = new Tone.Player({
        url,
        onload: () => {
          if (import.meta.env.DEV)
            console.log(`[✓] Audio track loaded: ${name}`);
          resolve(player);
        },
        onerror: (error) => {
          console.error(`[✗] Audio load error: ${name}`, error);
          reject(error);
        },
      }).connect(this.effects.reverb);

      this.players[name] = player;
    });
  }

  // Проигрывание трека
  playTrack(name, options = {}) {
    if (!this.initialized) {
      console.warn("[!] Audio Engine not initialized");
      return;
    }

    const player = this.players[name];
    if (!player) {
      console.warn(`[!] Track not found: ${name}`);
      return;
    }

    const { volume = 0, fadeIn = 0, loop = false, playbackRate = 1 } = options;

    player.volume.value = volume;
    player.loop = loop;
    player.playbackRate = playbackRate;

    if (fadeIn > 0) {
      player.volume.rampTo(volume, fadeIn);
    }

    player.start();
  }

  // Остановка трека
  stopTrack(name, fadeOut = 0) {
    const player = this.players[name];
    if (!player) return;

    if (fadeOut > 0) {
      player.volume.rampTo(-60, fadeOut);
      setTimeout(() => player.stop(), fadeOut * 1000);
    } else {
      player.stop();
    }
  }

  // Ambient синтезатор (для UV-свечения)
  createAmbientSynth(options = {}) {
    const {
      name = "ambient",
      baseFrequency = 200,
      harmonics = 3,
      volume = -20,
    } = options;

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 0.8,
        release: 4,
      },
      volume,
    }).connect(this.effects.reverb);

    this.synths[name] = synth;

    return synth;
  }

  // UV Breathing Sound (дышащий звук для UV-света)
  startUVBreathing(frequency = 200, breathSpeed = 2) {
    if (!this.initialized) return;

    if (!this.synths.uvBreathing) {
      this.synths.uvBreathing = this.createAmbientSynth({
        name: "uvBreathing",
        volume: -25,
      });
    }

    const synth = this.synths.uvBreathing;

    // Создаём дышащий паттерн
    const loop = new Tone.Loop((time) => {
      synth.triggerAttackRelease(frequency, breathSpeed, time);
    }, breathSpeed);

    loop.start(0);
    Tone.Transport.start();

    this.uvBreathingLoop = loop;
  }

  stopUVBreathing() {
    if (this.uvBreathingLoop) {
      this.uvBreathingLoop.stop();
      this.uvBreathingLoop.dispose();
      this.uvBreathingLoop = null;
    }

    if (this.synths.uvBreathing) {
      this.synths.uvBreathing.releaseAll();
    }
  }

  // Generative Soundscape (генеративный эмбиент)
  startGenerativeSoundscape() {
    if (!this.initialized) return;

    const notes = ["C3", "D3", "E3", "G3", "A3", "C4", "D4", "E4"];

    if (!this.synths.generative) {
      this.synths.generative = this.createAmbientSynth({
        name: "generative",
        volume: -30,
      });
    }

    const synth = this.synths.generative;

    // Случайные ноты с разными интервалами
    const loop = new Tone.Loop((time) => {
      const note = notes[Math.floor(Math.random() * notes.length)];
      const duration = Math.random() * 4 + 2; // 2-6 секунд
      synth.triggerAttackRelease(note, duration, time);
    }, "8n");

    loop.start(0);
    Tone.Transport.start();

    this.generativeLoop = loop;
  }

  stopGenerativeSoundscape() {
    if (this.generativeLoop) {
      this.generativeLoop.stop();
      this.generativeLoop.dispose();
      this.generativeLoop = null;
    }

    if (this.synths.generative) {
      this.synths.generative.releaseAll();
    }
  }

  // Применить настройки сцены
  applySceneAudio(scene) {
    if (!scene || !scene.audio) return;

    const { track, volume, fadeIn, loop } = scene.audio;

    // Останавливаем предыдущий трек
    if (this.currentScene && this.currentScene.audio?.track) {
      this.stopTrack(this.currentScene.audio.track, 1);
    }

    // Проигрываем новый трек
    if (track) {
      this.playTrack(track, { volume, fadeIn, loop });
    }

    this.currentScene = scene;
  }

  // Установка мастер громкости
  setMasterVolume(volume) {
    this.masterVolume.volume.rampTo(volume, 0.5);
  }

  // Остановка всего
  stopAll() {
    Object.keys(this.players).forEach((name) => {
      this.stopTrack(name, 0.5);
    });

    this.stopUVBreathing();
    this.stopGenerativeSoundscape();

    Tone.Transport.stop();
  }

  // Очистка ресурсов
  dispose() {
    this.stopAll();

    Object.values(this.players).forEach((player) => player.dispose());
    Object.values(this.synths).forEach((synth) => synth.dispose());
    Object.values(this.effects).forEach((effect) => effect.dispose());

    this.masterVolume.dispose();
    this.initialized = false;
  }
}

// React компонент
export default function AudioEngine({
  children,
  autoStart = false,
  enableGenerative = true,
  enableUVBreathing = false,
}) {
  const [engine] = useState(() => new HaoriAudioEngine());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Инициализация при монтировании
  useEffect(() => {
    const init = async () => {
      if (autoStart) {
        await engine.initialize();
        setIsInitialized(true);

        if (enableGenerative) {
          engine.startGenerativeSoundscape();
        }

        if (enableUVBreathing) {
          engine.startUVBreathing();
        }
      }
    };

    init();

    return () => {
      engine.dispose();
    };
  }, [engine, autoStart, enableGenerative, enableUVBreathing]);

  // Ручная инициализация (требуется для браузеров)
  const initializeAudio = async () => {
    if (!isInitialized) {
      await engine.initialize();
      setIsInitialized(true);

      if (enableGenerative) {
        engine.startGenerativeSoundscape();
      }

      if (enableUVBreathing) {
        engine.startUVBreathing();
      }
    }
  };

  // Mute/Unmute
  const toggleMute = () => {
    if (isMuted) {
      engine.setMasterVolume(0);
    } else {
      engine.setMasterVolume(-60);
    }
    setIsMuted(!isMuted);
  };

  return (
    <>
      {/* Audio Controls */}
      {isInitialized && (
        <div className="fixed bottom-8 right-8 z-10 flex gap-2">
          <button
            onClick={toggleMute}
            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 text-white flex items-center justify-center transition-all"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>
      )}

      {/* Initialize Button (показываем если не инициализирован) */}
      {!isInitialized && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={initializeAudio}
            className="px-6 py-3 bg-[#FF10F0]/20 hover:bg-[#FF10F0]/30 border border-[#FF10F0]/50 rounded-full text-white font-semibold transition-all"
          >
            🔊 Enable Audio
          </button>
        </div>
      )}

      {/* Передаём engine через render prop или context */}
      {typeof children === "function"
        ? children({
            engine,
            isInitialized,
            isMuted,
            toggleMute,
            initializeAudio,
          })
        : children}
    </>
  );
}

// Context для глобального доступа к Audio Engine
import { createContext, useContext } from "react";

const AudioEngineContext = createContext(null);

export function AudioEngineProvider({ children }) {
  const [engine] = useState(() => new HaoriAudioEngine());

  return (
    <AudioEngineContext.Provider value={engine}>
      {children}
    </AudioEngineContext.Provider>
  );
}

export function useAudioEngine() {
  const engine = useContext(AudioEngineContext);
  if (!engine) {
    throw new Error("useAudioEngine must be used within AudioEngineProvider");
  }
  return engine;
}

export { HaoriAudioEngine };
