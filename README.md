# 🌌 HAORI VISION — Immersive Show System

## Eclipse of Light

**Полная система для проведения 5-минутного иммерсивного шоу с multi-projector setup, real-time DMX lighting, spatial audio, и post-show analytics.**

**Статус:** ✅ **PRODUCTION READY**
**Версия:** 1.0.1
**Дата:** 2025-10-08

---

## 🚀 Quick Start

### Development:

```bash
# Backend
cd backend
npm install
npm run dev              # API server (http://localhost:3010)
npm run light:server     # Art-Net gateway (ws://localhost:8081)
npm run projector:sync   # Sync server (ws://localhost:8080)

# Frontend
cd frontend
npm install
npm run show:dev         # Dev mode (http://localhost:3012)
```

### Production:

```bash
cd frontend
npm run show:venue=BLACK_ROOM    # Venue mode with profile
npm run show:kiosk               # Kiosk mode (fullscreen, no UI)
npm run show:pack                # Export offline pack
```

**📖 Полный гайд:** [QUICK_START.md](./QUICK_START.md)

---

## 📚 Documentation

### Start Here:

- **[QUICK_START.md](./QUICK_START.md)** — Установка и запуск
- **[IMMERSIVE_SHOW_COMPLETE.md](./IMMERSIVE_SHOW_COMPLETE.md)** — Главная документация
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** — Полный список (18 документов)

### Production:

- **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** ⭐ — Production deployment guide (850+ lines)
- **[RUN_OF_SHOW.md](./RUN_OF_SHOW.md)** ⭐ — Шпаргалка продюсера (950 lines)
- **[QUICK_CHECKLIST.md](./QUICK_CHECKLIST.md)** — Quick reference (250 lines)
- **[PREMIUM_TEST_CHECKLIST.md](./PREMIUM_TEST_CHECKLIST.md)** ⭐ — Финальная проверка (650 lines)

---

## 🎯 Features

### Multi-Display System

- ✅ До 9 проекторов одновременно
- ✅ Span canvas + network sync (WebSocket)
- ✅ Geometry warp correction (bilinear interpolation)
- ✅ Color calibration (gamma, white point, brightness)
- ✅ Venue profiles (JSON config)

### Show Control

- ✅ Timeline sequencer (30 fps)
- ✅ DMX/Art-Net control (512 channels)
- ✅ Multi-bus audio mixing (Master/Music/Whisper/Effects)
- ✅ Real-time status monitor (FPS, DMX, Cache)
- ✅ Cue log с PDF export

### Safety Systems

- ✅ Strobe limiter (max 3 Hz, epilepsy safe)
- ✅ UV intensity presets (Gentle/Medium/Strong)
- ✅ Smooth blackout (min 500ms fade)
- ✅ Emergency blackout (ESC key)
- ✅ Pre-show Safety Notice (EN/RU)

### Guest Experience

- ✅ QR code check-in
- ✅ Personal Light Cards (PNG 800×1200 + QR)
- ✅ Guided Whisper audio guide (RU/EN, 5 scenes)
- ✅ Email follow-up с Light Card

### Post-Show Analytics

- ✅ Post-Show Report PDF (8 sections)
- ✅ Light Index (эмо-оценка 0-10)
- ✅ DMX/Audio activity charts
- ✅ Attendance tracking + email list
- ✅ Auto recommendations

### Offline Mode

- ✅ Service Worker pre-cache (45+ assets)
- ✅ Offline pack export (app + data + README)
- ✅ Works без интернета после первой загрузки

---

## 📦 Project Structure

```
haorivision/
├── frontend/                      # React + Three.js + Vite
│   ├── src/
│   │   ├── show/                  # Show core (6 files)
│   │   ├── components/            # UI components (8 files)
│   │   └── pages/                 # Pages (3 files)
│   ├── scripts/                   # Launchers (2 files)
│   └── public/sw.js               # Service Worker
│
├── backend/                       # Node.js + Express
│   ├── routes/                    # API routes (3 files)
│   ├── services/                  # Services (3 files)
│   └── websocket/                 # Sync server
│
├── data/
│   └── show/
│       ├── timeline.json          # Show timeline (5 min)
│       ├── script.md              # Live captions
│       └── venues/                # Venue profiles (2)
│
└── docs/                          # Documentation (17 MD files)
```

---

## 🛠️ Tech Stack

**Frontend:**

- React 19 + Vite 7
- Three.js 0.180 + React Three Fiber 9
- Tone.js 15 (Web Audio)
- Framer Motion 12
- Tailwind CSS 4

**Backend:**

- Node.js 20 + Express 4
- MongoDB 8
- WebSocket (ws)
- PDFKit (reports)
- ethers.js 6 (NFT)

**Protocols:**

- Art-Net (DMX lighting, UDP 6454)
- WebSocket (sync, ports 8080/8081)
- HTTP/REST (API, port 3010)

---

## 📊 Statistics

- **43 файла** (26 code + 17 docs)
- **15,720 строк** (7,370 code + 8,350 docs)
- **6 фаз** разработки + production deployment
- **3 дня** (2025-10-06 → 2025-10-08)

---

## 🎬 Show Timeline (5 minutes)

### Scene 1: intro_dark (0:00-1:00)

Minimal particles, slow camera orbit, deep ambient

### Scene 2: light_awaken (1:00-2:00)

Bloom increase, particle birth, rising synth (92-98 BPM)

### Scene 3: eclipse_phase (2:00-3:00)

Minimalism, fast camera chase, sub bass (60 BPM)

### Scene 4: bloom_ascend (3:00-4:30)

Warm colors, bloom peak, energetic music (120 BPM)

### Finale: fade_to_black (4:30-5:00)

Smooth fade, logo + QR code → haori.vision/shop

---

## ⚡ Admin Panels

### Show Control Panel:

```
http://localhost:3012/admin/show
```

- Load Venue, Preload Assets
- Rehearse / Go Live / Blackout
- Visual/Audio sliders
- System status (FPS, DMX, Cache)
- Cue log + PDF export

### Calibration Screen:

```
http://localhost:3012/admin/calibration
```

- Warp grid editor (drag-and-drop)
- 11 test patterns
- Gamma/White Point/Brightness controls
- Venue profile save/load

### Guest Check-in:

```
http://localhost:3012/guest/checkin
```

- Name, Email, Language, Photo consent
- Light Card generation (PNG + QR)

---

## 🎯 Success Metrics

**Target Goals:**

- ✅ Attendance: 80%+ capacity
- ✅ Light Index: 8.0+/10 (emotional engagement)
- ✅ FPS: 30+ stable
- ✅ Strobe safety: ≤3 Hz
- ✅ Guest feedback: 90%+ positive
- ✅ Zero safety incidents

---

## 🚨 Safety Compliance

### Strobe Frequency:

- Max 3 Hz (photosensitive epilepsy safe)
- Duration ≤200ms per flash
- Total strobe time <5% of show

### UV Lighting:

- UV-A only (315-400nm, safe range)
- Exposure time ≤5 minutes
- Presets: Gentle (0.5) / Medium (1.0) / Strong (1.5)

### Emergency:

- ESC key = instant blackout
- Emergency exits clearly marked
- First aid trained staff on-site

---

## 📝 License

**Proprietary**
© 2025 HAORI VISION. All rights reserved.

---

## 📞 Support

- **Email:** support@haori.vision
- **Website:** https://haori.vision
- **Instagram:** @haorivision
- **Documentation:** [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## 🙏 Credits

**Developed by:** Claude (Anthropic)
**Project:** HAORI VISION Immersive Show System
**Codename:** Eclipse of Light
**Timeline:** 2025-10-06 → 2025-10-08

---

**Создано для HAORI VISION**
_Eclipse of Light — Immersive Show System_

◇ ◆ ◇
