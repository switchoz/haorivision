/**
 * 🎨 TEST PATTERNS
 *
 * Тестовые паттерны для калибровки проекторов
 * - Color Bars (SMPTE, EBU)
 * - Ramp (градиенты)
 * - UV Pulse
 * - Bloom Sweep
 * - Geometry Grid
 */

import * as THREE from "three";

export type TestPatternType =
  | "color_bars"
  | "ramp_horizontal"
  | "ramp_vertical"
  | "ramp_diagonal"
  | "uv_pulse"
  | "bloom_sweep"
  | "geometry_grid"
  | "crosshatch"
  | "checkerboard"
  | "white"
  | "black";

// === COLOR BARS ===

export class ColorBarsPattern {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.createSMPTEBars();
  }

  private createSMPTEBars(): void {
    // SMPTE Color Bars: White, Yellow, Cyan, Green, Magenta, Red, Blue, Black
    const colors = [
      0xffffff, // White
      0xffff00, // Yellow
      0x00ffff, // Cyan
      0x00ff00, // Green
      0xff00ff, // Magenta
      0xff0000, // Red
      0x0000ff, // Blue
      0x000000, // Black
    ];

    const barWidth = 2 / colors.length;

    colors.forEach((color, index) => {
      const geometry = new THREE.PlaneGeometry(barWidth, 2);
      const material = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.x = -1 + barWidth / 2 + index * barWidth;
      this.scene.add(mesh);
    });
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }
}

// === RAMP PATTERN ===

export class RampPattern {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  constructor(
    direction: "horizontal" | "vertical" | "diagonal" = "horizontal",
  ) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.createRamp(direction);
  }

  private createRamp(direction: string): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    let fragmentShader = "";

    switch (direction) {
      case "horizontal":
        fragmentShader = `
          varying vec2 vUv;
          void main() {
            float gray = vUv.x;
            gl_FragColor = vec4(vec3(gray), 1.0);
          }
        `;
        break;

      case "vertical":
        fragmentShader = `
          varying vec2 vUv;
          void main() {
            float gray = vUv.y;
            gl_FragColor = vec4(vec3(gray), 1.0);
          }
        `;
        break;

      case "diagonal":
        fragmentShader = `
          varying vec2 vUv;
          void main() {
            float gray = (vUv.x + vUv.y) * 0.5;
            gl_FragColor = vec4(vec3(gray), 1.0);
          }
        `;
        break;
    }

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }
}

// === UV PULSE PATTERN ===

export class UVPulsePattern {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private startTime: number;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.startTime = Date.now();

    this.createPulse();
  }

  private createPulse(): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;

      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = length(vUv - center);

        float pulse = sin(uTime * 2.0 - dist * 10.0) * 0.5 + 0.5;
        vec3 color = uColor * pulse;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#FF10F0") },
      },
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);
  }

  update(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.material.uniforms.uTime.value = elapsed;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }
}

// === BLOOM SWEEP PATTERN ===

export class BloomSweepPattern {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private startTime: number;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.startTime = Date.now();

    this.createSweep();
  }

  private createSweep(): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        float sweep = sin(vUv.x * 3.14159 + uTime) * 0.5 + 0.5;
        float intensity = pow(sweep, 3.0) * 2.0;

        vec3 color = vec3(intensity);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);
  }

  update(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.material.uniforms.uTime.value = elapsed;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }
}

// === GEOMETRY GRID PATTERN ===

export class GeometryGridPattern {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  constructor(rows: number = 9, cols: number = 9) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.createGrid(rows, cols);
  }

  private createGrid(rows: number, cols: number): void {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    // Вертикальные линии
    for (let i = 0; i <= cols; i++) {
      const x = -1 + (2 / cols) * i;
      positions.push(x, -1, 0);
      positions.push(x, 1, 0);
    }

    // Горизонтальные линии
    for (let i = 0; i <= rows; i++) {
      const y = -1 + (2 / rows) * i;
      positions.push(-1, y, 0);
      positions.push(1, y, 0);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );

    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const lines = new THREE.LineSegments(geometry, material);

    this.scene.add(lines);

    // Добавить точки пересечения
    const pointsGeometry = new THREE.BufferGeometry();
    const pointPositions = [];

    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= cols; x++) {
        const px = -1 + (2 / cols) * x;
        const py = -1 + (2 / rows) * y;
        pointPositions.push(px, py, 0);
      }
    }

    pointsGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(pointPositions, 3),
    );

    const pointsMaterial = new THREE.PointsMaterial({
      color: 0xff0000,
      size: 0.02,
    });

    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    this.scene.add(points);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }
}

// === CROSSHATCH PATTERN ===

export class CrosshatchPattern {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.createCrosshatch();
  }

  private createCrosshatch(): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;

      void main() {
        float lines = mod(vUv.x * 100.0, 1.0) < 0.1 ? 1.0 : 0.0;
        lines += mod(vUv.y * 100.0, 1.0) < 0.1 ? 1.0 : 0.0;

        gl_FragColor = vec4(vec3(lines), 1.0);
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }
}

// === CHECKERBOARD PATTERN ===

export class CheckerboardPattern {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  constructor(size: number = 16) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.createCheckerboard(size);
  }

  private createCheckerboard(size: number): void {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uSize;
      varying vec2 vUv;

      void main() {
        float checker = mod(floor(vUv.x * uSize) + floor(vUv.y * uSize), 2.0);
        gl_FragColor = vec4(vec3(checker), 1.0);
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uSize: { value: size },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }
}

// === SOLID COLOR PATTERNS ===

export class SolidColorPattern {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;

  constructor(color: number = 0xffffff) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.createSolid(color);
  }

  private createSolid(color: number): void {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    this.scene.add(mesh);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    return this.camera;
  }
}

// === FACTORY ===

export class TestPatternFactory {
  static create(type: TestPatternType): any {
    switch (type) {
      case "color_bars":
        return new ColorBarsPattern();

      case "ramp_horizontal":
        return new RampPattern("horizontal");

      case "ramp_vertical":
        return new RampPattern("vertical");

      case "ramp_diagonal":
        return new RampPattern("diagonal");

      case "uv_pulse":
        return new UVPulsePattern();

      case "bloom_sweep":
        return new BloomSweepPattern();

      case "geometry_grid":
        return new GeometryGridPattern();

      case "crosshatch":
        return new CrosshatchPattern();

      case "checkerboard":
        return new CheckerboardPattern();

      case "white":
        return new SolidColorPattern(0xffffff);

      case "black":
        return new SolidColorPattern(0x000000);

      default:
        throw new Error(`Unknown test pattern: ${type}`);
    }
  }
}

export default TestPatternFactory;
