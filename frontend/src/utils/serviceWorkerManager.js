/**
 * 🔧 SERVICE WORKER MANAGER
 *
 * Утилита для управления Service Worker из приложения
 */

export class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.isSupported = "serviceWorker" in navigator;
    this.updateAvailable = false;
  }

  // Регистрация Service Worker
  async register() {
    if (!this.isSupported) {
      console.warn("[SW Manager] Service Workers not supported");
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log(
        "[SW Manager] Service Worker registered:",
        this.registration.scope,
      );

      // Слушаем обновления
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration.installing;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("[SW Manager] New Service Worker available");
            this.updateAvailable = true;
          }
        });
      });

      return true;
    } catch (error) {
      console.error("[SW Manager] Registration failed:", error);
      return false;
    }
  }

  // Обновить Service Worker
  async update() {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log("[SW Manager] Service Worker updated");
    } catch (error) {
      console.error("[SW Manager] Update failed:", error);
    }
  }

  // Активировать новый Service Worker немедленно
  skipWaiting() {
    if (!this.registration || !this.registration.waiting) return;

    this.registration.waiting.postMessage({ type: "SKIP_WAITING" });

    // Перезагружаем страницу после активации
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  }

  // Закешировать конкретные URL (для pre-caching show assets)
  async cacheUrls(urls) {
    if (!this.registration || !this.registration.active) {
      console.warn("[SW Manager] No active Service Worker");
      return;
    }

    this.registration.active.postMessage({
      type: "CACHE_URLS",
      urls,
    });

    console.log("[SW Manager] Caching URLs:", urls.length);
  }

  // Очистить весь кеш
  async clearCache() {
    if (!this.registration || !this.registration.active) return;

    this.registration.active.postMessage({ type: "CLEAR_CACHE" });
    console.log("[SW Manager] Cache cleared");
  }

  // Проверить статус кеша
  async getCacheStatus() {
    if (!("caches" in window)) return null;

    try {
      const cacheNames = await caches.keys();
      const cacheStatus = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return {
            name,
            count: keys.length,
            urls: keys.map((req) => req.url),
          };
        }),
      );

      return cacheStatus;
    } catch (error) {
      console.error("[SW Manager] Cache status check failed:", error);
      return null;
    }
  }

  // Pre-cache критичных ассетов для шоу
  async precacheShowAssets(assetList) {
    console.log("[SW Manager] Pre-caching show assets...");

    const essentialAssets = [
      // 3D модели
      ...assetList.filter((url) => url.match(/\.(glb|gltf)$/)),

      // Текстуры
      ...assetList.filter((url) => url.match(/\.(jpg|jpeg|png|webp)$/)),

      // Аудио
      ...assetList.filter((url) => url.match(/\.(mp3|wav|ogg)$/)),

      // Видео
      ...assetList.filter((url) => url.match(/\.(mp4|webm)$/)),
    ];

    await this.cacheUrls(essentialAssets);

    console.log(
      "[SW Manager] Pre-caching complete:",
      essentialAssets.length,
      "assets",
    );

    return essentialAssets.length;
  }

  // Проверить доступность оффлайн режима
  async checkOfflineCapability() {
    const cacheStatus = await this.getCacheStatus();

    if (!cacheStatus || cacheStatus.length === 0) {
      return {
        ready: false,
        message: "No cached assets",
      };
    }

    const totalAssets = cacheStatus.reduce(
      (sum, cache) => sum + cache.count,
      0,
    );

    return {
      ready: totalAssets > 0,
      caches: cacheStatus.length,
      totalAssets,
      message: `${totalAssets} assets cached across ${cacheStatus.length} caches`,
    };
  }
}

// Singleton instance
export const swManager = new ServiceWorkerManager();

// React Hook для использования Service Worker
import { useState, useEffect } from "react";

export function useServiceWorker() {
  const [isReady, setIsReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const registered = await swManager.register();
      setIsReady(registered);

      if (registered) {
        const offlineStatus = await swManager.checkOfflineCapability();
        setOfflineReady(offlineStatus.ready);
      }
    };

    init();

    // Проверяем обновления каждые 5 минут
    const updateInterval = setInterval(
      () => {
        swManager.update();
        setUpdateAvailable(swManager.updateAvailable);
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(updateInterval);
  }, []);

  const precacheAssets = async (urls) => {
    await swManager.precacheShowAssets(urls);
    const status = await swManager.checkOfflineCapability();
    setOfflineReady(status.ready);
  };

  const activateUpdate = () => {
    swManager.skipWaiting();
  };

  return {
    isReady,
    updateAvailable,
    offlineReady,
    precacheAssets,
    activateUpdate,
    clearCache: () => swManager.clearCache(),
  };
}

export default swManager;
