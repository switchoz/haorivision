import Event from "../models/Event.js";
import crmService from "../utils/crmStub.js";
import emailService from "./emailService.js";

/**
 * Event Service - Glow Ritual Event Generator
 * Создание и управление событиями HAORI VISION
 */

class EventService {
  /**
   * Шаблоны сценариев для 3-фазных ритуалов
   */
  scenarioTemplates = {
    ritual: {
      phase1: {
        name: "Тьма",
        duration: 15,
        description:
          "Погружение в темноту. Гости входят в пространство при свечах. Ambient музыка создаёт медитативное состояние.",
        lighting: "Только свечи и minimal ambient lighting",
        music: "Deep ambient / drone / meditation",
      },
      phase2: {
        name: "Свечение",
        duration: 30,
        description:
          "UV-активация. Включаются UV-лампы, хаори начинают светиться. Перформанс с движением и светом.",
        lighting: "UV blacklight 365nm + strobes",
        music: "Electronic / experimental / ethereal",
      },
      phase3: {
        name: "Пробуждение",
        duration: 20,
        description:
          "Возвращение к свету. Плавный переход к дневному свету. Интеграция опыта.",
        lighting: "Постепенное включение дневного света",
        music: "Uplifting ambient / post-rock",
      },
    },
    exhibition: {
      phase1: {
        name: "Открытие",
        duration: 20,
        description:
          "Приветствие гостей, знакомство с коллекцией при дневном свете.",
        lighting: "Дневной свет + spotlight на экспонаты",
        music: "Lounge / downtempo",
      },
      phase2: {
        name: "UV-демонстрация",
        duration: 40,
        description:
          "Демонстрация UV-эффектов. Интерактивная зона с UV-лампами.",
        lighting: "UV blacklight зоны",
        music: "Electronic / chillwave",
      },
      phase3: {
        name: "Networking",
        duration: 30,
        description: "Свободное общение, фотозона, обсуждение работ.",
        lighting: "Смешанный свет",
        music: "Ambient / lounge",
      },
    },
    workshop: {
      phase1: {
        name: "Введение",
        duration: 10,
        description: "Объяснение техники, знакомство с материалами.",
        lighting: "Рабочий дневной свет",
        music: "Soft instrumental",
      },
      phase2: {
        name: "Практика",
        duration: 60,
        description: "Создание своей работы под руководством художника.",
        lighting: "Яркий рабочий свет",
        music: "Focus / lo-fi beats",
      },
      phase3: {
        name: "Результат",
        duration: 20,
        description: "Просмотр работ участников, UV-тестирование.",
        lighting: "UV blacklight для проверки",
        music: "Celebratory ambient",
      },
    },
  };

  /**
   * Ambient playlists по типу события
   */
  playlistTemplates = {
    ritual: [
      {
        artist: "Brian Eno",
        track: "An Ending (Ascent)",
        spotifyUrl: "spotify:track:7gWhSIkCiKWzoALYYe7MiD",
        phase: "phase1",
      },
      {
        artist: "Aphex Twin",
        track: "Rhubarb",
        spotifyUrl: "spotify:track:5lKlFlReHlUEnKHBqXFOXY",
        phase: "phase1",
      },
      {
        artist: "Jon Hopkins",
        track: "Emerald Rush",
        spotifyUrl: "spotify:track:4nEbHCnB1xpJPqLB3pc6fk",
        phase: "phase2",
      },
      {
        artist: "Arca",
        track: "Desafío",
        spotifyUrl: "spotify:track:2rYgN1YPBYrqQjFjNpQGar",
        phase: "phase2",
      },
      {
        artist: "Nils Frahm",
        track: "Says",
        spotifyUrl: "spotify:track:0tMK5wEvmJlXfUzwcOdQJv",
        phase: "phase3",
      },
      {
        artist: "Ólafur Arnalds",
        track: "re:member",
        spotifyUrl: "spotify:track:1Y0a8g7N3TFcT47D6q1qKv",
        phase: "phase3",
      },
    ],
    exhibition: [
      {
        artist: "Bonobo",
        track: "Kerala",
        spotifyUrl: "spotify:track:1j8z5OzDd5zCtTHfPt9mLd",
        phase: "phase1",
      },
      {
        artist: "ODESZA",
        track: "A Moment Apart",
        spotifyUrl: "spotify:track:7K4XzJfV7dGQ9sYe5B0UtG",
        phase: "phase2",
      },
      {
        artist: "Tycho",
        track: "Awake",
        spotifyUrl: "spotify:track:2vqPzdFjKJZPZwXK0iFYG1",
        phase: "phase3",
      },
    ],
    workshop: [
      {
        artist: "Chillhop Music",
        track: "Lo-fi Study Mix",
        spotifyUrl: "spotify:playlist:0CFuMybe6s77w6QQrJjW7d",
        phase: "phase2",
      },
      {
        artist: "Mammal Hands",
        track: "Quiet Fire",
        spotifyUrl: "spotify:track:1DiLYqPKlPd0X3OmLYCQPO",
        phase: "phase1",
      },
    ],
  };

  /**
   * Создать новое событие Glow Ritual
   */
  async createEvent(eventData) {
    try {
      const {
        slug,
        name,
        tagline,
        type = "ritual",
        venue,
        dates,
        description,
        customScenario,
      } = eventData;

      // Получить шаблон сценария
      const scenario =
        customScenario ||
        this.scenarioTemplates[type] ||
        this.scenarioTemplates.ritual;

      // Рассчитать общую длительность
      const totalDuration =
        scenario.phase1.duration +
        scenario.phase2.duration +
        scenario.phase3.duration;

      // Получить playlist
      const playlist =
        this.playlistTemplates[type] || this.playlistTemplates.ritual;

      // Создать событие
      const event = new Event({
        slug: slug,
        name: name,
        tagline: tagline,
        type: type,
        status: "draft",
        venue: venue,
        dates: {
          announced: dates.announced || new Date(),
          start: dates.start,
          end:
            dates.end ||
            new Date(dates.start.getTime() + totalDuration * 60000),
          doors: dates.doors || new Date(dates.start.getTime() - 30 * 60000), // 30 min before
          ritual: dates.start,
        },
        performance: {
          scenario: scenario,
          totalDuration: totalDuration,
        },
        ambiance: {
          playlist: playlist,
          lighting: {
            daylight: "Warm 3000K ambient",
            uv: "UV blacklight 365nm",
            blackout: "Complete darkness with candles",
          },
          dress_code:
            type === "ritual"
              ? "HAORI VISION pieces / all black / UV-reactive"
              : "Smart casual",
          vibes: ["meditative", "transformative", "ethereal", "immersive"],
        },
        attendance: {
          capacity: venue.capacity || 50,
          registered: 0,
          attended: 0,
          waitlist: 0,
        },
        invitations: [],
        nft: {
          enabled: true,
          contractAddress: process.env.NFT_CONTRACT_ADDRESS,
          collectionName: `${name} — Attendee Certificate`,
          description: `Proof of attendance for ${name}`,
          baseImageUrl: "",
          minted: 0,
          attendees: [],
        },
        description: description,
        featured: false,
      });

      await event.save();

      console.log(`✅ Event created: ${event.name} (${event.slug})`);

      return {
        success: true,
        event: event,
      };
    } catch (error) {
      console.error("Create event error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Пригласить клиентов из CRM
   */
  async inviteClientsFromCRM(eventId, clientFilter = {}) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, error: "Event not found" };
      }

      // Получить VIP клиентов из CRM
      const clients = await crmService.db.all(`
        SELECT id, name, email FROM clients
        WHERE vip_tier IN ('silver', 'gold', 'platinum')
        ORDER BY vip_tier DESC, total_spent DESC
        LIMIT 50
      `);

      // Создать приглашения
      const invitations = clients.map((client) => ({
        clientId: client.id,
        email: client.email,
        name: client.name,
        status: "invited",
        invitedAt: new Date(),
        plusOne: client.vip_tier === "platinum" || client.vip_tier === "gold",
      }));

      event.invitations.push(...invitations);
      event.attendance.registered = invitations.length;
      await event.save();

      // Отправить приглашения по email
      for (const invitation of invitations) {
        await this.sendInvitationEmail(event, invitation);
      }

      console.log(`✅ Invited ${invitations.length} clients to ${event.name}`);

      return {
        success: true,
        invited: invitations.length,
      };
    } catch (error) {
      console.error("Invite clients error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Отправить email-приглашение
   */
  async sendInvitationEmail(event, invitation) {
    try {
      const rsvpUrl = `https://haorivision.com/events/${event.slug}/rsvp?email=${invitation.email}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              background: linear-gradient(135deg, #0a0a0a 0%, #1a0f2e 100%);
              color: #fff;
              padding: 40px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 20px;
              padding: 40px;
              border: 1px solid rgba(167, 139, 250, 0.3);
            }
            h1 {
              color: #a78bfa;
              font-size: 32px;
              margin-bottom: 20px;
              text-align: center;
            }
            .tagline {
              text-align: center;
              font-size: 18px;
              color: #c4b5fd;
              margin-bottom: 30px;
              font-style: italic;
            }
            .info-box {
              background: rgba(167, 139, 250, 0.1);
              border-left: 4px solid #a78bfa;
              padding: 20px;
              margin: 20px 0;
            }
            .rsvp-button {
              display: block;
              width: 100%;
              background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
              color: white;
              text-align: center;
              padding: 15px 30px;
              border-radius: 10px;
              text-decoration: none;
              font-weight: bold;
              margin: 30px 0;
            }
            .scenario {
              margin: 20px 0;
            }
            .phase {
              margin: 15px 0;
              padding: 15px;
              background: rgba(255, 255, 255, 0.03);
              border-radius: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✨ ${event.name}</h1>
            <p class="tagline">${event.tagline || "A HAORI VISION Glow Ritual"}</p>

            <div class="info-box">
              <p><strong>📍 Место:</strong> ${event.venue.name}, ${event.venue.address}</p>
              <p><strong>📅 Дата:</strong> ${event.dates.start.toLocaleDateString("ru-RU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <p><strong>⏰ Время:</strong> Doors ${event.dates.doors.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}, Ritual ${event.dates.ritual.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</p>
              <p><strong>⏱️ Длительность:</strong> ${event.performance.totalDuration} минут</p>
            </div>

            <p>Дорогой ${invitation.name},</p>

            <p>Мы приглашаем тебя на эксклюзивный Glow Ritual — трансформирующий опыт на границе искусства, света и технологии.</p>

            <div class="scenario">
              <h3>🌑 Сценарий перформанса:</h3>

              <div class="phase">
                <h4>Phase 1: ${event.performance.scenario.phase1.name}</h4>
                <p>${event.performance.scenario.phase1.description}</p>
                <p><small>🎵 ${event.performance.scenario.phase1.music}</small></p>
              </div>

              <div class="phase">
                <h4>Phase 2: ${event.performance.scenario.phase2.name}</h4>
                <p>${event.performance.scenario.phase2.description}</p>
                <p><small>🎵 ${event.performance.scenario.phase2.music}</small></p>
              </div>

              <div class="phase">
                <h4>Phase 3: ${event.performance.scenario.phase3.name}</h4>
                <p>${event.performance.scenario.phase3.description}</p>
                <p><small>🎵 ${event.performance.scenario.phase3.music}</small></p>
              </div>
            </div>

            <p><strong>Dress Code:</strong> ${event.ambiance.dress_code}</p>
            ${invitation.plusOne ? "<p><strong>+1:</strong> Ты можешь привести одного гостя.</p>" : ""}

            <a href="${rsvpUrl}" class="rsvp-button">Подтвердить участие</a>

            <p style="text-align: center; color: #a78bfa; margin-top: 30px;">
              🎫 Каждому участнику — NFT-сертификат<br/>
              🌟 Эксклюзивно для VIP-клиентов HAORI VISION
            </p>
          </div>
        </body>
        </html>
      `;

      await emailService.sendCustomEmail(
        invitation.email,
        `✨ Приглашение: ${event.name}`,
        html,
      );

      return { success: true };
    } catch (error) {
      console.error("Send invitation error:", error);
      return { success: false };
    }
  }

  /**
   * RSVP - подтверждение участия
   */
  async confirmRSVP(eventId, email, status = "confirmed") {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, error: "Event not found" };
      }

      // Найти приглашение
      const invitation = event.invitations.find((inv) => inv.email === email);
      if (!invitation) {
        // Добавить в waitlist
        if (event.attendance.registered >= event.attendance.capacity) {
          event.invitations.push({
            email: email,
            status: "waitlist",
            invitedAt: new Date(),
            respondedAt: new Date(),
          });
          event.attendance.waitlist += 1;
          await event.save();

          return {
            success: true,
            status: "waitlist",
            message: "Добавлен в waitlist",
          };
        }

        // Новое приглашение
        event.invitations.push({
          email: email,
          status: "confirmed",
          invitedAt: new Date(),
          respondedAt: new Date(),
        });
        event.attendance.registered += 1;
        await event.save();

        return {
          success: true,
          status: "confirmed",
          message: "RSVP confirmed",
        };
      }

      // Обновить статус
      invitation.status = status;
      invitation.respondedAt = new Date();

      await event.save();

      // Отправить подтверждение
      await this.sendRSVPConfirmation(event, invitation);

      return {
        success: true,
        status: status,
        event: event,
      };
    } catch (error) {
      console.error("RSVP error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Отправить RSVP confirmation email
   */
  async sendRSVPConfirmation(event, invitation) {
    try {
      const html = `
        <h1>✅ RSVP Confirmed</h1>
        <p>Увидимся на ${event.name}!</p>
        <p><strong>Дата:</strong> ${event.dates.start.toLocaleDateString("ru-RU")}</p>
        <p><strong>Место:</strong> ${event.venue.name}</p>
        <p>Добавь в календарь и не забудь про dress code: ${event.ambiance.dress_code}</p>
        <p>🎫 После события ты получишь NFT-сертификат участника.</p>
      `;

      await emailService.sendCustomEmail(
        invitation.email,
        `✅ RSVP Confirmed — ${event.name}`,
        html,
      );

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Отметить attendance и выдать NFT
   */
  async markAttendance(eventId, clientId, walletAddress = null) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, error: "Event not found" };
      }

      // Найти приглашение
      const invitation = event.invitations.find(
        (inv) => inv.clientId && inv.clientId.toString() === clientId,
      );

      if (!invitation) {
        return { success: false, error: "Invitation not found" };
      }

      // Отметить как attended
      invitation.status = "attended";
      invitation.attendedAt = new Date();
      event.attendance.attended += 1;

      // Mint NFT если есть wallet
      if (event.nft.enabled && walletAddress) {
        const nftResult = await this.mintAttendeeNFT(
          event,
          clientId,
          walletAddress,
        );

        if (nftResult.success) {
          event.nft.attendees.push({
            clientId: clientId,
            walletAddress: walletAddress,
            tokenId: nftResult.tokenId,
            openseaUrl: nftResult.openseaUrl,
            mintedAt: new Date(),
          });
          event.nft.minted += 1;
        }
      }

      await event.save();

      return {
        success: true,
        attended: true,
        nftMinted: event.nft.enabled && walletAddress,
      };
    } catch (error) {
      console.error("Mark attendance error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Создать сертификат участника события (заглушка)
   */
  async createAttendeeCertificate(event, clientId) {
    return {
      success: true,
      certificateId: `CERT-${Date.now()}`,
    };
  }

  /**
   * Получить все события
   */
  async getAllEvents(filters = {}) {
    try {
      const query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.type) {
        query.type = filters.type;
      }

      if (filters.featured) {
        query.featured = true;
      }

      const events = await Event.find(query).sort({ "dates.start": -1 });

      return events;
    } catch (error) {
      console.error("Get events error:", error);
      return [];
    }
  }

  /**
   * Получить событие по slug
   */
  async getEventBySlug(slug) {
    try {
      const event = await Event.findOne({ slug: slug }).populate(
        "invitations.clientId",
      );

      return event;
    } catch (error) {
      console.error("Get event error:", error);
      return null;
    }
  }

  /**
   * Обновить статус события
   */
  async updateEventStatus(eventId, status) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return { success: false, error: "Event not found" };
      }

      event.status = status;
      await event.save();

      return {
        success: true,
        event: event,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Получить статистику события
   */
  async getEventStats(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        return null;
      }

      const stats = {
        capacity: event.attendance.capacity,
        registered: event.attendance.registered,
        confirmed: event.invitations.filter((i) => i.status === "confirmed")
          .length,
        declined: event.invitations.filter((i) => i.status === "declined")
          .length,
        waitlist: event.attendance.waitlist,
        attended: event.attendance.attended,
        nftsMinted: event.nft.minted,
        fillRate: (
          (event.attendance.registered / event.attendance.capacity) *
          100
        ).toFixed(1),
        attendanceRate:
          event.attendance.registered > 0
            ? (
                (event.attendance.attended / event.attendance.registered) *
                100
              ).toFixed(1)
            : 0,
      };

      return stats;
    } catch (error) {
      return null;
    }
  }
}

export default new EventService();
