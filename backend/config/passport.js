import passport from "passport";
import { Strategy as VKontakteStrategy } from "passport-vkontakte";
import { Strategy as YandexStrategy } from "passport-yandex";
import OAuth2Strategy from "passport-oauth2";
import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";
import fetch from "node-fetch";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "replace_me";

// Serialize/Deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await AdminUser.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// VKontakte Strategy
if (process.env.VK_APP_ID && process.env.VK_APP_SECRET) {
  passport.use(
    new VKontakteStrategy(
      {
        clientID: process.env.VK_APP_ID,
        clientSecret: process.env.VK_APP_SECRET,
        callbackURL:
          process.env.VK_CALLBACK_URL ||
          "http://localhost:3010/api/admin/auth/vk/callback",
        scope: ["email"],
        profileFields: ["email", "city", "bdate"],
      },
      async (accessToken, refreshToken, params, profile, done) => {
        try {
          // Check if user exists
          let user = await AdminUser.findOne({ "social.vk": profile.id });

          if (!user) {
            // Create new user
            user = await AdminUser.create({
              email:
                profile.emails?.[0]?.value ||
                `vk_${profile.id}@placeholder.com`,
              name: profile.displayName,
              role: "admin", // или 'viewer' по умолчанию
              social: {
                vk: profile.id,
                provider: "vkontakte",
              },
              avatar: profile.photos?.[0]?.value,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
}

// Yandex Strategy
if (process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET) {
  passport.use(
    new YandexStrategy(
      {
        clientID: process.env.YANDEX_CLIENT_ID,
        clientSecret: process.env.YANDEX_CLIENT_SECRET,
        callbackURL:
          process.env.YANDEX_CALLBACK_URL ||
          "http://localhost:3010/api/admin/auth/yandex/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await AdminUser.findOne({ "social.yandex": profile.id });

          if (!user) {
            user = await AdminUser.create({
              email:
                profile.emails?.[0]?.value ||
                profile.default_email ||
                `yandex_${profile.id}@placeholder.com`,
              name: profile.displayName || profile.real_name,
              role: "admin",
              social: {
                yandex: profile.id,
                provider: "yandex",
              },
              avatar: profile.default_avatar_id
                ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
                : null,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
}

// Mail.ru Strategy (using generic OAuth2)
if (process.env.MAILRU_CLIENT_ID && process.env.MAILRU_CLIENT_SECRET) {
  passport.use(
    "mailru",
    new OAuth2Strategy(
      {
        authorizationURL: "https://oauth.mail.ru/login",
        tokenURL: "https://oauth.mail.ru/token",
        clientID: process.env.MAILRU_CLIENT_ID,
        clientSecret: process.env.MAILRU_CLIENT_SECRET,
        callbackURL:
          process.env.MAILRU_CALLBACK_URL ||
          "http://localhost:3010/api/admin/auth/mailru/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Mail.ru requires custom API call to get user info
          const params = {
            app_id: process.env.MAILRU_CLIENT_ID,
            method: "users.getInfo",
            secure: "1",
            session_key: accessToken,
          };

          // Generate signature for Mail.ru API
          const sigSource =
            Object.keys(params)
              .sort()
              .map((key) => `${key}=${params[key]}`)
              .join("") + process.env.MAILRU_CLIENT_SECRET;
          const sig = crypto.createHash("md5").update(sigSource).digest("hex");

          const url = `https://oauth.mail.ru/userinfo?access_token=${accessToken}`;
          const response = await fetch(url);
          const userData = await response.json();

          let user = await AdminUser.findOne({
            "social.mailru": userData.id || userData.email,
          });

          if (!user) {
            user = await AdminUser.create({
              email: userData.email || `mailru_${userData.id}@placeholder.com`,
              name:
                userData.name || `${userData.first_name} ${userData.last_name}`,
              role: "admin",
              social: {
                mailru: userData.id || userData.email,
                provider: "mailru",
              },
              avatar: userData.image || userData.picture,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
}

// Helper function to generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export { passport, generateToken };
