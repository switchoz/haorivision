/**
 * 📖 TIMELINE PARSER
 *
 * Парсинг и валидация timeline.json
 */

import type { Timeline, Scene } from "./types";

export class TimelineParser {
  private timeline: Timeline | null = null;

  /**
   * Загрузить timeline из JSON файла
   */
  async loadFromFile(url: string): Promise<Timeline> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load timeline: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parse(data);
    } catch (error) {
      console.error("[TimelineParser] Load error:", error);
      throw error;
    }
  }

  /**
   * Парсинг timeline объекта
   */
  parse(data: any): Timeline {
    this.validate(data);

    const timeline: Timeline = {
      version: data.version || "1.0.0",
      name: data.name,
      description: data.description,
      metadata: data.metadata,
      globalSettings: data.globalSettings,
      scenes: this.parseScenes(data.scenes),
      postShow: data.postShow,
    };

    this.timeline = timeline;

    console.log("[◇] Timeline parsed:", {
      name: timeline.name,
      scenes: timeline.scenes.length,
      duration: timeline.metadata.duration,
    });

    return timeline;
  }

  /**
   * Валидация структуры timeline
   */
  private validate(data: any): void {
    if (!data.name) {
      throw new Error("Timeline must have a name");
    }

    if (
      !data.scenes ||
      !Array.isArray(data.scenes) ||
      data.scenes.length === 0
    ) {
      throw new Error("Timeline must have at least one scene");
    }

    if (!data.metadata || !data.metadata.duration) {
      throw new Error("Timeline must have metadata with duration");
    }

    // Валидация сцен
    let lastEndTime = 0;
    data.scenes.forEach((scene: any, index: number) => {
      if (!scene.id || !scene.name) {
        throw new Error(`Scene ${index} must have id and name`);
      }

      if (
        typeof scene.startTime !== "number" ||
        typeof scene.duration !== "number"
      ) {
        throw new Error(
          `Scene ${scene.id} must have valid startTime and duration`,
        );
      }

      // Проверка последовательности
      if (scene.startTime < lastEndTime) {
        console.warn(`[!] Scene ${scene.id} overlaps with previous scene`);
      }

      lastEndTime = scene.startTime + scene.duration;
    });

    // Проверка, что последняя сцена заканчивается в metadata.duration
    if (lastEndTime > data.metadata.duration) {
      console.warn(
        `[!] Scenes duration (${lastEndTime}s) exceeds timeline duration (${data.metadata.duration}s)`,
      );
    }
  }

  /**
   * Парсинг сцен
   */
  private parseScenes(scenes: any[]): Scene[] {
    return scenes.map((scene) => this.parseScene(scene));
  }

  /**
   * Парсинг одной сцены
   */
  private parseScene(data: any): Scene {
    return {
      id: data.id,
      name: data.name,
      startTime: data.startTime,
      duration: data.duration,
      description: data.description || "",

      camera: data.camera,
      lighting: data.lighting,
      shader: data.shader,
      fog: data.fog,
      projection: data.projection,
      audio: data.audio,
      dmx: data.dmx,
      textOverlays: data.textOverlays || [],
      collectionFocus: data.collectionFocus,
      particleEffects: data.particleEffects,

      transitions: data.transitions,
    };
  }

  /**
   * Получить сцену по времени
   */
  getSceneAtTime(time: number): Scene | null {
    if (!this.timeline) return null;

    return (
      this.timeline.scenes.find(
        (scene) =>
          time >= scene.startTime && time < scene.startTime + scene.duration,
      ) || null
    );
  }

  /**
   * Получить сцену по ID
   */
  getSceneById(id: string): Scene | null {
    if (!this.timeline) return null;
    return this.timeline.scenes.find((scene) => scene.id === id) || null;
  }

  /**
   * Получить все cue точки для конкретного времени
   */
  getCuesAtTime(time: number, tolerance = 0.1): any[] {
    if (!this.timeline) return [];

    const scene = this.getSceneAtTime(time);
    if (!scene) return [];

    const cues = [];

    // DMX cues
    if (scene.dmx && scene.dmx.cues) {
      scene.dmx.cues.forEach((cue) => {
        if (Math.abs(cue.time - time) <= tolerance) {
          cues.push({
            type: "dmx",
            ...cue,
          });
        }
      });
    }

    // Text overlays
    scene.textOverlays.forEach((overlay) => {
      if (Math.abs(overlay.time - time) <= tolerance) {
        cues.push({
          type: "text",
          ...overlay,
        });
      }
    });

    return cues;
  }

  /**
   * Экспорт timeline в разные форматы
   */
  export(format: "json" | "csv" | "midi" = "json"): string {
    if (!this.timeline) {
      throw new Error("No timeline loaded");
    }

    switch (format) {
      case "json":
        return JSON.stringify(this.timeline, null, 2);

      case "csv":
        return this.exportToCSV();

      case "midi":
        throw new Error("MIDI export not implemented yet");

      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  /**
   * Экспорт в CSV (для Excel/Google Sheets)
   */
  private exportToCSV(): string {
    if (!this.timeline) return "";

    let csv = "Scene,Start Time,Duration,End Time,Description\n";

    this.timeline.scenes.forEach((scene) => {
      csv += `"${scene.name}",${scene.startTime},${scene.duration},${scene.startTime + scene.duration},"${scene.description}"\n`;
    });

    return csv;
  }

  /**
   * Получить общую информацию о timeline
   */
  getInfo() {
    if (!this.timeline) return null;

    return {
      name: this.timeline.name,
      duration: this.timeline.metadata.duration,
      scenes: this.timeline.scenes.length,
      fps: this.timeline.metadata.fps,
      collections: this.timeline.metadata.collections,

      scenesSummary: this.timeline.scenes.map((scene) => ({
        id: scene.id,
        name: scene.name,
        startTime: scene.startTime,
        duration: scene.duration,
        endTime: scene.startTime + scene.duration,
      })),
    };
  }

  /**
   * Получить текущий timeline
   */
  getTimeline(): Timeline | null {
    return this.timeline;
  }
}

export default TimelineParser;
