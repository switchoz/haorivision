/**
 * 💡 ART-NET GATEWAY
 *
 * Art-Net/DMX gateway для управления светом
 * - Конвертация DMX512 в Art-Net протокол
 * - WebSocket bridge для frontend
 * - Universe management (512 channels)
 */

import dgram from "dgram";
import { WebSocketServer } from "ws";

const ARTNET_PORT = 6454;
const WEBSOCKET_PORT = 8081;
const ARTNET_HEADER = Buffer.from([
  0x41,
  0x72,
  0x74,
  0x2d,
  0x4e,
  0x65,
  0x74,
  0x00, // "Art-Net\0"
  0x00,
  0x50, // OpCode: OpDmx
  0x00,
  0x0e, // Protocol version
  0x00, // Sequence
  0x00, // Physical
  0x00,
  0x00, // Universe (low byte, high byte)
]);

class ArtNetGateway {
  constructor() {
    this.udpSocket = null;
    this.wsServer = null;
    this.wsClients = new Set();

    // DMX universe state (512 channels)
    this.dmxUniverse = new Uint8Array(512);
    this.dmxUniverse.fill(0);

    this.targetIP = "127.0.0.1"; // Localhost по умолчанию
    this.targetPort = ARTNET_PORT;
  }

  start() {
    // UDP socket для Art-Net
    this.udpSocket = dgram.createSocket("udp4");

    this.udpSocket.on("error", (error) => {
      console.error("[Art-Net] UDP error:", error);
    });

    console.log(
      "╔═══════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                                                           ║",
    );
    console.log(
      "║        HAORI VISION — ART-NET GATEWAY                     ║",
    );
    console.log(
      "║                                                           ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════╝",
    );
    console.log("");
    console.log(`[◇] Art-Net Target: ${this.targetIP}:${this.targetPort}`);
    console.log(`[◆] WebSocket Server: ws://localhost:${WEBSOCKET_PORT}`);
    console.log("");

    // WebSocket server для frontend
    this.wsServer = new WebSocketServer({ port: WEBSOCKET_PORT });

    this.wsServer.on("connection", (ws) => {
      console.log("[+] Frontend DMX client connected");
      this.wsClients.add(ws);

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          this.handleDMXCommand(data);
        } catch (error) {
          console.error("[Art-Net] Failed to parse message:", error);
        }
      });

      ws.on("close", () => {
        console.log("[-] Frontend DMX client disconnected");
        this.wsClients.delete(ws);
      });

      // Отправить текущее состояние
      ws.send(
        JSON.stringify({
          type: "state",
          universe: Array.from(this.dmxUniverse),
        }),
      );
    });

    console.log("[✓] Art-Net Gateway started");
    console.log("");
    console.log("Waiting for DMX commands...");
    console.log("");
  }

  handleDMXCommand(command) {
    const { type, data } = command;

    switch (type) {
      case "set_channel":
        this.setChannel(data.channel, data.value);
        break;

      case "set_channels":
        this.setChannels(data.channels);
        break;

      case "blackout":
        this.blackout();
        break;

      case "set_fixture":
        this.setFixture(data.fixture, data.values);
        break;

      default:
        console.warn("[Art-Net] Unknown command:", type);
    }
  }

  setChannel(channel, value) {
    if (channel < 1 || channel > 512) {
      console.warn(`[Art-Net] Invalid channel: ${channel}`);
      return;
    }

    this.dmxUniverse[channel - 1] = Math.max(0, Math.min(255, value));
    this.sendArtNet();
  }

  setChannels(channels) {
    for (const [channel, value] of Object.entries(channels)) {
      const ch = parseInt(channel);
      if (ch >= 1 && ch <= 512) {
        this.dmxUniverse[ch - 1] = Math.max(0, Math.min(255, value));
      }
    }

    this.sendArtNet();
  }

  setFixture(fixture, values) {
    // Fixture mapping (example)
    const fixtureMap = {
      uv_main: { start: 1, channels: 3 }, // DMX 1-3: R, G, B
      rgb_accent: { start: 4, channels: 4 }, // DMX 4-7: R, G, B, Intensity
      moving_head: { start: 8, channels: 8 }, // DMX 8-15: Pan, Tilt, ...
    };

    const mapping = fixtureMap[fixture];

    if (!mapping) {
      console.warn(`[Art-Net] Unknown fixture: ${fixture}`);
      return;
    }

    for (let i = 0; i < values.length && i < mapping.channels; i++) {
      this.dmxUniverse[mapping.start + i - 1] = Math.max(
        0,
        Math.min(255, values[i]),
      );
    }

    this.sendArtNet();
    console.log(`[◆] Fixture updated: ${fixture}`);
  }

  blackout() {
    this.dmxUniverse.fill(0);
    this.sendArtNet();
    console.log("[■] Blackout activated");
  }

  sendArtNet() {
    // Create Art-Net packet
    const packet = Buffer.concat([
      ARTNET_HEADER,
      Buffer.from([
        (this.dmxUniverse.length >> 8) & 0xff, // Length high byte
        this.dmxUniverse.length & 0xff, // Length low byte
      ]),
      Buffer.from(this.dmxUniverse),
    ]);

    // Send UDP
    this.udpSocket.send(packet, this.targetPort, this.targetIP, (error) => {
      if (error) {
        console.error("[Art-Net] Send failed:", error);
      }
    });

    // Broadcast to WebSocket clients
    const state = {
      type: "universe_update",
      timestamp: Date.now(),
    };

    this.wsClients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(state));
      }
    });
  }

  setTargetIP(ip) {
    this.targetIP = ip;
    console.log(`[◇] Art-Net target changed to: ${ip}`);
  }

  stop() {
    if (this.wsServer) {
      this.wsServer.close();
    }

    if (this.udpSocket) {
      this.udpSocket.close();
    }

    console.log("[✓] Art-Net Gateway stopped");
  }
}

// Start gateway
const gateway = new ArtNetGateway();
gateway.start();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[!] Shutting down Art-Net Gateway...");
  gateway.stop();
  process.exit(0);
});

export default ArtNetGateway;
