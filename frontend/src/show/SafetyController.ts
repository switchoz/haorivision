/**
 * 🛡️ SAFETY CONTROLLER
 *
 * Система безопасности для зрителей:
 * - Ограничение частоты строба ≤ 3 Hz
 * - UV intensity presets (Gentle/Medium/Strong)
 * - Smooth blackout (fade-to-black)
 * - Safety limits enforcement
 */

export interface SafetyLimits {
  maxStrobeFrequency: number; // Hz
  maxBrightness: number; // 0-1
  maxContrast: number; // 0-1
  maxUVIntensity: number; // 0-1
  minFadeDuration: number; // ms
}

export interface UVPreset {
  id: "gentle" | "medium" | "strong";
  name: string;
  intensity: number;
  brightness: number;
  contrast: number;
  description: string;
}

export const DEFAULT_SAFETY_LIMITS: SafetyLimits = {
  maxStrobeFrequency: 3.0, // 3 Hz максимум (безопасно для эпилепсии)
  maxBrightness: 0.95, // 95% максимум
  maxContrast: 1.2, // 120% максимум
  maxUVIntensity: 2.0, // 200% для UV эффектов
  minFadeDuration: 500, // 500ms минимум для fade
};

export const UV_PRESETS: UVPreset[] = [
  {
    id: "gentle",
    name: "Gentle",
    intensity: 0.5,
    brightness: 0.6,
    contrast: 1.0,
    description: "Мягкий UV свет для чувствительных зрителей",
  },
  {
    id: "medium",
    name: "Medium",
    intensity: 1.0,
    brightness: 0.8,
    contrast: 1.1,
    description: "Средний UV свет для стандартного шоу",
  },
  {
    id: "strong",
    name: "Strong",
    intensity: 1.5,
    brightness: 0.95,
    contrast: 1.2,
    description: "Интенсивный UV свет для полного эффекта",
  },
];

export class SafetyController {
  private limits: SafetyLimits;
  private currentUVPreset: UVPreset;
  private strobeHistory: number[] = [];
  private isBlackout: boolean = false;

  constructor(limits: SafetyLimits = DEFAULT_SAFETY_LIMITS) {
    this.limits = limits;
    this.currentUVPreset = UV_PRESETS[1]; // Medium по умолчанию
  }

  /**
   * Проверка частоты строба
   */
  checkStrobeFrequency(flashCount: number, duration: number): boolean {
    const frequency = flashCount / duration; // Hz

    if (frequency > this.limits.maxStrobeFrequency) {
      console.warn(
        `[Safety] Strobe frequency ${frequency.toFixed(1)} Hz exceeds limit ${this.limits.maxStrobeFrequency} Hz`,
      );
      return false;
    }

    return true;
  }

  /**
   * Безопасный strobe с ограничением частоты
   */
  safeStrobe(
    onFlash: () => void,
    duration: number = 1000,
    flashCount?: number,
  ): void {
    // Автоматический расчёт безопасного flashCount
    const maxFlashes = Math.floor(
      this.limits.maxStrobeFrequency * (duration / 1000),
    );
    const safeFlashCount = flashCount
      ? Math.min(flashCount, maxFlashes)
      : maxFlashes;

    const interval = duration / safeFlashCount;

    let count = 0;
    const strobeInterval = setInterval(() => {
      if (count >= safeFlashCount) {
        clearInterval(strobeInterval);
        return;
      }

      onFlash();
      count++;
    }, interval);
  }

  /**
   * Применить UV preset
   */
  applyUVPreset(presetId: "gentle" | "medium" | "strong"): UVPreset {
    const preset = UV_PRESETS.find((p) => p.id === presetId);

    if (!preset) {
      console.warn(`[Safety] Unknown UV preset: ${presetId}`);
      return this.currentUVPreset;
    }

    this.currentUVPreset = preset;
    console.log(
      `[Safety] UV preset applied: ${preset.name} (${preset.intensity})`,
    );

    return preset;
  }

  /**
   * Получить текущий UV preset
   */
  getUVPreset(): UVPreset {
    return this.currentUVPreset;
  }

  /**
   * Clamp brightness в безопасных пределах
   */
  safeBrightness(brightness: number): number {
    return Math.min(brightness, this.limits.maxBrightness);
  }

  /**
   * Clamp contrast в безопасных пределах
   */
  safeContrast(contrast: number): number {
    return Math.min(contrast, this.limits.maxContrast);
  }

  /**
   * Clamp UV intensity в безопасных пределах
   */
  safeUVIntensity(intensity: number): number {
    return Math.min(intensity, this.limits.maxUVIntensity);
  }

  /**
   * Smooth blackout (fade-to-black)
   */
  async smoothBlackout(
    onUpdate: (opacity: number) => void,
    duration: number = 1000,
  ): Promise<void> {
    const safeDuration = Math.max(duration, this.limits.minFadeDuration);

    this.isBlackout = true;

    return new Promise((resolve) => {
      const startTime = Date.now();
      const fadeInterval = 16; // 60fps

      const fade = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / safeDuration, 1.0);

        // Easing: easeInOut
        const t =
          progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

        const opacity = 1 - t;

        onUpdate(opacity);

        if (progress >= 1.0) {
          this.isBlackout = true;
          resolve();
        } else {
          setTimeout(fade, fadeInterval);
        }
      };

      fade();
    });
  }

  /**
   * Restore from blackout
   */
  async restoreFromBlackout(
    onUpdate: (opacity: number) => void,
    duration: number = 1000,
  ): Promise<void> {
    const safeDuration = Math.max(duration, this.limits.minFadeDuration);

    return new Promise((resolve) => {
      const startTime = Date.now();
      const fadeInterval = 16; // 60fps

      const fade = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / safeDuration, 1.0);

        // Easing: easeInOut
        const t =
          progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

        const opacity = t;

        onUpdate(opacity);

        if (progress >= 1.0) {
          this.isBlackout = false;
          resolve();
        } else {
          setTimeout(fade, fadeInterval);
        }
      };

      fade();
    });
  }

  /**
   * Emergency blackout (мгновенный)
   */
  emergencyBlackout(onUpdate: (opacity: number) => void): void {
    this.isBlackout = true;
    onUpdate(0);
    console.warn("[Safety] Emergency blackout activated");
  }

  /**
   * Проверка статуса blackout
   */
  isInBlackout(): boolean {
    return this.isBlackout;
  }

  /**
   * Получить safety limits
   */
  getLimits(): SafetyLimits {
    return this.limits;
  }

  /**
   * Обновить safety limits
   */
  updateLimits(limits: Partial<SafetyLimits>): void {
    this.limits = { ...this.limits, ...limits };
    console.log("[Safety] Limits updated:", this.limits);
  }
}

export default SafetyController;
