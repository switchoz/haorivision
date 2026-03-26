/**
 * 🎬 SHOW RUNNER
 *
 * Секвенсор для проигрывания timeline шоу
 * Синхронизация камеры, света, звука, DMX, текста
 */

import TimelineParser from "./TimelineParser";
import type {
  Timeline,
  Scene,
  ShowEvent,
  ShowEventType,
  ShowState,
  DMXCue,
} from "./types";

const log = import.meta.env.DEV ? console.log.bind(console) : () => {};
const warn = import.meta.env.DEV ? console.warn.bind(console) : () => {};

type EventCallback = (event: ShowEvent) => void;

export class ShowRunner {
  private timeline: Timeline | null = null;
  private parser: TimelineParser;

  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private currentTime: number = 0;

  private rafId: number | null = null;
  private fps: number = 30;

  private currentScene: Scene | null = null;
  private currentSceneIndex: number = -1;

  private eventCallbacks: Map<ShowEventType, EventCallback[]> = new Map();
  private processedCues: Set<string> = new Set();

  // Audio clock sync
  private audioContext: AudioContext | null = null;
  private audioStartTime: number = 0;

  constructor(fps: number = 30) {
    this.parser = new TimelineParser();
    this.fps = fps;
  }

  /**
   * Загрузить timeline
   */
  async loadTimeline(url: string): Promise<void> {
    try {
      this.timeline = await this.parser.loadFromFile(url);
      this.fps = this.timeline.metadata.fps || 30;

      this.emit("show:load", {
        type: "show:load",
        time: 0,
        data: this.timeline,
      });

      log("[◇] Show loaded:", this.timeline.name);
    } catch (error) {
      console.error("[ShowRunner] Failed to load timeline:", error);
      throw error;
    }
  }

  /**
   * Запустить шоу
   */
  start(): void {
    if (!this.timeline) {
      console.error("[ShowRunner] No timeline loaded");
      return;
    }

    if (this.isPlaying) {
      warn("[ShowRunner] Show already playing");
      return;
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = performance.now() - this.pausedTime;
    this.processedCues.clear();

    // Инициализация Audio Context для синхронизации
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    this.audioStartTime = this.audioContext.currentTime;

    this.emit("show:start", {
      type: "show:start",
      time: 0,
    });

    log("[▶] Show started");

    this.tick();
  }

  /**
   * Пауза
   */
  pause(): void {
    if (!this.isPlaying || this.isPaused) return;

    this.isPaused = true;
    this.pausedTime = performance.now() - this.startTime;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.emit("show:pause", {
      type: "show:pause",
      time: this.currentTime,
    });

    log("[⏸] Show paused at", this.currentTime.toFixed(2), "s");
  }

  /**
   * Продолжить
   */
  resume(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.startTime = performance.now() - this.pausedTime;

    this.emit("show:resume", {
      type: "show:resume",
      time: this.currentTime,
    });

    log("[▶] Show resumed");

    this.tick();
  }

  /**
   * Остановить
   */
  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.pausedTime = 0;
    this.currentTime = 0;
    this.currentScene = null;
    this.currentSceneIndex = -1;
    this.processedCues.clear();

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.emit("show:end", {
      type: "show:end",
      time: 0,
    });

    log("[⏹] Show stopped");
  }

  /**
   * Seek к конкретному времени
   */
  seek(time: number): void {
    if (!this.timeline) return;

    time = Math.max(0, Math.min(time, this.timeline.metadata.duration));

    this.currentTime = time;
    this.pausedTime = time * 1000;

    if (this.isPlaying) {
      this.startTime = performance.now() - this.pausedTime;
    }

    // Сбрасываем обработанные cues
    this.processedCues.clear();

    // Обновляем текущую сцену
    this.updateCurrentScene();

    log("[⏩] Seek to", time.toFixed(2), "s");
  }

  /**
   * Главный цикл (requestAnimationFrame)
   */
  private tick = (): void => {
    if (!this.isPlaying || this.isPaused || !this.timeline) return;

    // Расчёт времени
    const elapsed = performance.now() - this.startTime;
    this.currentTime = elapsed / 1000;

    // Проверка конца шоу
    if (this.currentTime >= this.timeline.metadata.duration) {
      this.handleShowEnd();
      return;
    }

    // Обновление текущей сцены
    this.updateCurrentScene();

    // Обработка cues
    this.processCues();

    // Следующий кадр
    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Обновление текущей сцены
   */
  private updateCurrentScene(): void {
    if (!this.timeline) return;

    const scene = this.parser.getSceneAtTime(this.currentTime);

    if (scene && scene.id !== this.currentScene?.id) {
      // Конец предыдущей сцены
      if (this.currentScene) {
        this.emit("scene:end", {
          type: "scene:end",
          time: this.currentTime,
          sceneId: this.currentScene.id,
          data: this.currentScene,
        });
      }

      // Начало новой сцены
      this.currentScene = scene;
      this.currentSceneIndex = this.timeline.scenes.findIndex(
        (s) => s.id === scene.id,
      );

      this.emit("scene:start", {
        type: "scene:start",
        time: this.currentTime,
        sceneId: scene.id,
        data: scene,
      });

      log("[→] Scene:", scene.name);
    }
  }

  /**
   * Обработка cues (DMX, Audio, Text)
   */
  private processCues(): void {
    if (!this.currentScene) return;

    const tolerance = 1 / this.fps; // один кадр

    // DMX cues
    if (this.currentScene.dmx && this.currentScene.dmx.cues) {
      this.currentScene.dmx.cues.forEach((cue) => {
        const cueKey = `dmx_${this.currentScene!.id}_${cue.time}_${cue.action}`;

        if (
          Math.abs(this.currentTime - cue.time) <= tolerance &&
          !this.processedCues.has(cueKey)
        ) {
          this.emit("cue:dmx", {
            type: "cue:dmx",
            time: this.currentTime,
            sceneId: this.currentScene.id,
            data: cue,
          });

          this.processedCues.add(cueKey);
        }
      });
    }

    // Text overlays
    this.currentScene.textOverlays.forEach((overlay) => {
      const cueKey = `text_${this.currentScene!.id}_${overlay.time}`;

      if (
        Math.abs(this.currentTime - overlay.time) <= tolerance &&
        !this.processedCues.has(cueKey)
      ) {
        this.emit("cue:text", {
          type: "cue:text",
          time: this.currentTime,
          sceneId: this.currentScene!.id,
          data: overlay,
        });

        this.processedCues.add(cueKey);
      }
    });

    // Проверка transitions
    const sceneEndTime =
      this.currentScene.startTime + this.currentScene.duration;
    const transitionStartTime =
      sceneEndTime - this.currentScene.transitions.out.duration;

    if (
      this.currentTime >= transitionStartTime &&
      this.currentTime < sceneEndTime
    ) {
      const cueKey = `transition_${this.currentScene.id}`;

      if (!this.processedCues.has(cueKey)) {
        this.emit("transition:start", {
          type: "transition:start",
          time: this.currentTime,
          sceneId: this.currentScene.id,
          data: this.currentScene.transitions.out,
        });

        this.processedCues.add(cueKey);
      }
    }
  }

  /**
   * Конец шоу
   */
  private handleShowEnd(): void {
    log("[✓] Show ended");

    this.stop();

    // PostShow обработка
    if (this.timeline?.postShow) {
      this.emit("show:end", {
        type: "show:end",
        time: this.currentTime,
        data: this.timeline.postShow,
      });
    }
  }

  /**
   * Подписка на события
   */
  on(eventType: ShowEventType, callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }

    this.eventCallbacks.get(eventType)!.push(callback);

    // Возвращаем функцию для отписки
    return () => {
      const callbacks = this.eventCallbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit события
   */
  private emit(eventType: ShowEventType, event: ShowEvent): void {
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }
  }

  /**
   * Получить текущее состояние
   */
  getState(): ShowState {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentTime: this.currentTime,
      currentScene: this.currentScene,
      currentSceneIndex: this.currentSceneIndex,
      progress: this.timeline
        ? this.currentTime / this.timeline.metadata.duration
        : 0,
      frameCount: Math.floor(this.currentTime * this.fps),
    };
  }

  /**
   * Получить timeline
   */
  getTimeline(): Timeline | null {
    return this.timeline;
  }

  /**
   * Получить информацию о timeline
   */
  getTimelineInfo() {
    return this.parser.getInfo();
  }

  /**
   * Экспорт timeline
   */
  exportTimeline(format: "json" | "csv" | "midi" = "json"): string {
    return this.parser.export(format);
  }

  /**
   * Синхронизация с Audio Context
   */
  getAudioTime(): number {
    if (!this.audioContext) return 0;
    return this.audioContext.currentTime - this.audioStartTime;
  }

  /**
   * Dispose (очистка ресурсов)
   */
  dispose(): void {
    this.stop();
    this.eventCallbacks.clear();
    this.processedCues.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    log("[◇] ShowRunner disposed");
  }
}

export default ShowRunner;
