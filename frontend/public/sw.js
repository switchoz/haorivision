/**
 * 📦 SERVICE WORKER для HAORI VISION
 *
 * Оффлайн кеш для pop-up ивентов и шоу без интернета
 * Стратегия: Cache First для assets, Network First для API
 * Pre-cache: media, data, shaders, audio loops
 */

const CACHE_VERSION = "haori-vision-v3.0.0";
const CACHE_ASSETS = "haori-assets-v3";
const CACHE_API = "haori-api-v3";
const CACHE_MEDIA = "haori-media-v3";
const CACHE_SHOW = "haori-show-v3";

// Критичные файлы для оффлайн работы
const CRITICAL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/index.js",
  "/assets/index.css",
];

// SHOW ASSETS — pre-cache для полного оффлайн режима
const SHOW_ASSETS = [
  // Timeline data
  "/data/show/timeline.json",
  "/data/show/venues/default_venue.json",
  "/data/show/venues/triple_wall_projection.json",

  // 3D Models (будут добавлены динамически)
  "/models/collections/mycelium-dreams/model.glb",
  "/models/collections/void-bloom/model.glb",
  "/models/collections/neon-ancestors/model.glb",

  // Audio loops
  "/audio/show/intro_dark.mp3",
  "/audio/show/light_awaken.mp3",
  "/audio/show/eclipse_phase.mp3",
  "/audio/show/bloom_ascend.mp3",
  "/audio/show/finale.mp3",

  // Guided Whisper audio
  "/audio/whisper/en/intro_dark.mp3",
  "/audio/whisper/en/light_awaken.mp3",
  "/audio/whisper/en/eclipse_phase.mp3",
  "/audio/whisper/en/bloom_ascend.mp3",
  "/audio/whisper/en/finale.mp3",
  "/audio/whisper/ru/intro_dark.mp3",
  "/audio/whisper/ru/light_awaken.mp3",
  "/audio/whisper/ru/eclipse_phase.mp3",
  "/audio/whisper/ru/bloom_ascend.mp3",
  "/audio/whisper/ru/finale.mp3",

  // Textures
  "/textures/uv-reactive.jpg",
  "/textures/kaleidoscope.jpg",
  "/textures/noise.png",

  // Brand assets
  "/brand-assets/logo.svg",
  "/brand-assets/light-card-template.png",
];

// === INSTALL ===
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...", CACHE_VERSION);

  event.waitUntil(
    Promise.all([
      // Critical assets
      caches.open(CACHE_ASSETS).then((cache) => {
        console.log("[SW] Caching critical assets");
        return cache.addAll(CRITICAL_ASSETS);
      }),

      // Show assets
      caches.open(CACHE_SHOW).then((cache) => {
        console.log("[SW] Pre-caching show assets...");
        return cache.addAll(SHOW_ASSETS).catch((error) => {
          console.warn("[SW] Some show assets failed to cache:", error);
          // Не падаем если какие-то ассеты не загрузились
        });
      }),
    ]).then(() => {
      console.log("[SW] Installation complete");
      // Отправить сообщение клиенту о готовности
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "CACHE_READY",
            version: CACHE_VERSION,
          });
        });
      });
    }),
  );

  // Активируем сразу, не ждём
  self.skipWaiting();
});

// === ACTIVATE ===
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...", CACHE_VERSION);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем старые версии кеша
          if (
            cacheName !== CACHE_ASSETS &&
            cacheName !== CACHE_API &&
            cacheName !== CACHE_MEDIA &&
            cacheName !== CACHE_SHOW
          ) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );

  // Берём контроль над всеми клиентами
  return self.clients.claim();
});

// === FETCH ===
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, CACHE_API));
    return;
  }

  // Media files (images, videos) - Cache First
  if (
    request.destination === "image" ||
    request.destination === "video" ||
    request.destination === "audio" ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|mp4|mp3|webm|glb|gltf)$/)
  ) {
    event.respondWith(cacheFirst(request, CACHE_MEDIA));
    return;
  }

  // JS, CSS, Fonts - Cache First
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(cacheFirst(request, CACHE_ASSETS));
    return;
  }

  // HTML - Network First (чтобы получать обновления)
  if (request.destination === "document") {
    event.respondWith(networkFirst(request, CACHE_ASSETS));
    return;
  }

  // Всё остальное - Network First
  event.respondWith(networkFirst(request, CACHE_ASSETS));
});

// === STRATEGIES ===

// Cache First: Сначала ищем в кеше, потом сеть
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    console.log("[SW] Cache hit:", request.url);
    return cached;
  }

  try {
    const response = await fetch(request);

    // Кешируем только успешные ответы
    if (response.ok) {
      console.log("[SW] Caching new resource:", request.url);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error("[SW] Fetch failed:", request.url, error);

    // Fallback для navigation requests
    if (request.destination === "document") {
      return cache.match("/index.html");
    }

    throw error;
  }
}

// Network First: Сначала пытаемся загрузить из сети, потом кеш
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    // Кешируем успешные ответы
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);

    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Fallback для navigation requests
    if (request.destination === "document") {
      return cache.match("/index.html");
    }

    throw error;
  }
}

// === BACKGROUND SYNC (для будущих фичей) ===
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-show-data") {
    event.waitUntil(syncShowData());
  }
});

async function syncShowData() {
  try {
    // Синхронизация данных шоу с сервером
    const response = await fetch("/api/gallery/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      console.log("[SW] Show data synced successfully");
    }
  } catch (error) {
    console.error("[SW] Show data sync failed:", error);
  }
}

// === MESSAGES (коммуникация с клиентом) ===
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open(CACHE_MEDIA).then((cache) => {
        return cache.addAll(event.data.urls);
      }),
    );
  }

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName)),
        );
      }),
    );
  }

  if (event.data.type === "GET_CACHE_STATUS") {
    event.waitUntil(
      getCacheStatus().then((status) => {
        event.ports[0].postMessage(status);
      }),
    );
  }
});

// Получить статус кэша
async function getCacheStatus() {
  const cacheNames = [CACHE_ASSETS, CACHE_MEDIA, CACHE_SHOW];
  const status = {
    version: CACHE_VERSION,
    caches: {},
    totalSize: 0,
    assetsCached: 0,
    totalAssets: CRITICAL_ASSETS.length + SHOW_ASSETS.length,
  };

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    let size = 0;
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        size += blob.size;
      }
    }

    status.caches[cacheName] = {
      count: keys.length,
      size: size,
    };

    status.totalSize += size;
    status.assetsCached += keys.length;
  }

  status.progress = Math.round(
    (status.assetsCached / status.totalAssets) * 100,
  );

  return status;
}

// === PUSH NOTIFICATIONS (для будущих фичей) ===
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "HAORI VISION — новое шоу!",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    vibrate: [200, 100, 200],
    tag: "haori-vision",
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "HAORI VISION", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");

  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});

console.log("[SW] Service Worker loaded", CACHE_VERSION);
