import express from "express";
import eventService from "../services/eventService.js";

const router = express.Router();

/**
 * POST /api/events/create
 * Создать новое событие
 */
router.post("/create", async (req, res) => {
  try {
    const result = await eventService.createEvent(req.body);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/events
 * Получить все события с фильтрами
 */
router.get("/", async (req, res) => {
  try {
    const { status, type, featured } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (featured) filters.featured = featured === "true";

    const events = await eventService.getAllEvents(filters);

    res.json({
      success: true,
      events: events,
      count: events.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/events/:slug
 * Получить событие по slug
 */
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const event = await eventService.getEventBySlug(slug);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    res.json({
      success: true,
      event: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/events/:eventId/invite
 * Пригласить VIP клиентов из CRM
 */
router.post("/:eventId/invite", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { clientFilter } = req.body;

    const result = await eventService.inviteClientsFromCRM(
      eventId,
      clientFilter,
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/events/:eventId/rsvp
 * RSVP - подтверждение участия
 */
router.post("/:eventId/rsvp", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email, status = "confirmed" } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email required",
      });
    }

    const result = await eventService.confirmRSVP(eventId, email, status);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/events/:eventId/attendance
 * Отметить attendance участника
 */
router.post("/:eventId/attendance", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { clientId, walletAddress } = req.body;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: "Client ID required",
      });
    }

    const result = await eventService.markAttendance(
      eventId,
      clientId,
      walletAddress,
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/events/:eventId/stats
 * Статистика события
 */
router.get("/:eventId/stats", async (req, res) => {
  try {
    const { eventId } = req.params;

    const stats = await eventService.getEventStats(eventId);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/events/:eventId/status
 * Обновить статус события
 */
router.patch("/:eventId/status", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status required",
      });
    }

    const result = await eventService.updateEventStatus(eventId, status);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
