import express from "express";
import bespokeService from "../services/bespokeService.js";
import crmService from "../utils/crmStub.js";
import BespokeCommission from "../models/BespokeCommission.js";
import Customer from "../models/Customer.js";
import { sendCustomEmail } from "../services/emailService.js";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

/**
 * POST /api/bespoke
 * Submit bespoke form from website (simple endpoint for /forms/bespoke.html)
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, energy, measurements, country, additional } = req.body;

    // Validate required fields
    if (!name || !email || !energy || !measurements || !country) {
      return res.status(400).json({
        success: false,
        error: "Все обязательные поля должны быть заполнены",
      });
    }

    // Find or create customer
    let customer = await Customer.findOne({ email: email });

    if (!customer) {
      customer = new Customer({
        name: name,
        email: email,
        password: Math.random().toString(36).slice(2) + "Aa1!",
        source: "web",
        tags: ["bespoke_inquiry"],
        createdAt: new Date(),
      });
      await customer.save();
    }

    // Generate commission number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const commissionNumber = `BSP${year}${month}${random}`;

    // Create bespoke commission
    const commission = new BespokeCommission({
      customerId: customer._id,
      commissionNumber: commissionNumber,
      status: "submitted",
      brief: {
        energy: energy,
        inspiration: additional || "",
        story: `Measurements: ${measurements}\nCountry: ${country}`,
      },
      specifications: {
        garmentType: "haori",
        customMeasurements: {
          chest: measurements.includes("ОГ")
            ? parseInt(measurements.match(/\d+/)?.[0])
            : null,
        },
      },
      delivery: {
        shippingAddress: {
          country: country,
        },
      },
      createdAt: new Date(),
    });

    await commission.save();

    // Send confirmation email to customer (non-blocking — don't fail if email not configured)
    try {
      const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 40px; border-radius: 16px; border: 1px solid #a855f7; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { line-height: 1.8; }
          .info-box { background: rgba(168, 85, 247, 0.1); border: 1px solid #a855f7; border-radius: 12px; padding: 20px; margin: 30px 0; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">光 HAORI VISION</div>
            <h1>Bespoke Commission Request Received</h1>
          </div>

          <div class="content">
            <p>Спасибо, <strong>${name}</strong>!</p>

            <p>Я получил твою заявку на создание уникального хаори по твоей энергии.</p>

            <div class="info-box">
              <h3>📋 Твоя заявка #${commissionNumber}</h3>
              <p><strong>Энергия и цвета:</strong><br>${energy}</p>
              <p><strong>Параметры:</strong> ${measurements}</p>
              <p><strong>Страна доставки:</strong> ${country}</p>
              ${additional ? `<p><strong>Дополнительные пожелания:</strong><br>${additional}</p>` : ""}
            </div>

            <h3>Что дальше?</h3>
            <p>Я создам <strong>moodboard</strong> по твоей энергии и предложу эскиз в течение <strong>72 часов</strong>.</p>

            <div class="info-box">
              <p><strong>Стоимость:</strong> от €3,000</p>
              <p><strong>Срок изготовления:</strong> 2–4 недели</p>
              <p><strong>Что включено:</strong></p>
              <ul>
                <li>Индивидуальная консультация с художником</li>
                <li>Moodboard и эскиз дизайна</li>
                <li>Ручная роспись премиум-материалами</li>
                <li>UV-реактивные пигменты (кастомная палитра)</li>
                <li>Сертификат подлинности с подписью художника LiZa</li>
              </ul>
            </div>

            <p style="margin-top: 30px; font-weight: 600; color: #a855f7;">
              Ответь "да" на это письмо, если бронируем слот.
            </p>

            <p style="margin-top: 30px; font-style: italic; opacity: 0.9;">
              "В тебе уже живёт этот свет. Хаори только даёт ему форму."<br>
              — 光 Хикари, Хранитель Света
            </p>
          </div>

          <div class="footer">
            <p><strong>HAORI VISION</strong> — Wearable Light Art Since 2025</p>
            <p>Wear the Light. Become the Art.</p>
            <p style="margin-top: 20px; font-size: 11px;">
              Есть вопросы? Напиши нам: <a href="mailto:support@haorivision.com" style="color: #a855f7;">support@haorivision.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

      await sendCustomEmail(
        email,
        "✨ Заявка на Bespoke принята — HAORI VISION",
        customerEmailHtml,
      );

      // Send notification to artist/admin
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminEmail && adminEmail !== "not_set") {
        const adminEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px; border-radius: 16px; border: 1px solid #10b981; }
            h1 { color: #10b981; }
            .info { background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0; }
            pre { background: #0a0a0a; padding: 15px; border-radius: 8px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎨 New Bespoke Commission Request</h1>
            <div class="info">
              <p><strong>Commission Number:</strong> ${commissionNumber}</p>
              <p><strong>Customer:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Country:</strong> ${country}</p>
            </div>

            <h3>Brief:</h3>
            <pre>${energy}</pre>

            <h3>Measurements:</h3>
            <pre>${measurements}</pre>

            ${additional ? `<h3>Additional:</h3><pre>${additional}</pre>` : ""}

            <p style="margin-top: 30px;">
              <strong>Action Required:</strong> Create moodboard within 72 hours
            </p>
          </div>
        </body>
        </html>
      `;

        await sendCustomEmail(
          adminEmail,
          `🎨 New Bespoke Request #${commissionNumber} from ${name}`,
          adminEmailHtml,
        );
      }
    } catch (emailError) {
      baseLogger.warn(
        { err: emailError },
        "Bespoke email sending failed (non-critical)",
      );
    }

    res.json({
      success: true,
      message: "Заявка успешно отправлена",
      commissionNumber: commissionNumber,
    });
  } catch (error) {
    baseLogger.error({ err: error }, "Bespoke form submission error");
    res.status(500).json({
      success: false,
      error: "Произошла ошибка при отправке заявки. Попробуйте ещё раз.",
    });
  }
});

/**
 * POST /api/bespoke/create
 * Create new bespoke commission
 */
router.post("/create", async (req, res) => {
  try {
    const { customerId, brief } = req.body;

    if (!customerId || !brief) {
      return res.status(400).json({
        success: false,
        error: "Customer ID and brief required",
      });
    }

    const result = await bespokeService.createCommission(customerId, brief);

    if (result.success) {
      // Log to CRM
      await crmService.logInteraction(customerId, {
        type: "bespoke_request",
        intent: "bespoke",
        message: `Bespoke commission created: ${result.commission.commissionNumber}`,
        response: "Commission submitted, moodboard generated",
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bespoke/:commissionId
 * Get commission by ID
 */
router.get("/:commissionId", async (req, res) => {
  try {
    const { commissionId } = req.params;

    const commission =
      await BespokeCommission.findById(commissionId).populate("customerId");

    if (!commission) {
      return res.status(404).json({
        success: false,
        error: "Commission not found",
      });
    }

    res.json({
      success: true,
      commission: commission,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bespoke/customer/:customerId
 * Get customer's commissions
 */
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;

    const commissions = await BespokeCommission.find({
      customerId: customerId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      commissions: commissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/bespoke/:commissionId/consultation
 * Schedule consultation
 */
router.post("/:commissionId/consultation", async (req, res) => {
  try {
    const { commissionId } = req.params;
    const consultationData = req.body;

    const result = await bespokeService.scheduleConsultation(
      commissionId,
      consultationData,
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
 * GET /api/bespoke/consultation/slots
 * Get available consultation slots
 */
router.get("/consultation/slots", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const slots = await bespokeService.getAvailableSlots(start, end);

    res.json({
      success: true,
      slots: slots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/bespoke/:commissionId/status
 * Update commission status
 */
router.patch("/:commissionId/status", async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status required",
      });
    }

    const result = await bespokeService.updateStatus(
      commissionId,
      status,
      notes,
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
 * POST /api/bespoke/:commissionId/moodboard/regenerate
 * Regenerate moodboard
 */
router.post("/:commissionId/moodboard/regenerate", async (req, res) => {
  try {
    const { commissionId } = req.params;

    const commission = await BespokeCommission.findById(commissionId);

    if (!commission) {
      return res.status(404).json({
        success: false,
        error: "Commission not found",
      });
    }

    const result = await bespokeService.generateMoodboard(commission);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bespoke/stats
 * Get bespoke stats
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await bespokeService.getStats();

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

export default router;
