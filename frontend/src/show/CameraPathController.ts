/**
 * 🎥 CAMERA PATH CONTROLLER
 *
 * Плавная интерполяция камеры по ключевым точкам
 * Поддержка easing функций и smooth lookAt
 */

import type { CameraKeyframe, EasingFunction } from "./types";
import * as THREE from "three";

export class CameraPathController {
  private keyframes: CameraKeyframe[] = [];
  private currentKeyframeIndex: number = 0;

  /**
   * Установить ключевые точки камеры
   */
  setKeyframes(keyframes: CameraKeyframe[]): void {
    this.keyframes = keyframes.sort((a, b) => a.time - b.time);
    this.currentKeyframeIndex = 0;
  }

  /**
   * Получить состояние камеры в конкретный момент времени
   */
  getCameraStateAtTime(time: number): {
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
  } | null {
    if (this.keyframes.length === 0) return null;

    // Найти два ближайших keyframe'а
    let keyframe1: CameraKeyframe | null = null;
    let keyframe2: CameraKeyframe | null = null;

    for (let i = 0; i < this.keyframes.length; i++) {
      if (this.keyframes[i].time <= time) {
        keyframe1 = this.keyframes[i];
      } else {
        keyframe2 = this.keyframes[i];
        break;
      }
    }

    // Если время до первого keyframe
    if (!keyframe1 && keyframe2) {
      return this.keyframeToState(keyframe2);
    }

    // Если время после последнего keyframe
    if (keyframe1 && !keyframe2) {
      return this.keyframeToState(keyframe1);
    }

    // Интерполяция между двумя keyframe'ами
    if (keyframe1 && keyframe2) {
      return this.interpolate(keyframe1, keyframe2, time);
    }

    return null;
  }

  /**
   * Интерполяция между двумя keyframe'ами
   */
  private interpolate(
    kf1: CameraKeyframe,
    kf2: CameraKeyframe,
    time: number,
  ): {
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
  } {
    // Прогресс между keyframe'ами (0-1)
    const duration = kf2.time - kf1.time;
    const elapsed = time - kf1.time;
    const t = Math.max(0, Math.min(1, elapsed / duration));

    // Применяем easing
    const easedT = this.applyEasing(t, kf2.easing);

    // Интерполяция position
    const position = new THREE.Vector3(
      this.lerp(kf1.position[0], kf2.position[0], easedT),
      this.lerp(kf1.position[1], kf2.position[1], easedT),
      this.lerp(kf1.position[2], kf2.position[2], easedT),
    );

    // Интерполяция target
    const target = new THREE.Vector3(
      this.lerp(kf1.target[0], kf2.target[0], easedT),
      this.lerp(kf1.target[1], kf2.target[1], easedT),
      this.lerp(kf1.target[2], kf2.target[2], easedT),
    );

    // Интерполяция FOV
    const fov = this.lerp(kf1.fov, kf2.fov, easedT);

    return { position, target, fov };
  }

  /**
   * Конвертация keyframe в state
   */
  private keyframeToState(kf: CameraKeyframe): {
    position: THREE.Vector3;
    target: THREE.Vector3;
    fov: number;
  } {
    return {
      position: new THREE.Vector3(...kf.position),
      target: new THREE.Vector3(...kf.target),
      fov: kf.fov,
    };
  }

  /**
   * Линейная интерполяция
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Применение easing функции
   */
  private applyEasing(t: number, easing: EasingFunction): number {
    switch (easing) {
      case "linear":
        return t;

      case "easeIn":
        return t * t;

      case "easeOut":
        return t * (2 - t);

      case "easeInOut":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      case "easeInCubic":
        return t * t * t;

      case "easeOutCubic":
        return --t * t * t + 1;

      default:
        return t;
    }
  }

  /**
   * Получить все keyframe'ы
   */
  getKeyframes(): CameraKeyframe[] {
    return this.keyframes;
  }

  /**
   * Очистить path
   */
  clear(): void {
    this.keyframes = [];
    this.currentKeyframeIndex = 0;
  }
}

export default CameraPathController;
