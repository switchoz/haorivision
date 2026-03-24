import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CRM Service
 * Управление клиентами и их взаимодействиями
 */

class CRMService {
  constructor() {
    this.db = null;
    this.init();
  }

  /**
   * Инициализировать базу данных
   */
  async init() {
    try {
      const dbPath = path.join(__dirname, "../../data/clients.db");

      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      // Создать таблицы
      await this.createTables();

      console.log("✅ CRM Database initialized");
    } catch (error) {
      console.error("CRM Database init error:", error);
    }
  }

  /**
   * Создать таблицы
   */
  async createTables() {
    // Таблица клиентов
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        telegram TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT,
        status TEXT DEFAULT 'lead',
        vip_tier TEXT DEFAULT 'standard',
        total_spent REAL DEFAULT 0,
        notes TEXT
      )
    `);

    // Таблица взаимодействий
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        type TEXT,
        intent TEXT,
        message TEXT,
        response TEXT,
        products_mentioned TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    // Таблица интересов клиентов
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS client_interests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        collection TEXT,
        colors TEXT,
        style TEXT,
        budget_min REAL,
        budget_max REAL,
        priority INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    // Таблица консультаций
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        scheduled_at DATETIME,
        duration INTEGER DEFAULT 30,
        type TEXT,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `);

    // Таблица лидов (потенциальные клиенты)
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE,
        name TEXT,
        email TEXT,
        interests TEXT,
        last_message TEXT,
        intent TEXT,
        stage TEXT DEFAULT 'awareness',
        score INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Создать или обновить лид из анонимной сессии
   */
  async createOrUpdateLead(sessionId, data) {
    try {
      const existing = await this.db.get(
        "SELECT * FROM leads WHERE session_id = ?",
        [sessionId],
      );

      if (existing) {
        // Обновить существующий лид
        await this.db.run(
          `
          UPDATE leads
          SET name = COALESCE(?, name),
              email = COALESCE(?, email),
              interests = ?,
              last_message = ?,
              intent = ?,
              stage = ?,
              score = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE session_id = ?
        `,
          [
            data.name || null,
            data.email || null,
            JSON.stringify(data.interests || {}),
            data.lastMessage,
            data.intent,
            data.stage || existing.stage,
            data.score || existing.score,
            sessionId,
          ],
        );

        return { id: existing.id, isNew: false };
      } else {
        // Создать новый лид
        const result = await this.db.run(
          `
          INSERT INTO leads (session_id, name, email, interests, last_message, intent, stage, score)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            sessionId,
            data.name || null,
            data.email || null,
            JSON.stringify(data.interests || {}),
            data.lastMessage,
            data.intent,
            data.stage || "awareness",
            data.score || 0,
          ],
        );

        return { id: result.lastID, isNew: true };
      }
    } catch (error) {
      console.error("Create/update lead error:", error);
      throw error;
    }
  }

  /**
   * Конвертировать лид в клиента
   */
  async convertLeadToClient(sessionId, clientData) {
    try {
      const lead = await this.db.get(
        "SELECT * FROM leads WHERE session_id = ?",
        [sessionId],
      );

      if (!lead) {
        throw new Error("Lead not found");
      }

      // Создать клиента
      const result = await this.db.run(
        `
        INSERT INTO clients (name, email, phone, telegram, source, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          clientData.name || lead.name,
          clientData.email || lead.email,
          clientData.phone || null,
          clientData.telegram || null,
          "assistant",
          "active",
          `Converted from lead. Original intent: ${lead.intent}`,
        ],
      );

      const clientId = result.lastID;

      // Перенести интересы
      if (lead.interests) {
        const interests = JSON.parse(lead.interests);
        await this.saveClientInterests(clientId, interests);
      }

      // Удалить лид
      await this.db.run("DELETE FROM leads WHERE session_id = ?", [sessionId]);

      return { clientId, converted: true };
    } catch (error) {
      console.error("Convert lead error:", error);
      throw error;
    }
  }

  /**
   * Записать взаимодействие
   */
  async logInteraction(clientId, interaction) {
    try {
      await this.db.run(
        `
        INSERT INTO interactions (client_id, type, intent, message, response, products_mentioned)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          clientId,
          interaction.type || "chat",
          interaction.intent,
          interaction.message,
          interaction.response,
          JSON.stringify(interaction.products || []),
        ],
      );

      // Обновить last_interaction
      await this.db.run(
        "UPDATE clients SET last_interaction = CURRENT_TIMESTAMP WHERE id = ?",
        [clientId],
      );
    } catch (error) {
      console.error("Log interaction error:", error);
    }
  }

  /**
   * Сохранить интересы клиента
   */
  async saveClientInterests(clientId, interests) {
    try {
      await this.db.run(
        `
        INSERT INTO client_interests (client_id, collection, colors, style, budget_min, budget_max)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          clientId,
          interests.collection || null,
          JSON.stringify(interests.colors || []),
          interests.style || null,
          interests.budgetMin || null,
          interests.budgetMax || null,
        ],
      );
    } catch (error) {
      console.error("Save interests error:", error);
    }
  }

  /**
   * Забронировать консультацию
   */
  async bookConsultation(clientId, consultationData) {
    try {
      const result = await this.db.run(
        `
        INSERT INTO consultations (client_id, scheduled_at, duration, type, notes)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          clientId,
          consultationData.scheduledAt,
          consultationData.duration || 30,
          consultationData.type || "video",
          consultationData.notes || "",
        ],
      );

      return {
        consultationId: result.lastID,
        success: true,
      };
    } catch (error) {
      console.error("Book consultation error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Получить клиента по email
   */
  async getClientByEmail(email) {
    return await this.db.get("SELECT * FROM clients WHERE email = ?", [email]);
  }

  /**
   * Получить лид по session ID
   */
  async getLeadBySession(sessionId) {
    return await this.db.get("SELECT * FROM leads WHERE session_id = ?", [
      sessionId,
    ]);
  }

  /**
   * Получить историю взаимодействий клиента
   */
  async getClientInteractions(clientId, limit = 10) {
    return await this.db.all(
      `
      SELECT * FROM interactions
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
      [clientId, limit],
    );
  }

  /**
   * Получить интересы клиента
   */
  async getClientInterests(clientId) {
    const interests = await this.db.all(
      "SELECT * FROM client_interests WHERE client_id = ? ORDER BY priority DESC",
      [clientId],
    );

    return interests.map((i) => ({
      ...i,
      colors: i.colors ? JSON.parse(i.colors) : [],
    }));
  }

  /**
   * Получить консультации клиента
   */
  async getClientConsultations(clientId) {
    return await this.db.all(
      "SELECT * FROM consultations WHERE client_id = ? ORDER BY scheduled_at DESC",
      [clientId],
    );
  }

  /**
   * Обновить статус клиента
   */
  async updateClientStatus(clientId, status) {
    await this.db.run("UPDATE clients SET status = ? WHERE id = ?", [
      status,
      clientId,
    ]);
  }

  /**
   * Обновить VIP tier
   */
  async updateVIPTier(clientId, tier) {
    await this.db.run("UPDATE clients SET vip_tier = ? WHERE id = ?", [
      tier,
      clientId,
    ]);
  }

  /**
   * Добавить к total_spent
   */
  async addToTotalSpent(clientId, amount) {
    await this.db.run(
      "UPDATE clients SET total_spent = total_spent + ? WHERE id = ?",
      [amount, clientId],
    );
  }

  /**
   * Получить статистику CRM
   */
  async getStats() {
    const totalClients = await this.db.get(
      "SELECT COUNT(*) as count FROM clients",
    );
    const totalLeads = await this.db.get("SELECT COUNT(*) as count FROM leads");
    const activeClients = await this.db.get(
      "SELECT COUNT(*) as count FROM clients WHERE status = 'active'",
    );
    const totalConsultations = await this.db.get(
      "SELECT COUNT(*) as count FROM consultations",
    );
    const pendingConsultations = await this.db.get(
      "SELECT COUNT(*) as count FROM consultations WHERE status = 'pending'",
    );

    return {
      totalClients: totalClients.count,
      totalLeads: totalLeads.count,
      activeClients: activeClients.count,
      totalConsultations: totalConsultations.count,
      pendingConsultations: pendingConsultations.count,
    };
  }

  /**
   * Получить топ клиентов по покупкам
   */
  async getTopClients(limit = 10) {
    return await this.db.all(
      `
      SELECT * FROM clients
      ORDER BY total_spent DESC
      LIMIT ?
    `,
      [limit],
    );
  }
}

export default new CRMService();
