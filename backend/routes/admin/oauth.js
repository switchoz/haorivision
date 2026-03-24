import express from "express";
import { passport, generateToken } from "../../config/passport.js";
import { baseLogger } from "../../middlewares/logger.js";

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3012";

// VKontakte OAuth
router.get("/vk", passport.authenticate("vkontakte", { session: false }));

router.get(
  "/vk/callback",
  passport.authenticate("vkontakte", {
    session: false,
    failureRedirect: `${CLIENT_URL}/admin/login?error=vk_auth_failed`,
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      // Redirect to frontend with token
      res.redirect(`${CLIENT_URL}/admin/login?token=${token}&provider=vk`);
    } catch (error) {
      baseLogger.error({ err: error }, "VK callback error");
      res.redirect(`${CLIENT_URL}/admin/login?error=token_generation_failed`);
    }
  },
);

// Yandex OAuth
router.get("/yandex", passport.authenticate("yandex", { session: false }));

router.get(
  "/yandex/callback",
  passport.authenticate("yandex", {
    session: false,
    failureRedirect: `${CLIENT_URL}/admin/login?error=yandex_auth_failed`,
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${CLIENT_URL}/admin/login?token=${token}&provider=yandex`);
    } catch (error) {
      baseLogger.error({ err: error }, "Yandex callback error");
      res.redirect(`${CLIENT_URL}/admin/login?error=token_generation_failed`);
    }
  },
);

// Mail.ru OAuth
router.get("/mailru", passport.authenticate("mailru", { session: false }));

router.get(
  "/mailru/callback",
  passport.authenticate("mailru", {
    session: false,
    failureRedirect: `${CLIENT_URL}/admin/login?error=mailru_auth_failed`,
  }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      res.redirect(`${CLIENT_URL}/admin/login?token=${token}&provider=mailru`);
    } catch (error) {
      baseLogger.error({ err: error }, "Mail.ru callback error");
      res.redirect(`${CLIENT_URL}/admin/login?error=token_generation_failed`);
    }
  },
);

export default router;
