/**
 * 🔄 WEBSOCKET SYNC SERVER
 *
 * Синхронизация между несколькими клиентами для multi-display шоу
 * - Frame sync (RAF loop sync)
 * - Scene changes
 * - Timecode sync
 * - Calibration data broadcast
 */

import { WebSocketServer } from "ws";

class SyncServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
    this.masterClient = null;

    // State
    this.currentFrame = 0;
    this.currentScene = null;
    this.timecode = { hours: 0, minutes: 0, seconds: 0, frames: 0 };
    this.isPlaying = false;
  }

  start() {
    this.wss = new WebSocketServer({ port: this.port });

    console.log(
      `[◇] WebSocket Sync Server started on ws://localhost:${this.port}`,
    );

    this.wss.on("connection", (ws, req) => {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(
        `[+] Client connected: ${clientId} (${req.socket.remoteAddress})`,
      );

      ws.clientId = clientId;
      this.clients.add(ws);

      // Если это первый клиент — он становится master
      if (!this.masterClient) {
        this.masterClient = ws;
        ws.isMaster = true;

        ws.send(
          JSON.stringify({
            type: "role",
            role: "master",
            clientId,
          }),
        );

        console.log(`[★] ${clientId} is now MASTER`);
      } else {
        ws.isMaster = false;

        ws.send(
          JSON.stringify({
            type: "role",
            role: "slave",
            clientId,
            masterId: this.masterClient.clientId,
          }),
        );

        // Отправить текущее состояние новому клиенту
        ws.send(
          JSON.stringify({
            type: "state",
            data: {
              currentFrame: this.currentFrame,
              currentScene: this.currentScene,
              timecode: this.timecode,
              isPlaying: this.isPlaying,
            },
          }),
        );
      }

      // Обработка сообщений
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      });

      // Отключение клиента
      ws.on("close", () => {
        console.log(`[-] Client disconnected: ${clientId}`);
        this.clients.delete(ws);

        // Если отключился master — выбрать нового
        if (ws === this.masterClient) {
          this.masterClient = null;

          if (this.clients.size > 0) {
            const newMaster = Array.from(this.clients)[0];
            this.masterClient = newMaster;
            newMaster.isMaster = true;

            newMaster.send(
              JSON.stringify({
                type: "role",
                role: "master",
                clientId: newMaster.clientId,
              }),
            );

            console.log(`[★] ${newMaster.clientId} is now MASTER`);

            // Уведомить остальных
            this.broadcast(
              {
                type: "master_changed",
                masterId: newMaster.clientId,
              },
              newMaster,
            );
          }
        }
      });

      ws.on("error", (error) => {
        console.error(`[WebSocket] Error from ${clientId}:`, error);
      });
    });
  }

  handleMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case "frame":
        // Синхронизация кадра (только от master)
        if (ws.isMaster) {
          this.currentFrame = data.frame;
          this.broadcast({ type: "frame", data }, ws);
        }
        break;

      case "scene":
        // Смена сцены (только от master)
        if (ws.isMaster) {
          this.currentScene = data;
          this.broadcast({ type: "scene", data }, ws);
          console.log(`[◆] Scene changed: ${data.id || data.name}`);
        }
        break;

      case "timecode":
        // Синхронизация таймкода (только от master)
        if (ws.isMaster) {
          this.timecode = data;
          this.broadcast({ type: "timecode", data }, ws);
        }
        break;

      case "play":
        // Запуск шоу (только от master)
        if (ws.isMaster) {
          this.isPlaying = true;
          this.broadcast({ type: "play", data }, ws);
          console.log("[▸] Show started");
        }
        break;

      case "pause":
        // Пауза (только от master)
        if (ws.isMaster) {
          this.isPlaying = false;
          this.broadcast({ type: "pause", data }, ws);
          console.log("[▮▮] Show paused");
        }
        break;

      case "stop":
        // Остановка (только от master)
        if (ws.isMaster) {
          this.isPlaying = false;
          this.currentFrame = 0;
          this.broadcast({ type: "stop", data }, ws);
          console.log("[■] Show stopped");
        }
        break;

      case "seek":
        // Seek (только от master)
        if (ws.isMaster) {
          this.currentFrame = data.frame;
          this.broadcast({ type: "seek", data }, ws);
          console.log(`[→] Seek to frame ${data.frame}`);
        }
        break;

      case "calibration":
        // Калибровочные данные (broadcast всем)
        this.broadcast({ type: "calibration", data }, ws);
        console.log("[🎯] Calibration data broadcast");
        break;

      case "ping":
        // Heartbeat
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        break;

      default:
        console.warn(`[WebSocket] Unknown message type: ${type}`);
    }
  }

  /**
   * Broadcast сообщения всем клиентам (кроме отправителя)
   */
  broadcast(message, excludeClient = null) {
    const messageStr = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client !== excludeClient && client.readyState === 1) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Broadcast сообщения ВСЕМ клиентам (включая отправителя)
   */
  broadcastAll(message) {
    const messageStr = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Получить статистику
   */
  getStats() {
    return {
      port: this.port,
      connectedClients: this.clients.size,
      masterClientId: this.masterClient?.clientId || null,
      currentFrame: this.currentFrame,
      currentScene: this.currentScene,
      isPlaying: this.isPlaying,
      timecode: this.timecode,
    };
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      console.log("[✓] WebSocket Sync Server stopped");
    }
  }
}

// Запустить server при прямом запуске
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SyncServer(8080);
  server.start();

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n[!] Shutting down...");
    server.stop();
    process.exit(0);
  });
}

export default SyncServer;
