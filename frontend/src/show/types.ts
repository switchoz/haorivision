/**
 * 🎬 SHOW TIMELINE TYPES
 *
 * TypeScript типы для timeline.json
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type EasingFunction =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "easeInCubic"
  | "easeOutCubic";

// === CAMERA ===
export interface CameraKeyframe {
  time: number;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  easing: EasingFunction;
}

export interface CameraPath {
  path: CameraKeyframe[];
  lookAt: "smooth" | "instant";
  autoRotate: boolean;
  autoRotateSpeed?: number;
}

// === LIGHTING ===
export interface UVLight {
  id: string;
  position: [number, number, number];
  color: string;
  intensity: number;
  pattern?: "pulse" | "wave" | "strobe";
  breathSpeed?: number;
  strobeSpeed?: number;
}

export interface RGBLight {
  id: string;
  position: [number, number, number];
  colors: string[];
  transitionSpeed: number;
  intensity: number;
}

export interface MovingHead {
  id: string;
  position: [number, number, number];
  pattern: "circle" | "figure8" | "random";
  speed: number;
  color: string;
}

export interface SceneLighting {
  preset: string;
  ambient: {
    color: string;
    intensity: number;
  };
  uvLights: UVLight[];
  rgbLights?: RGBLight[];
  movingHeads?: MovingHead[];
  spotlights?: any[];
}

// === SHADER ===
export interface ShaderParams {
  bloom: {
    strength: number;
    radius: number;
    threshold: number;
  };
  exposure: number;
  vignette: number;
  colorGrading: {
    saturation: number;
    contrast: number;
  };
  chromaticAberration?: number;
}

// === FOG ===
export interface FogParams {
  color: string;
  near: number;
  far: number;
  density: number;
  uvGlow: number;
}

// === PROJECTION ===
export interface ProjectionSurface {
  position: [number, number, number];
  size: [number, number];
  mode?: string;
  shader?: any;
}

export interface ProjectionMapping {
  mode: "reactive" | "kaleidoscope" | "glitch" | "multi";
  surface?: ProjectionSurface;
  surfaces?: ProjectionSurface[];
  shader?: any;
}

// === AUDIO ===
export interface AudioCue {
  track: string;
  volume: number;
  fadeIn: number;
  fadeOut?: number;
  loop: boolean;
  startOffset: number;
}

// === DMX ===
export interface DMXCue {
  time: number;
  action: string;
  fixtures?: string[];
  intensity?: number;
  duration?: number;
  color?: [number, number, number] | number[];
  colors?: number[][];
  speed?: number;
  pattern?: string;
  minIntensity?: number;
  maxIntensity?: number;
}

export interface DMXTrack {
  cues: DMXCue[];
}

// === TEXT OVERLAYS ===
export interface TextOverlay {
  time: number;
  duration: number;
  text: string;
  position: "top" | "center" | "bottom" | "left" | "right";
  style: {
    fontSize: string;
    color: string;
    opacity: number;
    animation: string;
    textShadow?: string;
    letterSpacing?: string;
    fontStyle?: string;
    fontFamily?: string;
  };
}

// === COLLECTION FOCUS ===
export interface CollectionFocus {
  collection: string;
  islandPosition: [number, number, number];
  uvIntensity: number;
  highlightDuration: number;
}

// === TRANSITIONS ===
export interface Transition {
  type: "crossfade" | "fadeToBlack" | "cut";
  duration: number;
  easing: EasingFunction;
}

// === SCENE ===
export interface Scene {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  description: string;

  camera: CameraPath;
  lighting: SceneLighting;
  shader: ShaderParams;
  fog: FogParams;
  projection?: ProjectionMapping;
  audio: AudioCue;
  dmx: DMXTrack;
  textOverlays: TextOverlay[];
  collectionFocus?: CollectionFocus;
  particleEffects?: any[];

  transitions: {
    out: Transition;
  };
}

// === TIMELINE ===
export interface Timeline {
  version: string;
  name: string;
  description: string;

  metadata: {
    duration: number;
    fps: number;
    smpteFramerate: string;
    author: string;
    createdAt: string;
    collections: string[];
  };

  globalSettings: {
    audio: any;
    camera: any;
    rendering: any;
  };

  scenes: Scene[];

  postShow?: {
    duration: number;
    fadeToBlack: boolean;
    endCard?: {
      text: string;
      style: any;
    };
  };
}

// === EVENTS ===
export type ShowEventType =
  | "scene:start"
  | "scene:end"
  | "cue:dmx"
  | "cue:audio"
  | "cue:text"
  | "transition:start"
  | "transition:end"
  | "show:start"
  | "show:end"
  | "show:pause"
  | "show:resume";

export interface ShowEvent {
  type: ShowEventType;
  time: number;
  sceneId?: string;
  data?: any;
}

export interface ShowState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  currentScene: Scene | null;
  currentSceneIndex: number;
  progress: number; // 0-1
  frameCount: number;
}
