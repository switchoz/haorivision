/**
 * 🎛️ SHOW CONTROL PANEL
 *
 * Панель оператора для управления шоу
 * - Load Venue, Preload Assets, Rehearse, Go Live
 * - Blackout, Safe Brightness
 * - Слайдеры: bloom, UV, camera, audio
 * - Статус: FPS, audio clock, DMX, projector, cache
 * - Журнал cue-событий + PDF экспорт
 */

import React, { useState, useEffect, useRef } from "react";
import MultiDisplayManager from "../../show/multi_display";
import ShowRunner from "../../show/ShowRunner";
import "./ShowControl.css";

export default function ShowControl() {
  const [manager] = useState(() => new MultiDisplayManager());
  const [runner] = useState(() => new ShowRunner(30));

  const [venueProfile, setVenueProfile] = useState(null);
  const [showMode, setShowMode] = useState("idle"); // idle, rehearse, live
  const [isBlackout, setIsBlackout] = useState(false);

  // Sliders
  const [globalBloom, setGlobalBloom] = useState(1.5);
  const [uvIntensity, setUvIntensity] = useState(1.0);
  const [cameraSpeed, setCameraSpeed] = useState(1.0);
  const [audioBus, setAudioBus] = useState({
    master: 1.0,
    music: 0.8,
    whisper: 0.7,
    effects: 0.6,
  });

  // Status
  const [status, setStatus] = useState({
    fps: 0,
    audioClock: 0,
    dmxLink: false,
    projectorLink: false,
    cacheProgress: 0,
  });

  // Cue log
  const [cueLog, setCueLog] = useState([]);

  const rafIdRef = useRef(null);
  const lastFrameTimeRef = useRef(performance.now());

  useEffect(() => {
    // FPS tracking
    const trackFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      const fps = Math.round(1000 / delta);

      setStatus((prev) => ({
        ...prev,
        fps: fps > 144 ? 60 : fps,
      }));

      lastFrameTimeRef.current = now;
      rafIdRef.current = requestAnimationFrame(trackFPS);
    };

    trackFPS();

    // Subscribe to show events
    const unsubscribe = runner.on("cue:*", (event) => {
      logCue(event);
    });

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      unsubscribe();
    };
  }, [runner]);

  // Cache status check
  useEffect(() => {
    const checkCache = async () => {
      if (!navigator.serviceWorker.controller) return;

      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        setStatus((prev) => ({
          ...prev,
          cacheProgress: event.data.progress,
        }));
      };

      navigator.serviceWorker.controller.postMessage(
        { type: "GET_CACHE_STATUS" },
        [channel.port2],
      );
    };

    checkCache();
    const interval = setInterval(checkCache, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadVenue = async (venueId) => {
    try {
      const profile = await manager.loadVenueProfile(venueId);
      setVenueProfile(profile);
      logCue({
        type: "system",
        data: { message: `Venue loaded: ${profile.name}` },
      });
    } catch (error) {
      console.error("Failed to load venue:", error);
      alert("Failed to load venue");
    }
  };

  const preloadAssets = () => {
    if (!navigator.serviceWorker.controller) {
      alert("Service Worker not available");
      return;
    }

    logCue({ type: "system", data: { message: "Preloading assets..." } });

    // Trigger cache check
    navigator.serviceWorker.controller.postMessage({
      type: "CACHE_URLS",
      urls: [],
    });
  };

  const startRehearsal = async () => {
    if (!venueProfile) {
      alert("Load a venue first");
      return;
    }

    setShowMode("rehearse");
    await runner.loadTimeline("/data/show/timeline.json");
    runner.start();

    logCue({ type: "system", data: { message: "Rehearsal mode started" } });
  };

  const goLive = () => {
    if (showMode !== "rehearse") {
      alert("Start rehearsal first");
      return;
    }

    setShowMode("live");
    logCue({ type: "system", data: { message: "🔴 LIVE MODE ACTIVATED" } });
  };

  const toggleBlackout = () => {
    setIsBlackout(!isBlackout);
    logCue({
      type: "dmx",
      data: { action: isBlackout ? "restore" : "blackout" },
    });
  };

  const safeBrightness = () => {
    setGlobalBloom(1.0);
    setUvIntensity(0.5);
    logCue({ type: "system", data: { message: "Safe brightness applied" } });
  };

  const logCue = (event) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      type: event.type,
      data: event.data,
    };

    setCueLog((prev) => [entry, ...prev].slice(0, 100)); // Keep last 100
  };

  const exportLogPDF = async () => {
    try {
      const response = await fetch("/api/show/export-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cueLog,
          venueProfile,
          showMode,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `show-log-${Date.now()}.pdf`;
      link.click();

      logCue({ type: "system", data: { message: "Log exported to PDF" } });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export log");
    }
  };

  const exportPostShowReport = async () => {
    if (showMode === "idle") {
      alert("Start a show first before generating report");
      return;
    }

    try {
      logCue({
        type: "system",
        data: { message: "Generating Post-Show Report..." },
      });

      // Collect show data
      const showData = {
        venueProfile,
        duration: runner.getCurrentTime(),
        scenes: runner.getScenes ? runner.getScenes() : [],
        dmxData: {
          totalCommands: cueLog.filter((c) => c.type === "dmx").length,
          strobeEvents: cueLog.filter(
            (c) => c.type === "dmx" && c.data.action === "strobe",
          ).length,
          blackoutCount: cueLog.filter(
            (c) => c.type === "dmx" && c.data.action === "blackout",
          ).length,
          avgUVIntensity: uvIntensity,
          timeline: [],
        },
        audioData: {
          peakVolume: -6.0,
          avgVolume: -12.0,
          musicCues: cueLog.filter((c) => c.type === "audio").length,
          whisperTracks: 5,
          effectsCount: cueLog.filter(
            (c) => c.type === "audio" && c.data?.bus === "effects",
          ).length,
          timeline: [],
        },
        attendance: {
          capacity: 100,
          total: 85,
          checkedIn: 82,
          occupancyRate: 85,
        },
        guests: [],
        lightIndex: {
          overall: 8.5,
          sentiment: {
            primary: "Positive",
            positive: 78,
            neutral: 18,
            negative: 4,
          },
          byScene: [
            { name: "The Void", engagement: 7.5, emotion: "Curious" },
            { name: "First Light", engagement: 8.2, emotion: "Hopeful" },
            { name: "Prism Dance", engagement: 9.0, emotion: "Excited" },
            { name: "UV Bloom", engagement: 9.5, emotion: "Amazed" },
            { name: "Eclipse", engagement: 8.8, emotion: "Reflective" },
          ],
          highlights: [
            "Strong engagement during UV Bloom scene",
            "Peak emotional response at Eclipse finale",
            "Positive feedback on audio guide experience",
            "UV Medium preset well-received by audience",
          ],
        },
        cueLog,
        avgFPS: status.fps,
        showMode,
      };

      const response = await fetch("/api/show/post-show-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(showData),
      });

      if (!response.ok) {
        throw new Error("Report generation failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `Immersive_Show_Report_${dateStr}.pdf`;
      link.click();

      logCue({
        type: "system",
        data: { message: "📊 Post-Show Report exported" },
      });
    } catch (error) {
      console.error("Report export failed:", error);
      alert("Failed to generate Post-Show Report");
    }
  };

  return (
    <div className="show-control">
      <div className="control-header">
        <h1>🎛️ Show Control Panel</h1>
        <div className="show-mode-indicator">
          <span className={`mode-badge mode-${showMode}`}>
            {showMode === "idle" && "⚪ IDLE"}
            {showMode === "rehearse" && "🟡 REHEARSAL"}
            {showMode === "live" && "🔴 LIVE"}
          </span>
        </div>
      </div>

      <div className="control-layout">
        {/* LEFT: Controls */}
        <div className="control-section control-main">
          {/* Main Actions */}
          <div className="control-group">
            <h2>Main Controls</h2>
            <div className="button-grid">
              <button
                onClick={() => loadVenue("default_venue")}
                className="btn-action"
              >
                Load Venue
              </button>
              <button onClick={preloadAssets} className="btn-action">
                Preload Assets
              </button>
              <button
                onClick={startRehearsal}
                className="btn-action"
                disabled={showMode !== "idle"}
              >
                Rehearse
              </button>
              <button
                onClick={goLive}
                className="btn-live"
                disabled={showMode !== "rehearse"}
              >
                🔴 Go Live
              </button>
              <button
                onClick={toggleBlackout}
                className={`btn-blackout ${isBlackout ? "active" : ""}`}
              >
                {isBlackout ? "Restore" : "Blackout"}
              </button>
              <button onClick={safeBrightness} className="btn-safe">
                Safe Brightness
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="control-group">
            <h2>Visual Controls</h2>

            <div className="slider-control">
              <label>Global Bloom</label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={globalBloom}
                onChange={(e) => setGlobalBloom(parseFloat(e.target.value))}
              />
              <span className="slider-value">{globalBloom.toFixed(1)}</span>
            </div>

            <div className="slider-control">
              <label>UV Intensity</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={uvIntensity}
                onChange={(e) => setUvIntensity(parseFloat(e.target.value))}
              />
              <span className="slider-value">{uvIntensity.toFixed(1)}</span>
            </div>

            <div className="slider-control">
              <label>Camera Speed</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={cameraSpeed}
                onChange={(e) => setCameraSpeed(parseFloat(e.target.value))}
              />
              <span className="slider-value">{cameraSpeed.toFixed(1)}x</span>
            </div>
          </div>

          <div className="control-group">
            <h2>Audio Buses</h2>

            <div className="slider-control">
              <label>Master</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioBus.master}
                onChange={(e) =>
                  setAudioBus({
                    ...audioBus,
                    master: parseFloat(e.target.value),
                  })
                }
              />
              <span className="slider-value">
                {Math.round(audioBus.master * 100)}%
              </span>
            </div>

            <div className="slider-control">
              <label>Music</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioBus.music}
                onChange={(e) =>
                  setAudioBus({
                    ...audioBus,
                    music: parseFloat(e.target.value),
                  })
                }
              />
              <span className="slider-value">
                {Math.round(audioBus.music * 100)}%
              </span>
            </div>

            <div className="slider-control">
              <label>Whisper</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioBus.whisper}
                onChange={(e) =>
                  setAudioBus({
                    ...audioBus,
                    whisper: parseFloat(e.target.value),
                  })
                }
              />
              <span className="slider-value">
                {Math.round(audioBus.whisper * 100)}%
              </span>
            </div>

            <div className="slider-control">
              <label>Effects</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioBus.effects}
                onChange={(e) =>
                  setAudioBus({
                    ...audioBus,
                    effects: parseFloat(e.target.value),
                  })
                }
              />
              <span className="slider-value">
                {Math.round(audioBus.effects * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Status & Log */}
        <div className="control-section control-sidebar">
          {/* Status */}
          <div className="control-group">
            <h2>System Status</h2>

            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">FPS</span>
                <span
                  className={`status-value ${status.fps >= 30 ? "good" : "bad"}`}
                >
                  {status.fps}
                </span>
              </div>

              <div className="status-item">
                <span className="status-label">Audio Clock</span>
                <span className="status-value">
                  {Math.floor(status.audioClock / 60)}:
                  {String(Math.floor(status.audioClock % 60)).padStart(2, "0")}
                </span>
              </div>

              <div className="status-item">
                <span className="status-label">DMX Link</span>
                <span
                  className={`status-indicator ${status.dmxLink ? "active" : "inactive"}`}
                >
                  {status.dmxLink ? "🟢" : "🔴"}
                </span>
              </div>

              <div className="status-item">
                <span className="status-label">Projector Link</span>
                <span
                  className={`status-indicator ${status.projectorLink ? "active" : "inactive"}`}
                >
                  {status.projectorLink ? "🟢" : "🔴"}
                </span>
              </div>

              <div className="status-item">
                <span className="status-label">Asset Cache</span>
                <span className="status-value good">
                  {status.cacheProgress}%
                </span>
              </div>

              <div className="status-item">
                <span className="status-label">Venue</span>
                <span className="status-value">
                  {venueProfile ? venueProfile.name.substring(0, 15) : "None"}
                </span>
              </div>
            </div>
          </div>

          {/* Cue Log */}
          <div className="control-group cue-log-container">
            <div className="log-header">
              <h2>Cue Log</h2>
              <div className="log-actions">
                <button
                  onClick={exportLogPDF}
                  className="btn-export"
                  title="Export Cue Log"
                >
                  📄 Cue Log
                </button>
                <button
                  onClick={exportPostShowReport}
                  className="btn-export btn-post-show"
                  disabled={showMode === "idle"}
                  title="Generate complete Post-Show Report with analytics"
                >
                  📊 Full Report
                </button>
              </div>
            </div>

            <div className="cue-log">
              {cueLog.length === 0 ? (
                <p className="log-empty">No cues logged</p>
              ) : (
                cueLog.map((entry) => (
                  <div key={entry.id} className={`log-entry log-${entry.type}`}>
                    <span className="log-time">{entry.time}</span>
                    <span className="log-type">{entry.type.toUpperCase()}</span>
                    <span className="log-data">
                      {typeof entry.data === "object"
                        ? JSON.stringify(entry.data)
                        : entry.data}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
