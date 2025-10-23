/**
 * HAORI VISION — UTM Capture Middleware (P18)
 *
 * Captures UTM parameters from query strings and stores them in sessions.
 * Session data can be linked to CRM when order is placed.
 *
 * UTM Parameters captured:
 * - utm_source   (e.g., "instagram", "tiktok", "google")
 * - utm_medium   (e.g., "social", "cpc", "email")
 * - utm_campaign (e.g., "eclipse_bloom_launch")
 * - utm_content  (e.g., "video_1", "story_3")
 * - utm_term     (e.g., "uv clothing", "reactive fashion")
 *
 * Usage:
 *   import { utmCaptureMiddleware } from './middlewaress/utmCapture.js';
 *   app.use(utmCaptureMiddleware);
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================

const DATA_DIR = path.resolve(__dirname, "../../data");
const SESSIONS_FILE = path.join(DATA_DIR, "utm_sessions.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize sessions file if it doesn't exist
if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions: [] }, null, 2));
  console.log(`[UTM Capture] Created sessions file: ${SESSIONS_FILE}`);
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Extract UTM parameters from query string
 */
function extractUTMParams(query) {
  const utmParams = {};
  const utmKeys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ];

  utmKeys.forEach((key) => {
    if (query[key]) {
      utmParams[key] = query[key];
    }
  });

  return Object.keys(utmParams).length > 0 ? utmParams : null;
}

/**
 * Load sessions from file
 */
function loadSessions() {
  try {
    const data = fs.readFileSync(SESSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`[UTM Capture] Error loading sessions: ${error.message}`);
    return { sessions: [] };
  }
}

/**
 * Save sessions to file
 */
function saveSessions(sessionsData) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessionsData, null, 2));
    return true;
  } catch (error) {
    console.error(`[UTM Capture] Error saving sessions: ${error.message}`);
    return false;
  }
}

/**
 * Find session by ID
 */
function findSessionById(sessionId) {
  const data = loadSessions();
  return data.sessions.find((s) => s.session_id === sessionId);
}

/**
 * Create new session with UTM data
 */
function createSession(utmParams, req) {
  const sessionId = generateSessionId();

  const session = {
    session_id: sessionId,
    created_at: new Date().toISOString(),
    utm_params: utmParams,
    ip_address: req.ip || req.connection.remoteAddress,
    user_agent: req.headers["user-agent"] || "unknown",
    referrer: req.headers["referer"] || req.headers["referrer"] || null,
    landing_page: req.originalUrl || req.url,
    order_id: null, // Will be filled when order is placed
    conversion_timestamp: null,
  };

  const data = loadSessions();
  data.sessions.push(session);
  saveSessions(data);

  return sessionId;
}

/**
 * Update session with order information
 */
export function linkSessionToOrder(sessionId, orderId) {
  const data = loadSessions();
  const session = data.sessions.find((s) => s.session_id === sessionId);

  if (session) {
    session.order_id = orderId;
    session.conversion_timestamp = new Date().toISOString();
    saveSessions(data);
    console.log(
      `[UTM Capture] Linked session ${sessionId} to order ${orderId}`,
    );
    return true;
  }

  return false;
}

/**
 * Get session by ID
 */
export function getSession(sessionId) {
  return findSessionById(sessionId);
}

/**
 * Get all sessions (for analytics)
 */
export function getAllSessions() {
  return loadSessions();
}

/**
 * Get sessions with conversions
 */
export function getConvertedSessions() {
  const data = loadSessions();
  return data.sessions.filter((s) => s.order_id !== null);
}

/**
 * Get sessions by UTM source
 */
export function getSessionsBySource(source) {
  const data = loadSessions();
  return data.sessions.filter((s) => s.utm_params.utm_source === source);
}

// ============================================================
// Middleware
// ============================================================

/**
 * UTM Capture Middleware
 *
 * This middleware:
 * 1. Checks for UTM parameters in query string
 * 2. If found, creates a new session and stores session_id in cookie
 * 3. Session can later be linked to order via linkSessionToOrder()
 */
export function utmCaptureMiddleware(req, res, next) {
  // Extract UTM parameters from query
  const utmParams = extractUTMParams(req.query);

  // Only process if UTM parameters exist
  if (utmParams) {
    // Check if user already has a session cookie
    let sessionId = req.cookies?.utm_session_id;

    // If no session exists, or UTM params changed, create new session
    if (!sessionId) {
      sessionId = createSession(utmParams, req);

      // Set cookie (expires in 30 days)
      res.cookie("utm_session_id", sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // Attach session ID to request for downstream use
      req.utmSessionId = sessionId;
      req.utmParams = utmParams;

      // Log capture (can be disabled in production)
      if (process.env.DEBUG_UTM === "1") {
        console.log(`[UTM Capture] New session: ${sessionId}`);
        console.log(`[UTM Capture] Params:`, utmParams);
      }
    } else {
      // Existing session - attach to request
      req.utmSessionId = sessionId;
      const existingSession = findSessionById(sessionId);
      if (existingSession) {
        req.utmParams = existingSession.utm_params;
      }
    }
  } else {
    // No UTM params, but check for existing session cookie
    const sessionId = req.cookies?.utm_session_id;
    if (sessionId) {
      req.utmSessionId = sessionId;
      const existingSession = findSessionById(sessionId);
      if (existingSession) {
        req.utmParams = existingSession.utm_params;
      }
    }
  }

  next();
}

export default utmCaptureMiddleware;
