/**
 * ⏱️ SMPTE TIMECODE ENGINE
 *
 * Профессиональная система таймкода для синхронизации
 * Поддержка: 24fps, 25fps, 30fps, 29.97fps drop-frame
 */

// SMPTE Framerate presets
export const SMPTE_FRAMERATES = {
  FILM_24: { fps: 24, dropFrame: false, name: "24fps Film" },
  PAL_25: { fps: 25, dropFrame: false, name: "25fps PAL" },
  NTSC_2997_DF: { fps: 29.97, dropFrame: true, name: "29.97fps NTSC DF" },
  NTSC_30: { fps: 30, dropFrame: false, name: "30fps NTSC" },
  WEB_60: { fps: 60, dropFrame: false, name: "60fps Web" },
};

export class SMPTETimecode {
  constructor(framerate = SMPTE_FRAMERATES.NTSC_30) {
    this.framerate = framerate;
    this.totalFrames = 0;
    this.isRunning = false;
    this.startTime = 0;
    this.pausedTime = 0;
    this.callbacks = [];
    this.rafId = null;
  }

  // Запуск таймкода
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = performance.now() - this.pausedTime;

    const tick = () => {
      if (!this.isRunning) return;

      const elapsed = performance.now() - this.startTime;
      this.totalFrames = Math.floor((elapsed / 1000) * this.framerate.fps);

      // Уведомляем подписчиков
      this.callbacks.forEach((cb) => cb(this.getTimecode()));

      this.rafId = requestAnimationFrame(tick);
    };

    tick();
  }

  // Остановка таймкода
  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // Пауза
  pause() {
    if (!this.isRunning) return;
    this.pausedTime = performance.now() - this.startTime;
    this.stop();
  }

  // Сброс
  reset() {
    this.stop();
    this.totalFrames = 0;
    this.pausedTime = 0;
  }

  // Переход к конкретному фрейму
  seek(frames) {
    this.totalFrames = frames;
    this.pausedTime = (frames / this.framerate.fps) * 1000;
    if (this.isRunning) {
      this.startTime = performance.now() - this.pausedTime;
    }
  }

  // Переход к конкретному времени (формат HH:MM:SS:FF)
  seekTo(hours, minutes, seconds, frames) {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const totalFrames = Math.floor(totalSeconds * this.framerate.fps) + frames;
    this.seek(totalFrames);
  }

  // Получить текущий таймкод в формате HH:MM:SS:FF
  getTimecode() {
    let frames = this.totalFrames;

    // Drop-frame compensation для 29.97fps
    if (this.framerate.dropFrame && this.framerate.fps === 29.97) {
      const dropFrames = 2; // Пропускаем 2 фрейма каждую минуту, кроме каждой 10-й
      const framesPerMinute = Math.floor(this.framerate.fps * 60);
      const framesPer10Minutes = framesPerMinute * 10;

      const d = Math.floor(frames / framesPer10Minutes);
      const m = frames % framesPer10Minutes;

      if (m > dropFrames) {
        frames +=
          dropFrames * 9 * d +
          dropFrames * Math.floor((m - dropFrames) / framesPerMinute);
      } else {
        frames += dropFrames * 9 * d;
      }
    }

    const fps = Math.floor(this.framerate.fps);
    const ff = frames % fps;
    const ss = Math.floor((frames / fps) % 60);
    const mm = Math.floor((frames / (fps * 60)) % 60);
    const hh = Math.floor(frames / (fps * 3600));

    return {
      hours: hh,
      minutes: mm,
      seconds: ss,
      frames: ff,
      formatted: `${pad(hh)}:${pad(mm)}:${pad(ss)}${this.framerate.dropFrame ? ";" : ":"}${pad(ff)}`,
      totalFrames: this.totalFrames,
      totalSeconds: this.totalFrames / this.framerate.fps,
    };
  }

  // Подписка на обновления таймкода
  subscribe(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  // Экспорт в разные форматы
  export(format = "json") {
    const tc = this.getTimecode();

    switch (format) {
      case "json":
        return JSON.stringify(tc, null, 2);

      case "smpte":
        return tc.formatted;

      case "milliseconds":
        return Math.floor(tc.totalSeconds * 1000);

      case "seconds":
        return tc.totalSeconds;

      default:
        return tc.formatted;
    }
  }
}

// Утилита: дополнение нулями
function pad(num, size = 2) {
  return String(num).padStart(size, "0");
}

// React Hook для SMPTE Timecode
import { useState, useEffect, useRef } from "react";

export function useSMPTETimecode(framerate = SMPTE_FRAMERATES.NTSC_30) {
  const [timecode, setTimecode] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    frames: 0,
    formatted: "00:00:00:00",
    totalFrames: 0,
    totalSeconds: 0,
  });

  const engineRef = useRef(new SMPTETimecode(framerate));

  useEffect(() => {
    const engine = engineRef.current;
    const unsubscribe = engine.subscribe(setTimecode);

    return () => {
      unsubscribe();
      engine.stop();
    };
  }, []);

  return {
    timecode,
    start: () => engineRef.current.start(),
    stop: () => engineRef.current.stop(),
    pause: () => engineRef.current.pause(),
    reset: () => engineRef.current.reset(),
    seek: (frames) => engineRef.current.seek(frames),
    seekTo: (h, m, s, f) => engineRef.current.seekTo(h, m, s, f),
    export: (format) => engineRef.current.export(format),
    engine: engineRef.current,
  };
}

// React компонент для отображения таймкода
export function SMPTEDisplay({ timecode, framerate, className = "" }) {
  return (
    <div className={`font-mono ${className}`}>
      <div className="text-4xl font-bold tracking-wider text-[#00D4FF]">
        {timecode.formatted}
      </div>
      <div className="text-sm text-gray-400 mt-1">
        {framerate.name} • Frame {timecode.totalFrames}
      </div>
    </div>
  );
}

// SMPTE Control Panel
export function SMPTEControlPanel({ engine, className = "" }) {
  const [isRunning, setIsRunning] = useState(false);
  const [timecode, setTimecode] = useState(engine.getTimecode());

  useEffect(() => {
    const unsubscribe = engine.subscribe(setTimecode);
    return unsubscribe;
  }, [engine]);

  const handlePlayPause = () => {
    if (isRunning) {
      engine.pause();
    } else {
      engine.start();
    }
    setIsRunning(!isRunning);
  };

  return (
    <div className={`glass-luxury rounded-2xl p-6 ${className}`}>
      <h3 className="text-xl font-bold gradient-text mb-4">SMPTE Timecode</h3>

      {/* Display */}
      <SMPTEDisplay timecode={timecode} framerate={engine.framerate} />

      {/* Controls */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={handlePlayPause}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
            isRunning
              ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300"
              : "bg-green-500/20 hover:bg-green-500/30 text-green-300"
          }`}
        >
          {isRunning ? "⏸ Pause" : "▶ Play"}
        </button>

        <button
          onClick={() => {
            engine.stop();
            engine.reset();
            setIsRunning(false);
          }}
          className="px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold transition-all"
        >
          ⏹ Stop
        </button>
      </div>

      {/* Quick Seek */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        <button
          onClick={() =>
            engine.seek(
              Math.max(0, timecode.totalFrames - engine.framerate.fps * 10),
            )
          }
          className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
        >
          -10s
        </button>
        <button
          onClick={() =>
            engine.seek(
              Math.max(0, timecode.totalFrames - engine.framerate.fps),
            )
          }
          className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
        >
          -1s
        </button>
        <button
          onClick={() =>
            engine.seek(timecode.totalFrames + engine.framerate.fps)
          }
          className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
        >
          +1s
        </button>
        <button
          onClick={() =>
            engine.seek(timecode.totalFrames + engine.framerate.fps * 10)
          }
          className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
        >
          +10s
        </button>
      </div>

      {/* Export */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-gray-400 text-xs mb-2">Export Timecode</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              const tc = engine.export("smpte");
              navigator.clipboard.writeText(tc);
            }}
            className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-xs transition-all"
          >
            Copy SMPTE
          </button>
          <button
            onClick={() => {
              const tc = engine.export("json");
              navigator.clipboard.writeText(tc);
            }}
            className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-xs transition-all"
          >
            Copy JSON
          </button>
        </div>
      </div>
    </div>
  );
}

export default SMPTETimecode;
