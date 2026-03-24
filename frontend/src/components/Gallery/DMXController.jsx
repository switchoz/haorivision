import { useEffect, useRef, useState, useCallback } from "react";

/**
 * 💡 DMX / ART-NET CONTROLLER
 *
 * Управление сценическим светом через DMX512 / Art-Net протокол
 * Поддержка UV-светильников, RGB fixtures и движущихся головок
 */

// DMX Universe конфигурация
const DMX_UNIVERSE_SIZE = 512;

// Типы светильников
export const FIXTURE_TYPES = {
  UV_PAR: "UV_PAR", // UV прожектор
  RGB_PAR: "RGB_PAR", // RGB прожектор
  MOVING_HEAD: "MOVING_HEAD", // Движущаяся голова
  STROBE: "STROBE", // Стробоскоп
  LED_STRIP: "LED_STRIP", // LED лента
};

// Предустановленные fixtures
const DEFAULT_FIXTURES = [
  // UV прожекторы для основного свечения
  { id: 1, type: FIXTURE_TYPES.UV_PAR, address: 1, name: "UV Front Center" },
  { id: 2, type: FIXTURE_TYPES.UV_PAR, address: 2, name: "UV Front Left" },
  { id: 3, type: FIXTURE_TYPES.UV_PAR, address: 3, name: "UV Front Right" },
  { id: 4, type: FIXTURE_TYPES.UV_PAR, address: 4, name: "UV Back Center" },

  // RGB прожекторы для цветных акцентов
  { id: 5, type: FIXTURE_TYPES.RGB_PAR, address: 10, name: "RGB Left" },
  { id: 6, type: FIXTURE_TYPES.RGB_PAR, address: 14, name: "RGB Right" },
  { id: 7, type: FIXTURE_TYPES.RGB_PAR, address: 18, name: "RGB Top" },

  // Движущиеся головки для динамики
  { id: 8, type: FIXTURE_TYPES.MOVING_HEAD, address: 30, name: "MH1" },
  { id: 9, type: FIXTURE_TYPES.MOVING_HEAD, address: 50, name: "MH2" },
];

// Каналы для разных типов светильников
const FIXTURE_CHANNELS = {
  [FIXTURE_TYPES.UV_PAR]: {
    dimmer: 0, // 1 канал - интенсивность
  },
  [FIXTURE_TYPES.RGB_PAR]: {
    red: 0, // R
    green: 1, // G
    blue: 2, // B
    dimmer: 3, // Общая яркость
  },
  [FIXTURE_TYPES.MOVING_HEAD]: {
    pan: 0, // Поворот горизонтально
    panFine: 1, // Точная настройка pan
    tilt: 2, // Поворот вертикально
    tiltFine: 3, // Точная настройка tilt
    red: 4,
    green: 5,
    blue: 6,
    white: 7,
    dimmer: 8,
    strobe: 9,
    gobo: 10,
  },
  [FIXTURE_TYPES.STROBE]: {
    dimmer: 0,
    speed: 1,
  },
  [FIXTURE_TYPES.LED_STRIP]: {
    red: 0,
    green: 1,
    blue: 2,
    mode: 3,
  },
};

class DMXController {
  constructor() {
    this.universe = new Uint8Array(DMX_UNIVERSE_SIZE);
    this.fixtures = DEFAULT_FIXTURES;
    this.artNetSocket = null;
    this.isConnected = false;
    this.updateCallbacks = [];
  }

  // Подключение к Art-Net ноде
  async connectArtNet(ip = "127.0.0.1", port = 6454) {
    try {
      // В браузере прямого UDP нет, используем WebSocket прокси
      // или HTTP API к серверу с node-artnet
      const response = await fetch(`/api/dmx/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, port }),
      });

      const data = await response.json();

      if (data.success) {
        this.isConnected = true;
        if (import.meta.env.DEV) console.log("[◇] DMX Art-Net connected:", ip);
        return true;
      }
    } catch (error) {
      console.warn(
        "[!] DMX connection failed (running in simulation mode):",
        error.message,
      );
      this.isConnected = false;
      return false;
    }
  }

  // Отключение
  disconnect() {
    if (this.artNetSocket) {
      this.artNetSocket.close();
      this.isConnected = false;
      if (import.meta.env.DEV) console.log("[◇] DMX disconnected");
    }
  }

  // Установка значения канала
  setChannel(channel, value) {
    if (channel < 1 || channel > DMX_UNIVERSE_SIZE) {
      console.warn(`[!] Invalid DMX channel: ${channel}`);
      return;
    }

    // Клампим значение 0-255
    this.universe[channel - 1] = Math.max(0, Math.min(255, Math.floor(value)));
  }

  // Получение значения канала
  getChannel(channel) {
    if (channel < 1 || channel > DMX_UNIVERSE_SIZE) return 0;
    return this.universe[channel - 1];
  }

  // Управление конкретным светильником
  setFixture(fixtureId, params) {
    const fixture = this.fixtures.find((f) => f.id === fixtureId);
    if (!fixture) {
      console.warn(`[!] Fixture not found: ${fixtureId}`);
      return;
    }

    const channels = FIXTURE_CHANNELS[fixture.type];
    const baseAddress = fixture.address;

    // Устанавливаем параметры в зависимости от типа
    switch (fixture.type) {
      case FIXTURE_TYPES.UV_PAR:
        if (params.dimmer !== undefined) {
          this.setChannel(baseAddress + channels.dimmer, params.dimmer);
        }
        break;

      case FIXTURE_TYPES.RGB_PAR:
        if (params.red !== undefined) {
          this.setChannel(baseAddress + channels.red, params.red);
        }
        if (params.green !== undefined) {
          this.setChannel(baseAddress + channels.green, params.green);
        }
        if (params.blue !== undefined) {
          this.setChannel(baseAddress + channels.blue, params.blue);
        }
        if (params.dimmer !== undefined) {
          this.setChannel(baseAddress + channels.dimmer, params.dimmer);
        }
        break;

      case FIXTURE_TYPES.MOVING_HEAD:
        if (params.pan !== undefined) {
          const panValue = Math.floor((params.pan / 360) * 65535);
          this.setChannel(baseAddress + channels.pan, panValue >> 8);
          this.setChannel(baseAddress + channels.panFine, panValue & 0xff);
        }
        if (params.tilt !== undefined) {
          const tiltValue = Math.floor((params.tilt / 360) * 65535);
          this.setChannel(baseAddress + channels.tilt, tiltValue >> 8);
          this.setChannel(baseAddress + channels.tiltFine, tiltValue & 0xff);
        }
        if (params.red !== undefined) {
          this.setChannel(baseAddress + channels.red, params.red);
        }
        if (params.green !== undefined) {
          this.setChannel(baseAddress + channels.green, params.green);
        }
        if (params.blue !== undefined) {
          this.setChannel(baseAddress + channels.blue, params.blue);
        }
        if (params.white !== undefined) {
          this.setChannel(baseAddress + channels.white, params.white);
        }
        if (params.dimmer !== undefined) {
          this.setChannel(baseAddress + channels.dimmer, params.dimmer);
        }
        if (params.strobe !== undefined) {
          this.setChannel(baseAddress + channels.strobe, params.strobe);
        }
        break;
    }

    this.sendUpdate();
  }

  // Отправка обновления universe
  async sendUpdate() {
    // Вызываем колбеки для визуализации
    this.updateCallbacks.forEach((cb) => cb(this.universe));

    if (!this.isConnected) return;

    try {
      await fetch("/api/dmx/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universe: Array.from(this.universe),
        }),
      });
    } catch (error) {
      // Тихо игнорируем если сервер недоступен
    }
  }

  // Регистрация колбека на обновление
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  // Blackout - всё выключить
  blackout() {
    this.universe.fill(0);
    this.sendUpdate();
  }

  // UV паттерны
  uvBreathingPattern(intensity = 255, speed = 2.0) {
    const time = Date.now() / 1000;
    const breath = (Math.sin(time * speed) * 0.5 + 0.5) * intensity;

    // Все UV светильники
    this.fixtures
      .filter((f) => f.type === FIXTURE_TYPES.UV_PAR)
      .forEach((fixture) => {
        this.setFixture(fixture.id, { dimmer: breath });
      });

    this.sendUpdate();
  }

  // RGB цветовая схема по коллекции
  applyCollectionPalette(palette) {
    if (!palette || !palette.colors) return;

    // Берём основные цвета из палитры
    const colors = palette.colors.map(hexToRgb);

    // Назначаем цвета RGB светильникам
    const rgbFixtures = this.fixtures.filter(
      (f) => f.type === FIXTURE_TYPES.RGB_PAR,
    );

    rgbFixtures.forEach((fixture, index) => {
      const color = colors[index % colors.length];
      this.setFixture(fixture.id, {
        red: color.r,
        green: color.g,
        blue: color.b,
        dimmer: 255,
      });
    });

    this.sendUpdate();
  }

  // Сценические эффекты
  sceneEffect(effectName, params = {}) {
    switch (effectName) {
      case "opening":
        // Плавное появление UV света
        this.fadeInUV(params.duration || 5);
        break;

      case "showcase":
        // Вращающиеся головки + RGB акценты
        this.movingHeadsSweep(params.speed || 1);
        break;

      case "finale":
        // Полный свет + стробоскопы
        this.fullIntensity();
        break;

      case "blackout":
        this.blackout();
        break;

      default:
        console.warn(`[!] Unknown scene effect: ${effectName}`);
    }
  }

  // Fade In UV света
  fadeInUV(duration = 5) {
    const steps = 50;
    const stepDuration = (duration * 1000) / steps;

    let step = 0;
    const interval = setInterval(() => {
      const intensity = (step / steps) * 255;

      this.fixtures
        .filter((f) => f.type === FIXTURE_TYPES.UV_PAR)
        .forEach((fixture) => {
          this.setFixture(fixture.id, { dimmer: intensity });
        });

      step++;
      if (step >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);
  }

  // Sweep движущихся голов
  movingHeadsSweep(speed = 1) {
    const movingHeads = this.fixtures.filter(
      (f) => f.type === FIXTURE_TYPES.MOVING_HEAD,
    );

    let angle = 0;
    const interval = setInterval(() => {
      movingHeads.forEach((fixture, index) => {
        const offset = (index / movingHeads.length) * 360;
        this.setFixture(fixture.id, {
          pan: (angle + offset) % 360,
          tilt: 45,
          dimmer: 255,
        });
      });

      angle = (angle + speed * 2) % 360;
    }, 50);

    return () => clearInterval(interval);
  }

  // Полная интенсивность
  fullIntensity() {
    this.fixtures.forEach((fixture) => {
      if (fixture.type === FIXTURE_TYPES.UV_PAR) {
        this.setFixture(fixture.id, { dimmer: 255 });
      } else if (fixture.type === FIXTURE_TYPES.RGB_PAR) {
        this.setFixture(fixture.id, {
          red: 255,
          green: 255,
          blue: 255,
          dimmer: 255,
        });
      }
    });

    this.sendUpdate();
  }
}

// Утилита: hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// React Hook для использования DMX
export function useDMX() {
  const [controller] = useState(() => new DMXController());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Попытка подключиться при монтировании
    controller.connectArtNet().then(setIsConnected);

    return () => {
      controller.disconnect();
    };
  }, [controller]);

  return {
    controller,
    isConnected,
  };
}

// React компонент для контроля DMX
export default function DMXControlPanel({ controller }) {
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [universeView, setUniverseView] = useState(
    new Uint8Array(DMX_UNIVERSE_SIZE),
  );

  useEffect(() => {
    if (!controller) return;

    const unsubscribe = controller.onUpdate((universe) => {
      setUniverseView(new Uint8Array(universe));
    });

    return unsubscribe;
  }, [controller]);

  if (!controller) return null;

  return (
    <div className="fixed left-8 top-24 z-10 w-80 glass-luxury rounded-2xl p-6 max-h-[70vh] overflow-y-auto">
      <h3 className="text-xl font-bold gradient-text mb-4">DMX Controller</h3>

      {/* Connection Status */}
      <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${controller.isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
          />
          <span className="text-white text-sm">
            {controller.isConnected ? "Art-Net Connected" : "Simulation Mode"}
          </span>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm mb-2">Quick Controls</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => controller.blackout()}
            className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-all"
          >
            Blackout
          </button>
          <button
            onClick={() => controller.fullIntensity()}
            className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm transition-all"
          >
            Full Intensity
          </button>
        </div>
      </div>

      {/* Fixtures List */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm mb-2">Fixtures</p>
        <div className="space-y-1">
          {controller.fixtures.map((fixture) => (
            <button
              key={fixture.id}
              onClick={() => setSelectedFixture(fixture)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                selectedFixture?.id === fixture.id
                  ? "bg-[#FF10F0]/20 text-[#FF10F0]"
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{fixture.name}</span>
                <span className="text-xs text-gray-400">
                  Ch {fixture.address}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Fixture Control */}
      {selectedFixture && (
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-white font-semibold mb-2">
            {selectedFixture.name}
          </p>

          {selectedFixture.type === FIXTURE_TYPES.UV_PAR && (
            <div>
              <label className="text-gray-400 text-xs">Dimmer</label>
              <input
                type="range"
                min="0"
                max="255"
                onChange={(e) =>
                  controller.setFixture(selectedFixture.id, {
                    dimmer: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>
          )}

          {selectedFixture.type === FIXTURE_TYPES.RGB_PAR && (
            <div className="space-y-2">
              <div>
                <label className="text-red-400 text-xs">Red</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  onChange={(e) =>
                    controller.setFixture(selectedFixture.id, {
                      red: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-green-400 text-xs">Green</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  onChange={(e) =>
                    controller.setFixture(selectedFixture.id, {
                      green: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-blue-400 text-xs">Blue</label>
                <input
                  type="range"
                  min="0"
                  max="255"
                  onChange={(e) =>
                    controller.setFixture(selectedFixture.id, {
                      blue: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { DMXController };
