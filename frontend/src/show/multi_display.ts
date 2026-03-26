/**
 * 🖥️ MULTI-DISPLAY SYSTEM
 *
 * Система управления N-дисплеями/проекторами
 * - Span canvas across displays
 * - WebSocket sync для сетевых клиентов
 * - Геометрическая коррекция (spline warp)
 * - Venue profiles с калибровкой
 */

import * as THREE from "three";

const log = import.meta.env.DEV ? console.log.bind(console) : () => {};
const warn = import.meta.env.DEV ? console.warn.bind(console) : () => {};

// === TYPES ===

export interface DisplayConfig {
  id: string;
  name: string;
  position: "left" | "center" | "right" | "top" | "bottom" | "custom";
  offset: { x: number; y: number }; // px offset from origin
  size: { width: number; height: number }; // px
  resolution: { width: number; height: number };
  rotation: number; // degrees
  enabled: boolean;
}

export interface VenueProfile {
  id: string;
  name: string;
  location: string;
  createdAt: string;

  displays: DisplayConfig[];

  projection: {
    totalWidth: number;
    totalHeight: number;
    throwDistance: number; // meters
    aspectRatio: string;
  };

  calibration: {
    brightness: number; // 0-1
    contrast: number; // 0-1
    gamma: number; // 0.5-3.0
    whitePoint: { r: number; g: number; b: number };
    blackLevel: { r: number; g: number; b: number };
  };

  geometry: {
    warpEnabled: boolean;
    warpGrid: WarpGrid;
    keystoneCorrection: {
      enabled: boolean;
      corners: {
        topLeft: { x: number; y: number };
        topRight: { x: number; y: number };
        bottomLeft: { x: number; y: number };
        bottomRight: { x: number; y: number };
      };
    };
  };

  sync: {
    mode: "local" | "network";
    websocketUrl?: string;
    frameDelay: number; // ms
  };
}

export interface WarpGrid {
  rows: number;
  cols: number;
  points: WarpPoint[][];
}

export interface WarpPoint {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  offsetX: number; // px offset
  offsetY: number; // px offset
}

// === MULTI DISPLAY MANAGER ===

export class MultiDisplayManager {
  private displays: Map<string, DisplayConfig> = new Map();
  private venueProfile: VenueProfile | null = null;
  private wsConnection: WebSocket | null = null;
  private syncCallbacks: Set<(data: any) => void> = new Set();

  private canvas: HTMLCanvasElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;

  private calibrationMode: boolean = false;

  constructor() {
    this.setupDisplayDetection();
  }

  /**
   * Определение доступных дисплеев
   */
  private setupDisplayDetection(): void {
    if ("getScreenDetails" in window) {
      // Multi-Screen Window Placement API (Chrome 100+)
      (window as any).getScreenDetails().then((screenDetails: any) => {
        screenDetails.screens.forEach((screen: any, index: number) => {
          const display: DisplayConfig = {
            id: `display_${index}`,
            name: screen.label || `Display ${index + 1}`,
            position: index === 0 ? "center" : "custom",
            offset: { x: screen.left, y: screen.top },
            size: { width: screen.width, height: screen.height },
            resolution: { width: screen.width, height: screen.height },
            rotation: 0,
            enabled: true,
          };

          this.displays.set(display.id, display);
        });

        log("[Multi-Display] Detected displays:", this.displays.size);
      });
    } else {
      // Fallback: single display
      const display: DisplayConfig = {
        id: "display_0",
        name: "Primary Display",
        position: "center",
        offset: { x: 0, y: 0 },
        size: { width: window.screen.width, height: window.screen.height },
        resolution: {
          width: window.screen.width,
          height: window.screen.height,
        },
        rotation: 0,
        enabled: true,
      };

      this.displays.set(display.id, display);
    }
  }

  /**
   * Загрузить venue profile
   */
  async loadVenueProfile(venueId: string): Promise<VenueProfile> {
    try {
      // Try API first, fallback to static file
      let response = await fetch(`/api/venues/${venueId}`);

      if (!response.ok) {
        response = await fetch(`/data/show/venues/${venueId}.json`);
      }

      if (!response.ok) {
        throw new Error(`Failed to load venue profile: ${response.statusText}`);
      }

      const profile: VenueProfile = await response.json();
      this.venueProfile = profile;

      // Применить конфигурацию дисплеев
      profile.displays.forEach((display) => {
        this.displays.set(display.id, display);
      });

      // Подключиться к WebSocket если network mode
      if (profile.sync.mode === "network" && profile.sync.websocketUrl) {
        await this.connectWebSocket(profile.sync.websocketUrl);
      }

      log("[◇] Venue profile loaded:", profile.name);
      return profile;
    } catch (error) {
      console.error("[Multi-Display] Failed to load venue profile:", error);
      throw error;
    }
  }

  /**
   * Сохранить venue profile
   */
  async saveVenueProfile(profile: VenueProfile): Promise<void> {
    try {
      const response = await fetch("/api/venues/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error("Failed to save venue profile");
      }

      this.venueProfile = profile;
      log("[✓] Venue profile saved:", profile.name);
    } catch (error) {
      console.error("[Multi-Display] Failed to save venue profile:", error);
      throw error;
    }
  }

  /**
   * Создать span canvas через несколько дисплеев
   */
  createSpanCanvas(container: HTMLElement): HTMLCanvasElement {
    const enabledDisplays = Array.from(this.displays.values()).filter(
      (d) => d.enabled,
    );

    if (enabledDisplays.length === 0) {
      throw new Error("No enabled displays");
    }

    // Вычислить общий размер
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    enabledDisplays.forEach((display) => {
      minX = Math.min(minX, display.offset.x);
      minY = Math.min(minY, display.offset.y);
      maxX = Math.max(maxX, display.offset.x + display.size.width);
      maxY = Math.max(maxY, display.offset.y + display.size.height);
    });

    const totalWidth = maxX - minX;
    const totalHeight = maxY - minY;

    // Создать canvas
    const canvas = document.createElement("canvas");
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    canvas.style.position = "absolute";
    canvas.style.left = `${minX}px`;
    canvas.style.top = `${minY}px`;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    container.appendChild(canvas);
    this.canvas = canvas;

    log("[Multi-Display] Span canvas created:", {
      totalWidth,
      totalHeight,
    });

    return canvas;
  }

  /**
   * WebSocket синхронизация
   */
  async connectWebSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wsConnection = new WebSocket(url);

      this.wsConnection.onopen = () => {
        log("[WebSocket] Connected to sync server:", url);
        resolve();
      };

      this.wsConnection.onerror = (error) => {
        console.error("[WebSocket] Connection error:", error);
        reject(error);
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleSyncMessage(data);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      this.wsConnection.onclose = () => {
        log("[WebSocket] Disconnected");

        // Попытка переподключения через 5 секунд
        setTimeout(() => {
          if (this.venueProfile?.sync.websocketUrl) {
            this.connectWebSocket(this.venueProfile.sync.websocketUrl);
          }
        }, 5000);
      };
    });
  }

  /**
   * Отправить sync сообщение
   */
  sendSync(type: string, data: any): void {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.wsConnection.send(JSON.stringify(message));
  }

  /**
   * Обработка sync сообщений
   */
  private handleSyncMessage(message: any): void {
    const { type, data } = message;

    switch (type) {
      case "frame":
        // Синхронизация кадра
        this.syncCallbacks.forEach((cb) => cb({ type: "frame", ...data }));
        break;

      case "scene":
        // Смена сцены
        this.syncCallbacks.forEach((cb) => cb({ type: "scene", ...data }));
        break;

      case "timecode":
        // Синхронизация таймкода
        this.syncCallbacks.forEach((cb) => cb({ type: "timecode", ...data }));
        break;

      case "calibration":
        // Калибровочные данные
        this.syncCallbacks.forEach((cb) =>
          cb({ type: "calibration", ...data }),
        );
        break;

      default:
        warn("[WebSocket] Unknown message type:", type);
    }
  }

  /**
   * Подписка на sync события
   */
  onSync(callback: (data: any) => void): () => void {
    this.syncCallbacks.add(callback);

    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  /**
   * Применить геометрическую коррекцию (warp)
   */
  applyWarpCorrection(renderer: THREE.WebGLRenderer, warpGrid: WarpGrid): void {
    if (!this.venueProfile?.geometry.warpEnabled) return;

    // Создать warp shader
    const warpShader = this.createWarpShader(warpGrid);

    // Применить post-processing pass
    // TODO: Интеграция с EffectComposer

    log("[Warp] Applied correction:", warpGrid);
  }

  /**
   * Создать warp shader
   */
  private createWarpShader(warpGrid: WarpGrid): THREE.ShaderMaterial {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D tDiffuse;
      uniform vec2 uGridSize;
      uniform vec3 uWarpPoints[${warpGrid.rows * warpGrid.cols}];

      varying vec2 vUv;

      vec2 applyWarp(vec2 uv) {
        // Billinear interpolation через warp grid
        float gridX = uv.x * float(${warpGrid.cols - 1});
        float gridY = uv.y * float(${warpGrid.rows - 1});

        int x0 = int(floor(gridX));
        int y0 = int(floor(gridY));
        int x1 = min(x0 + 1, ${warpGrid.cols - 1});
        int y1 = min(y0 + 1, ${warpGrid.rows - 1});

        float tx = fract(gridX);
        float ty = fract(gridY);

        // Получить 4 угловых точки
        int idx00 = y0 * ${warpGrid.cols} + x0;
        int idx10 = y0 * ${warpGrid.cols} + x1;
        int idx01 = y1 * ${warpGrid.cols} + x0;
        int idx11 = y1 * ${warpGrid.cols} + x1;

        vec2 p00 = uWarpPoints[idx00].xy;
        vec2 p10 = uWarpPoints[idx10].xy;
        vec2 p01 = uWarpPoints[idx01].xy;
        vec2 p11 = uWarpPoints[idx11].xy;

        // Bilinear interpolation
        vec2 p0 = mix(p00, p10, tx);
        vec2 p1 = mix(p01, p11, tx);
        vec2 warpedUv = mix(p0, p1, ty);

        return warpedUv;
      }

      void main() {
        vec2 warpedUv = applyWarp(vUv);
        gl_FragColor = texture2D(tDiffuse, warpedUv);
      }
    `;

    // Преобразовать warp points в uniform array
    const warpPoints = [];
    for (let y = 0; y < warpGrid.rows; y++) {
      for (let x = 0; x < warpGrid.cols; x++) {
        const point = warpGrid.points[y][x];
        warpPoints.push(
          new THREE.Vector3(
            point.x + point.offsetX / 1000,
            point.y + point.offsetY / 1000,
            0,
          ),
        );
      }
    }

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tDiffuse: { value: null },
        uGridSize: { value: new THREE.Vector2(warpGrid.cols, warpGrid.rows) },
        uWarpPoints: { value: warpPoints },
      },
    });
  }

  /**
   * Применить цветовую калибровку
   */
  applyColorCalibration(renderer: THREE.WebGLRenderer): void {
    if (!this.venueProfile) return;

    const cal = this.venueProfile.calibration;

    // Gamma correction
    renderer.gammaFactor = cal.gamma;

    // Tone mapping для brightness/contrast
    renderer.toneMappingExposure = cal.brightness;

    log("[Calibration] Applied color calibration:", cal);
  }

  /**
   * Получить все дисплеи
   */
  getDisplays(): DisplayConfig[] {
    return Array.from(this.displays.values());
  }

  /**
   * Получить venue profile
   */
  getVenueProfile(): VenueProfile | null {
    return this.venueProfile;
  }

  /**
   * Установить режим калибровки
   */
  setCalibrationMode(enabled: boolean): void {
    this.calibrationMode = enabled;
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    this.syncCallbacks.clear();
    this.displays.clear();

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
  }
}

export default MultiDisplayManager;
