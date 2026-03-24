/**
 * 🌅 THE LIGHT AWAKENS
 *
 * Приветственный прелоадер с индикатором готовности кэша
 * - "Show Ready: X% assets cached"
 * - UV animated gradient
 * - Fade out при готовности
 */

import React, { useState, useEffect } from "react";
import "./LightAwakensPreloader.css";

export default function LightAwakensPreloader({ onReady }) {
  const [progress, setProgress] = useState(0);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [showReady, setShowReady] = useState(false);

  useEffect(() => {
    // Проверить Service Worker
    if (!("serviceWorker" in navigator)) {
      console.warn("[Preloader] Service Worker not supported");
      setProgress(100);
      setIsReady(true);
      return;
    }

    // Регистрация Service Worker
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (import.meta.env.DEV)
        console.log("[Preloader] Service Worker registered");

      // Подписка на сообщения от SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "CACHE_READY") {
          if (import.meta.env.DEV)
            console.log("[Preloader] Cache ready:", event.data.version);
          checkCacheStatus();
        }
      });

      // Начать проверку статуса
      checkCacheStatus();

      // Периодическая проверка
      const interval = setInterval(checkCacheStatus, 1000);

      return () => clearInterval(interval);
    });
  }, []);

  const checkCacheStatus = async () => {
    if (!navigator.serviceWorker.controller) {
      if (import.meta.env.DEV) console.log("[Preloader] No SW controller yet");
      return;
    }

    try {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        const status = event.data;
        if (import.meta.env.DEV)
          console.log("[Preloader] Cache status:", status);

        setCacheStatus(status);
        setProgress(status.progress);

        if (status.progress >= 100) {
          setIsReady(true);
          setTimeout(() => {
            setShowReady(true);
            setTimeout(() => {
              onReady && onReady();
            }, 1500);
          }, 500);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: "GET_CACHE_STATUS" },
        [channel.port2],
      );
    } catch (error) {
      console.error("[Preloader] Failed to get cache status:", error);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={`light-awakens-preloader ${showReady ? "fade-out" : ""}`}>
      {/* Animated background */}
      <div className="preloader-bg">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>

      {/* Content */}
      <div className="preloader-content">
        {/* Logo */}
        <div className="preloader-logo">
          <h1 className="preloader-title">
            <span className="title-line">THE LIGHT</span>
            <span className="title-line">AWAKENS</span>
          </h1>
          <p className="preloader-subtitle">HAORI VISION</p>
        </div>

        {/* Progress */}
        <div className="preloader-progress">
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="progress-bar-glow"></div>
            </div>
          </div>

          <div className="progress-text">
            {isReady ? (
              <span className="ready-text">✦ SHOW READY ✦</span>
            ) : (
              <>
                <span className="progress-label">Show Ready:</span>
                <span className="progress-value">{progress}%</span>
                <span className="progress-detail">
                  {cacheStatus &&
                    `${cacheStatus.assetsCached} / ${cacheStatus.totalAssets} assets`}
                </span>
              </>
            )}
          </div>

          {cacheStatus && !isReady && (
            <div className="cache-stats">
              <div className="cache-stat">
                <span className="cache-stat-label">Cached:</span>
                <span className="cache-stat-value">
                  {formatSize(cacheStatus.totalSize)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hint */}
        {isReady && (
          <div className="preloader-hint fade-in">
            <p>Press anywhere to enter</p>
          </div>
        )}
      </div>

      {/* Loading particles */}
      <div className="preloader-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
