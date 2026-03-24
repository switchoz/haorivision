/**
 * 🎯 CALIBRATION SCREEN
 *
 * Калибровка проекторов/дисплеев
 * - Warp grid с ручной настройкой
 * - Gamma/white point presets
 * - Test patterns
 * - Venue profile save/load
 */

import React, { useState, useEffect, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import MultiDisplayManager from "../../show/multi_display";
import { TestPatternFactory } from "../../show/test_patterns";
import "./Calibration.css";

// === WARP GRID EDITOR ===

function WarpGridEditor({ warpGrid, onUpdate, display }) {
  const canvasRef = useRef();
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = display.size;

    canvas.width = width;
    canvas.height = height;

    // Рисовать сетку
    ctx.clearRect(0, 0, width, height);

    // Линии
    ctx.strokeStyle = "#00BFFF";
    ctx.lineWidth = 1;

    for (let y = 0; y < warpGrid.rows; y++) {
      for (let x = 0; x < warpGrid.cols - 1; x++) {
        const p1 = warpGrid.points[y][x];
        const p2 = warpGrid.points[y][x + 1];

        const x1 = (p1.x + p1.offsetX / width) * width;
        const y1 = (p1.y + p1.offsetY / height) * height;
        const x2 = (p2.x + p2.offsetX / width) * width;
        const y2 = (p2.y + p2.offsetY / height) * height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    for (let x = 0; x < warpGrid.cols; x++) {
      for (let y = 0; y < warpGrid.rows - 1; y++) {
        const p1 = warpGrid.points[y][x];
        const p2 = warpGrid.points[y + 1][x];

        const x1 = (p1.x + p1.offsetX / width) * width;
        const y1 = (p1.y + p1.offsetY / height) * height;
        const x2 = (p2.x + p2.offsetX / width) * width;
        const y2 = (p2.y + p2.offsetY / height) * height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Точки
    for (let y = 0; y < warpGrid.rows; y++) {
      for (let x = 0; x < warpGrid.cols; x++) {
        const point = warpGrid.points[y][x];
        const px = (point.x + point.offsetX / width) * width;
        const py = (point.y + point.offsetY / height) * height;

        const isSelected =
          selectedPoint && selectedPoint.x === x && selectedPoint.y === y;

        ctx.fillStyle = isSelected ? "#FF10F0" : "#FFFFFF";
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        // Corner points — красные
        if (
          (x === 0 || x === warpGrid.cols - 1) &&
          (y === 0 || y === warpGrid.rows - 1)
        ) {
          ctx.fillStyle = "#FF0000";
          ctx.beginPath();
          ctx.arc(px, py, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [warpGrid, selectedPoint, display]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { width, height } = display.size;

    // Найти ближайшую точку
    let closestPoint = null;
    let closestDist = Infinity;

    for (let iy = 0; iy < warpGrid.rows; iy++) {
      for (let ix = 0; ix < warpGrid.cols; ix++) {
        const point = warpGrid.points[iy][ix];
        const px = (point.x + point.offsetX / width) * width;
        const py = (point.y + point.offsetY / height) * height;

        const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

        if (dist < 15 && dist < closestDist) {
          closestDist = dist;
          closestPoint = { x: ix, y: iy };
        }
      }
    }

    if (closestPoint) {
      setSelectedPoint(closestPoint);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedPoint) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { width, height } = display.size;

    // Обновить offset точки
    const newGrid = JSON.parse(JSON.stringify(warpGrid));
    const point = newGrid.points[selectedPoint.y][selectedPoint.x];

    const targetX = x / width;
    const targetY = y / height;

    point.offsetX = (targetX - point.x) * width;
    point.offsetY = (targetY - point.y) * height;

    onUpdate(newGrid);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="warp-grid-editor">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}

// === TEST PATTERN VIEWER ===

function TestPatternViewer({ patternType, display }) {
  const { gl, scene, camera } = useThree();
  const patternRef = useRef(null);

  useEffect(() => {
    if (!patternType) return;

    const pattern = TestPatternFactory.create(patternType);
    patternRef.current = pattern;

    return () => {
      if (patternRef.current) {
        patternRef.current.getScene().clear();
      }
    };
  }, [patternType]);

  useFrame(() => {
    if (patternRef.current && patternRef.current.update) {
      patternRef.current.update();
    }

    if (patternRef.current) {
      gl.render(patternRef.current.getScene(), patternRef.current.getCamera());
    }
  });

  return null;
}

// === MAIN CALIBRATION COMPONENT ===

export default function Calibration() {
  const [manager] = useState(() => new MultiDisplayManager());
  const [displays, setDisplays] = useState([]);
  const [selectedDisplay, setSelectedDisplay] = useState(null);
  const [venueProfile, setVenueProfile] = useState(null);

  const [warpGrid, setWarpGrid] = useState(null);
  const [testPattern, setTestPattern] = useState("geometry_grid");

  const [calibration, setCalibration] = useState({
    brightness: 1.0,
    contrast: 1.0,
    gamma: 2.2,
    whitePoint: { r: 1.0, g: 1.0, b: 1.0 },
    blackLevel: { r: 0.0, g: 0.0, b: 0.0 },
  });

  const [venueList, setVenueList] = useState([
    "default_venue",
    "triple_wall_projection",
  ]);

  useEffect(() => {
    const loadedDisplays = manager.getDisplays();
    setDisplays(loadedDisplays);

    if (loadedDisplays.length > 0) {
      setSelectedDisplay(loadedDisplays[0]);
    }
  }, [manager]);

  // Загрузить venue profile
  const loadVenue = async (venueId) => {
    try {
      const profile = await manager.loadVenueProfile(venueId);
      setVenueProfile(profile);
      setCalibration(profile.calibration);

      if (profile.displays.length > 0) {
        const display = profile.displays[0];
        setSelectedDisplay(display);
        setWarpGrid(profile.geometry.warpGrid);
      }
    } catch (error) {
      console.error("Failed to load venue:", error);
      alert("Failed to load venue profile");
    }
  };

  // Сохранить venue profile
  const saveVenue = async () => {
    if (!venueProfile) return;

    const updatedProfile = {
      ...venueProfile,
      calibration,
      geometry: {
        ...venueProfile.geometry,
        warpGrid,
      },
    };

    try {
      await manager.saveVenueProfile(updatedProfile);
      alert("Venue profile saved!");
    } catch (error) {
      console.error("Failed to save venue:", error);
      alert("Failed to save venue profile");
    }
  };

  // Gamma presets
  const applyGammaPreset = (gamma) => {
    setCalibration({ ...calibration, gamma });
  };

  // White point presets
  const applyWhitePointPreset = (preset) => {
    const presets = {
      D65: { r: 0.95, g: 1.0, b: 1.09 }, // 6500K (daylight)
      D50: { r: 1.0, g: 0.97, b: 0.87 }, // 5000K (warm)
      D75: { r: 0.94, g: 0.99, b: 1.12 }, // 7500K (cool)
    };

    setCalibration({ ...calibration, whitePoint: presets[preset] });
  };

  // Reset warp grid
  const resetWarpGrid = () => {
    if (!warpGrid) return;

    const newGrid = {
      rows: warpGrid.rows,
      cols: warpGrid.cols,
      points: [],
    };

    for (let y = 0; y < warpGrid.rows; y++) {
      const row = [];
      for (let x = 0; x < warpGrid.cols; x++) {
        row.push({
          x: x / (warpGrid.cols - 1),
          y: y / (warpGrid.rows - 1),
          offsetX: 0,
          offsetY: 0,
        });
      }
      newGrid.points.push(row);
    }

    setWarpGrid(newGrid);
  };

  return (
    <div className="calibration-screen">
      <div className="calibration-sidebar">
        <h1>🎯 Calibration</h1>

        {/* Venue Profiles */}
        <section className="calibration-section">
          <h2>Venue Profiles</h2>
          <select onChange={(e) => loadVenue(e.target.value)} defaultValue="">
            <option value="" disabled>
              Load venue...
            </option>
            {venueList.map((venue) => (
              <option key={venue} value={venue}>
                {venue}
              </option>
            ))}
          </select>
          <button onClick={saveVenue} disabled={!venueProfile}>
            Save Current Profile
          </button>
        </section>

        {/* Display Selection */}
        <section className="calibration-section">
          <h2>Display</h2>
          <select
            value={selectedDisplay?.id || ""}
            onChange={(e) => {
              const display = displays.find((d) => d.id === e.target.value);
              setSelectedDisplay(display);
            }}
          >
            {displays.map((display) => (
              <option key={display.id} value={display.id}>
                {display.name}
              </option>
            ))}
          </select>
          {selectedDisplay && (
            <div className="display-info">
              <p>
                Size: {selectedDisplay.size.width} ×{" "}
                {selectedDisplay.size.height}
              </p>
              <p>Position: {selectedDisplay.position}</p>
            </div>
          )}
        </section>

        {/* Test Patterns */}
        <section className="calibration-section">
          <h2>Test Patterns</h2>
          <div className="test-pattern-grid">
            <button onClick={() => setTestPattern("color_bars")}>
              Color Bars
            </button>
            <button onClick={() => setTestPattern("ramp_horizontal")}>
              H Ramp
            </button>
            <button onClick={() => setTestPattern("ramp_vertical")}>
              V Ramp
            </button>
            <button onClick={() => setTestPattern("ramp_diagonal")}>
              Diag Ramp
            </button>
            <button onClick={() => setTestPattern("geometry_grid")}>
              Grid
            </button>
            <button onClick={() => setTestPattern("crosshatch")}>
              Crosshatch
            </button>
            <button onClick={() => setTestPattern("checkerboard")}>
              Checkerboard
            </button>
            <button onClick={() => setTestPattern("uv_pulse")}>UV Pulse</button>
            <button onClick={() => setTestPattern("bloom_sweep")}>
              Bloom Sweep
            </button>
            <button onClick={() => setTestPattern("white")}>White</button>
            <button onClick={() => setTestPattern("black")}>Black</button>
          </div>
        </section>

        {/* Color Calibration */}
        <section className="calibration-section">
          <h2>Color Calibration</h2>

          <div className="calibration-control">
            <label>Brightness</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={calibration.brightness}
              onChange={(e) =>
                setCalibration({
                  ...calibration,
                  brightness: parseFloat(e.target.value),
                })
              }
            />
            <span>{calibration.brightness.toFixed(2)}</span>
          </div>

          <div className="calibration-control">
            <label>Contrast</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={calibration.contrast}
              onChange={(e) =>
                setCalibration({
                  ...calibration,
                  contrast: parseFloat(e.target.value),
                })
              }
            />
            <span>{calibration.contrast.toFixed(2)}</span>
          </div>

          <div className="calibration-control">
            <label>Gamma</label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={calibration.gamma}
              onChange={(e) =>
                setCalibration({
                  ...calibration,
                  gamma: parseFloat(e.target.value),
                })
              }
            />
            <span>{calibration.gamma.toFixed(1)}</span>
          </div>

          <div className="preset-buttons">
            <button onClick={() => applyGammaPreset(2.2)}>γ 2.2 (sRGB)</button>
            <button onClick={() => applyGammaPreset(2.4)}>
              γ 2.4 (Cinema)
            </button>
            <button onClick={() => applyGammaPreset(1.8)}>γ 1.8 (Mac)</button>
          </div>

          <h3>White Point</h3>
          <div className="preset-buttons">
            <button onClick={() => applyWhitePointPreset("D65")}>
              D65 (6500K)
            </button>
            <button onClick={() => applyWhitePointPreset("D50")}>
              D50 (5000K)
            </button>
            <button onClick={() => applyWhitePointPreset("D75")}>
              D75 (7500K)
            </button>
          </div>

          <div className="calibration-control">
            <label>White R</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              value={calibration.whitePoint.r}
              onChange={(e) =>
                setCalibration({
                  ...calibration,
                  whitePoint: {
                    ...calibration.whitePoint,
                    r: parseFloat(e.target.value),
                  },
                })
              }
            />
            <span>{calibration.whitePoint.r.toFixed(2)}</span>
          </div>

          <div className="calibration-control">
            <label>White G</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              value={calibration.whitePoint.g}
              onChange={(e) =>
                setCalibration({
                  ...calibration,
                  whitePoint: {
                    ...calibration.whitePoint,
                    g: parseFloat(e.target.value),
                  },
                })
              }
            />
            <span>{calibration.whitePoint.g.toFixed(2)}</span>
          </div>

          <div className="calibration-control">
            <label>White B</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.01"
              value={calibration.whitePoint.b}
              onChange={(e) =>
                setCalibration({
                  ...calibration,
                  whitePoint: {
                    ...calibration.whitePoint,
                    b: parseFloat(e.target.value),
                  },
                })
              }
            />
            <span>{calibration.whitePoint.b.toFixed(2)}</span>
          </div>
        </section>

        {/* Geometry Correction */}
        <section className="calibration-section">
          <h2>Geometry Correction</h2>
          <button onClick={resetWarpGrid}>Reset Warp Grid</button>
          <p className="hint">
            Drag control points to adjust geometry.
            <br />
            Red corners = keystone.
          </p>
        </section>
      </div>

      <div className="calibration-viewport">
        {testPattern && selectedDisplay ? (
          <div className="calibration-canvas">
            {/* Warp Grid Editor Overlay */}
            {warpGrid && testPattern === "geometry_grid" && (
              <WarpGridEditor
                warpGrid={warpGrid}
                onUpdate={setWarpGrid}
                display={selectedDisplay}
              />
            )}

            {/* 3D Test Pattern */}
            <Canvas
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: testPattern === "geometry_grid" ? 0 : 1,
              }}
            >
              <TestPatternViewer
                patternType={testPattern}
                display={selectedDisplay}
              />
            </Canvas>
          </div>
        ) : (
          <div className="calibration-placeholder">
            <p>Select a test pattern to begin calibration</p>
          </div>
        )}
      </div>
    </div>
  );
}
