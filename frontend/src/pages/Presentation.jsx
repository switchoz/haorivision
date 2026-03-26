import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import PageMeta from "../components/PageMeta";
import WorkModal from "../components/gallery/WorkModal";
import { paintings, graphics, artistInfo } from "../data/artist-works";

const HAORI_IMG = "/artist/haori-presentation.jpg";

const { exhibitions, galleries } = artistInfo;

const formatPrice = (p) => (p ? p.toLocaleString("ru-RU") + " ₽" : null);
const statusText = (s) =>
  s === "sold"
    ? "ПРОДАНО"
    : s === "private"
      ? "ЧАСТНАЯ КОЛЛЕКЦИЯ"
      : s
        ? s.toUpperCase()
        : null;

export default function HaoriVisionPresentation() {
  const [uvMode, setUvMode] = useState(false);
  const [section, setSection] = useState(0);
  const [entered, setEntered] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [hoveredWork, setHoveredWork] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [galleryTab, setGalleryTab] = useState("paintings");

  const works = galleryTab === "paintings" ? paintings : graphics;

  useEffect(() => {
    if (entered) setTimeout(() => setLoaded(true), 100);
  }, [entered]);

  const totalSections = 6;
  const accent = uvMode ? "255,0,180" : "0,255,180";
  const accentHex = uvMode ? "#ff00b4" : "#00ffb4";

  const openWork = (w) => setSelectedWork(w);

  if (!entered) {
    return (
      <div
        style={{
          height: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
          position: "relative",
        }}
        onClick={() => setEntered(true)}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Unbounded:wght@200;300;400;700&display=swap');
          *{margin:0;padding:0;box-sizing:border-box}
          @keyframes breathe{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
          @keyframes enterPulse{0%,100%{opacity:.4}50%{opacity:1}}
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes spiralIn{0%{transform:rotate(0) scale(0);opacity:0}100%{transform:rotate(720deg) scale(1);opacity:1}}
        `}</style>
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(0,255,180,.08) 0%,transparent 70%)",
            animation: "breathe 4s ease-in-out infinite",
          }}
        />
        <div style={{ textAlign: "center", zIndex: 2 }}>
          <div
            style={{
              width: 80,
              height: 80,
              margin: "0 auto 40px",
              border: "1px solid rgba(0,255,180,.4)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "spiralIn 2s cubic-bezier(.34,1.56,.64,1) forwards",
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path
                d="M20 5C20 5,35 15,30 25C25 35,15 35,10 25C5 15,20 5,20 5"
                fill="none"
                stroke="rgba(0,255,180,.6)"
                strokeWidth="1.5"
              />
              <circle cx="20" cy="20" r="3" fill="rgba(0,255,180,.8)" />
            </svg>
          </div>
          <div
            style={{
              fontFamily: "'Unbounded',sans-serif",
              fontSize: 14,
              letterSpacing: 12,
              color: "rgba(0,255,180,.8)",
              textTransform: "uppercase",
              marginBottom: 16,
              animation: "fadeIn 2s ease .5s both",
            }}
          >
            HaoriVision
          </div>
          <div
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 13,
              color: "rgba(255,255,255,.4)",
              letterSpacing: 3,
              animation: "enterPulse 3s ease-in-out infinite",
              marginTop: 40,
            }}
          >
            ВОЙТИ В ПРОСТРАНСТВО
          </div>
        </div>
      </div>
    );
  }

  const bg = uvMode
    ? "radial-gradient(ellipse at 30% 50%,rgba(80,0,160,.4) 0%,transparent 60%),radial-gradient(ellipse at 70% 30%,rgba(120,0,200,.3) 0%,transparent 50%),#0a0012"
    : "radial-gradient(ellipse at 50% 0%,rgba(15,15,30,1) 0%,#000 70%)";

  return (
    <div
      style={{
        height: "100vh",
        background: bg,
        color: "#fff",
        fontFamily: "'Cormorant Garamond',serif",
        overflow: "hidden",
        position: "relative",
        transition: "background 1.5s",
      }}
    >
      <PageMeta
        title="Презентация"
        description="Презентация HAORI VISION и художника Елизаветы Федькиной (LiZa). Интуитивная живопись, UV-арт."
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Unbounded:wght@200;300;400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
        @keyframes uvFlicker{0%,93%,100%{opacity:1}95%{opacity:.7}97%{opacity:1}98%{opacity:.5}}
        @keyframes breathe{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(${accent},.2)}50%{box-shadow:0 0 40px rgba(${accent},.5)}}
        .work-card:hover{transform:translateY(-4px)!important;border-color:rgba(${accent},.5)!important;box-shadow:0 8px 32px rgba(${accent},.15)!important}
        .nav-btn:hover{color:rgba(${accent},1)!important}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:2px}
        @media(max-width:768px){
          .pres-grid-2{grid-template-columns:1fr!important}
          .pres-grid-3{grid-template-columns:1fr!important}
          .pres-grid-4{grid-template-columns:repeat(2,1fr)!important}
          .pres-content{padding:0 24px!important}
          .pres-stats{gap:24px!important}
        }
      `}</style>

      {/* UV Toggle */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: "'Unbounded',sans-serif",
            fontSize: 9,
            letterSpacing: 3,
            color: `rgba(${accent},.8)`,
            transition: "color .5s",
          }}
        >
          UV
        </span>
        <div
          onClick={() => setUvMode(!uvMode)}
          style={{
            width: 52,
            height: 28,
            borderRadius: 14,
            background: uvMode
              ? "linear-gradient(135deg,#8b00ff,#ff00b4)"
              : "rgba(255,255,255,.1)",
            border: uvMode
              ? "1px solid rgba(255,0,180,.5)"
              : "1px solid rgba(255,255,255,.2)",
            cursor: "pointer",
            position: "relative",
            transition: "all .5s",
            boxShadow: uvMode ? "0 0 30px rgba(139,0,255,.4)" : "none",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: 2,
              left: uvMode ? 27 : 3,
              transition: "all .5s",
              boxShadow: uvMode ? "0 0 15px rgba(255,255,255,.6)" : "none",
            }}
          />
        </div>
      </div>

      {/* Brand */}
      <div style={{ position: "absolute", top: 24, left: 32, zIndex: 200 }}>
        <div
          style={{
            fontFamily: "'Unbounded',sans-serif",
            fontSize: 11,
            letterSpacing: 6,
            color: `rgba(${accent},.5)`,
            transition: "color 1s",
          }}
        >
          HAORIVISION
        </div>
      </div>

      {/* Section nav */}
      <div
        style={{
          position: "absolute",
          right: 24,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 200,
        }}
      >
        {Array.from({ length: totalSections }).map((_, i) => (
          <div
            key={i}
            onClick={() => setSection(i)}
            style={{
              width: 3,
              height: section === i ? 24 : 8,
              borderRadius: 2,
              background:
                section === i ? `rgba(${accent},.9)` : "rgba(255,255,255,.2)",
              cursor: "pointer",
              transition: "all .5s",
            }}
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 40,
          zIndex: 200,
        }}
      >
        {section > 0 && (
          <div
            className="nav-btn"
            onClick={() => setSection((s) => s - 1)}
            style={{
              fontFamily: "'Unbounded',sans-serif",
              fontSize: 10,
              letterSpacing: 4,
              color: "rgba(255,255,255,.4)",
              cursor: "pointer",
              transition: "color .3s",
            }}
          >
            ← НАЗАД
          </div>
        )}
        {section < totalSections - 1 && (
          <div
            className="nav-btn"
            onClick={() => setSection((s) => s + 1)}
            style={{
              fontFamily: "'Unbounded',sans-serif",
              fontSize: 10,
              letterSpacing: 4,
              color: `rgba(${accent},.6)`,
              cursor: "pointer",
              transition: "color .3s",
            }}
          >
            ДАЛЕЕ →
          </div>
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedWork && (
          <WorkModal
            work={selectedWork}
            isUV={uvMode}
            onClose={() => setSelectedWork(null)}
          />
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 clamp(16px, 5vw, 80px)",
        }}
      >
        {/* 0: Hero */}
        {section === 0 && loaded && (
          <div
            style={{
              textAlign: "center",
              maxWidth: 800,
              animation: "slideUp 1s cubic-bezier(.16,1,.3,1) both",
            }}
          >
            <div
              style={{
                fontFamily: "'Unbounded',sans-serif",
                fontSize: 10,
                letterSpacing: 8,
                color: `rgba(${accent},.5)`,
                marginBottom: 32,
                transition: "color 1s",
              }}
            >
              ИНТУИТИВНАЯ ЖИВОПИСЬ
            </div>
            <h1
              style={{
                fontSize: "clamp(36px,7vw,72px)",
                fontWeight: 300,
                lineHeight: 1.1,
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  background: uvMode
                    ? "linear-gradient(135deg,#ff00b4,#8b00ff,#00ffcc)"
                    : "linear-gradient(135deg,#fff,rgba(0,255,180,.7))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  transition: "all 1.5s",
                }}
              >
                Елизавета Федькина
              </span>
            </h1>
            <div
              style={{
                width: 60,
                height: 1,
                background: `linear-gradient(90deg,transparent,rgba(${accent},.4),transparent)`,
                margin: "0 auto 32px",
                transition: "background 1s",
              }}
            />
            <p
              style={{
                fontSize: 22,
                fontStyle: "italic",
                fontWeight: 300,
                color: "rgba(255,255,255,.5)",
                lineHeight: 1.6,
              }}
            >
              «Мои картины — это порталы в другие измерения»
            </p>
            <div
              style={{
                marginTop: 48,
                display: "flex",
                justifyContent: "center",
                gap: 48,
              }}
            >
              {[
                { num: "50+", label: "работ" },
                { num: "4", label: "галереи" },
                { num: "2022", label: "диплом II°" },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    animation: `slideUp 1s cubic-bezier(.16,1,.3,1) ${0.3 + i * 0.15}s both`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Unbounded',sans-serif",
                      fontSize: 24,
                      fontWeight: 200,
                      color: `rgba(${accent},.7)`,
                      transition: "color 1s",
                    }}
                  >
                    {s.num}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      letterSpacing: 2,
                      color: "rgba(255,255,255,.3)",
                      marginTop: 4,
                      fontFamily: "'Unbounded',sans-serif",
                      fontWeight: 200,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1: About */}
        {section === 1 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 60,
              maxWidth: 1000,
              alignItems: "center",
              animation: "slideUp 1s cubic-bezier(.16,1,.3,1) both",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Unbounded',sans-serif",
                  fontSize: 9,
                  letterSpacing: 6,
                  color: `rgba(${accent},.4)`,
                  marginBottom: 24,
                }}
              >
                ОБ АВТОРЕ
              </div>
              <h2
                style={{
                  fontSize: 36,
                  fontWeight: 300,
                  lineHeight: 1.3,
                  marginBottom: 24,
                }}
              >
                Картины из будущего
              </h2>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,.5)",
                  marginBottom: 20,
                }}
              >
                Промышленный дизайн → стилистика → искусствоведение. Дипломная
                работа о принципах интуитивного творчества.
              </p>
              <div
                style={{
                  fontFamily: "'Unbounded',sans-serif",
                  fontSize: 9,
                  letterSpacing: 4,
                  color: `rgba(${accent},.4)`,
                  marginBottom: 12,
                  marginTop: 32,
                }}
              >
                ВЫСТАВКИ
              </div>
              {exhibitions.map((e, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(255,255,255,.06)",
                    display: "flex",
                    gap: 16,
                    alignItems: "baseline",
                    animation: `slideUp .8s cubic-bezier(.16,1,.3,1) ${i * 0.1}s both`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Unbounded',sans-serif",
                      fontSize: 11,
                      color: `rgba(${accent},.6)`,
                      minWidth: 40,
                    }}
                  >
                    {e.year}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, marginBottom: 2 }}>
                      {e.title}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}
                    >
                      {e.venue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Unbounded',sans-serif",
                  fontSize: 9,
                  letterSpacing: 4,
                  color: `rgba(${accent},.4)`,
                  marginBottom: 12,
                }}
              >
                ГАЛЕРЕИ
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {galleries.map((g, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 16px",
                      border: `1px solid rgba(${accent},.15)`,
                      borderRadius: 20,
                      fontSize: 13,
                      color: "rgba(255,255,255,.6)",
                      animation: `slideUp .6s cubic-bezier(.16,1,.3,1) ${i * 0.08}s both`,
                    }}
                  >
                    {g}
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 32,
                  padding: 20,
                  border: `1px solid rgba(${accent},.15)`,
                  borderRadius: 8,
                  background: "rgba(255,255,255,.02)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Unbounded',sans-serif",
                    fontSize: 8,
                    letterSpacing: 3,
                    color: "rgba(255,255,255,.3)",
                    marginBottom: 8,
                  }}
                >
                  КОНТАКТ
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,.6)",
                    marginBottom: 4,
                  }}
                >
                  @diko.rativno
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,.6)" }}>
                  Москва
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2: UV Reveal concept */}
        {section === 2 && (
          <div
            style={{
              textAlign: "center",
              maxWidth: 900,
              animation: "slideUp 1s cubic-bezier(.16,1,.3,1) both",
            }}
          >
            <div
              style={{
                fontFamily: "'Unbounded',sans-serif",
                fontSize: 9,
                letterSpacing: 6,
                color: `rgba(${accent},.5)`,
                marginBottom: 32,
              }}
            >
              ХАОРИ × ИНТУИТИВНАЯ ЖИВОПИСЬ
            </div>
            <h2
              style={{
                fontSize: "clamp(28px,5vw,48px)",
                fontWeight: 300,
                lineHeight: 1.2,
                marginBottom: 40,
              }}
            >
              <span
                style={{
                  color: uvMode
                    ? "rgba(255,255,255,.3)"
                    : "rgba(255,255,255,.9)",
                  transition: "color 1s",
                }}
              >
                Днём — одежда.{" "}
              </span>
              <span
                style={{
                  color: uvMode ? "#fff" : "rgba(255,255,255,.3)",
                  transition: "color 1s",
                  textShadow: uvMode ? "0 0 40px rgba(255,0,180,.6)" : "none",
                  animation: uvMode ? "uvFlicker 3s infinite" : "none",
                }}
              >
                Ночью — портал.
              </span>
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 32,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: uvMode
                    ? "2px solid rgba(255,0,180,.5)"
                    : "2px solid rgba(255,255,255,.08)",
                  transition: "border-color 1s",
                  boxShadow: uvMode ? "0 0 60px rgba(139,0,255,.3)" : "none",
                  position: "relative",
                }}
              >
                <img
                  src={HAORI_IMG}
                  alt="HaoriVision UV"
                  style={{
                    width: "100%",
                    display: "block",
                    filter: uvMode
                      ? "saturate(1.3) brightness(1.1)"
                      : "saturate(.8) brightness(.7)",
                    transition: "filter 1.5s",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "20px",
                    background: "linear-gradient(transparent,rgba(0,0,0,.8))",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Unbounded',sans-serif",
                      fontSize: 9,
                      letterSpacing: 4,
                      color: uvMode
                        ? "rgba(255,0,180,.8)"
                        : "rgba(0,255,180,.6)",
                    }}
                  >
                    ПЕРВОЕ ХАОРИ · UV-РЕЖИМ
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "left" }}>
                <p
                  style={{
                    fontSize: 17,
                    color: "rgba(255,255,255,.6)",
                    lineHeight: 1.8,
                    marginBottom: 20,
                  }}
                >
                  Флуоресцентные краски, ручная роспись, UV-реактивные пигменты.
                </p>
                <p
                  style={{
                    fontSize: 17,
                    color: "rgba(255,255,255,.6)",
                    lineHeight: 1.8,
                    marginBottom: 24,
                  }}
                >
                  Каждое хаори живёт двойной жизнью — видимой и скрытой.
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {[
                    "Спиральные мотивы — подпись LiZa",
                    "Солярный символ — энергетическое ядро",
                    "Силуэтный слой — глубина проявления",
                  ].map((t, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        animation: `slideUp .6s cubic-bezier(.16,1,.3,1) ${i * 0.12}s both`,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: accentHex,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{ fontSize: 14, color: "rgba(255,255,255,.5)" }}
                      >
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  onClick={() => setUvMode(!uvMode)}
                  style={{
                    marginTop: 24,
                    padding: "12px 24px",
                    border: `1px solid rgba(${accent},.4)`,
                    borderRadius: 6,
                    display: "inline-block",
                    cursor: "pointer",
                    fontFamily: "'Unbounded',sans-serif",
                    fontSize: 10,
                    letterSpacing: 3,
                    color: `rgba(${accent},.8)`,
                    transition: "all .3s",
                  }}
                >
                  {uvMode ? "ВЫКЛЮЧИТЬ UV" : "ВКЛЮЧИТЬ UV ⚡"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3: Gallery */}
        {section === 3 && (
          <div
            style={{
              maxWidth: 1100,
              width: "100%",
              animation: "slideUp 1s cubic-bezier(.16,1,.3,1) both",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Unbounded',sans-serif",
                    fontSize: 9,
                    letterSpacing: 6,
                    color: `rgba(${accent},.4)`,
                    marginBottom: 8,
                  }}
                >
                  ГАЛЕРЕЯ РАБОТ
                </div>
                <h2 style={{ fontSize: 32, fontWeight: 300 }}>Каталог</h2>
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                {[
                  {
                    id: "paintings",
                    label: "Живопись",
                    count: paintings.length,
                  },
                  { id: "graphics", label: "Графика", count: graphics.length },
                ].map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => setGalleryTab(tab.id)}
                    style={{
                      fontFamily: "'Unbounded',sans-serif",
                      fontSize: 10,
                      letterSpacing: 3,
                      padding: "8px 16px",
                      borderRadius: 20,
                      cursor: "pointer",
                      transition: "all .3s",
                      border: `1px solid rgba(${accent},${galleryTab === tab.id ? 0.4 : 0.1})`,
                      color:
                        galleryTab === tab.id
                          ? `rgba(${accent},.9)`
                          : "rgba(255,255,255,.3)",
                      background:
                        galleryTab === tab.id
                          ? `rgba(${accent},.08)`
                          : "transparent",
                    }}
                  >
                    {tab.label}{" "}
                    <span style={{ opacity: 0.4, marginLeft: 4 }}>
                      {tab.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="pres-grid-4"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                maxHeight: "62vh",
                overflowY: "auto",
                paddingRight: 8,
              }}
            >
              {works.map((w, i) => (
                <div
                  key={i}
                  className="work-card"
                  onClick={() => openWork(w)}
                  onMouseEnter={() => setHoveredWork(i)}
                  onMouseLeave={() => setHoveredWork(null)}
                  style={{
                    border: `1px solid rgba(${accent},${hoveredWork === i ? 0.3 : 0.08})`,
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all .4s cubic-bezier(.16,1,.3,1)",
                    background:
                      hoveredWork === i
                        ? `rgba(${accent},.05)`
                        : "rgba(255,255,255,.02)",
                    overflow: "hidden",
                    animation: `slideUp .8s cubic-bezier(.16,1,.3,1) ${i * 0.06}s both`,
                  }}
                >
                  {/* Work photo */}
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={w.img}
                      alt={w.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform .5s,filter 1s",
                        transform:
                          hoveredWork === i ? "scale(1.08)" : "scale(1)",
                        filter: uvMode
                          ? "saturate(1.3) brightness(1.1)"
                          : "saturate(.9) brightness(.85)",
                      }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(0deg,rgba(0,0,0,.7) 0%,transparent 50%)",
                      }}
                    />
                    {/* Color dots */}
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        display: "flex",
                        gap: 4,
                      }}
                    >
                      {w.colors.map((c, j) => (
                        <div
                          key={j}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: c,
                            border: "1px solid rgba(255,255,255,.2)",
                            boxShadow: uvMode ? `0 0 8px ${c}` : "none",
                          }}
                        />
                      ))}
                    </div>
                    {/* Status badge */}
                    {statusText(w.status) && (
                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          fontFamily: "'Unbounded',sans-serif",
                          fontSize: 7,
                          letterSpacing: 2,
                          padding: "4px 8px",
                          borderRadius: 4,
                          background: "rgba(0,0,0,.6)",
                          color: `rgba(${accent},.8)`,
                          backdropFilter: "blur(4px)",
                        }}
                      >
                        {statusText(w.status)}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ padding: "12px 14px 14px" }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 400,
                        marginBottom: 4,
                        color: "rgba(255,255,255,.85)",
                      }}
                    >
                      {w.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Unbounded',sans-serif",
                          fontSize: 8,
                          letterSpacing: 2,
                          color: "rgba(255,255,255,.3)",
                        }}
                      >
                        {w.size} · {w.year}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Unbounded',sans-serif",
                          fontSize: 9,
                          color: w.price
                            ? `rgba(${accent},.7)`
                            : "rgba(255,255,255,.3)",
                        }}
                      >
                        {formatPrice(w.price) || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4: Technique */}
        {section === 4 && (
          <div
            style={{
              maxWidth: 900,
              animation: "slideUp 1s cubic-bezier(.16,1,.3,1) both",
            }}
          >
            <div
              style={{
                fontFamily: "'Unbounded',sans-serif",
                fontSize: 9,
                letterSpacing: 6,
                color: `rgba(${accent},.4)`,
                marginBottom: 16,
              }}
            >
              ПРОЦЕСС
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 300, marginBottom: 40 }}>
              Как рождается хаори
            </h2>
            <div
              className="pres-grid-3"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 24,
              }}
            >
              {[
                {
                  num: "01",
                  title: "Интуитивный поток",
                  desc: "Образ рождается из эмоции, слова, имени. Художник входит в потоковое состояние — и линия ведёт сама.",
                },
                {
                  num: "02",
                  title: "Перенос на ткань",
                  desc: "Орнаменты адаптируются под форму хаори. Многослойная роспись вручную — акрил и флуоресцентные пигменты.",
                },
                {
                  num: "03",
                  title: "UV-слой",
                  desc: "Скрытый рисунок наносится UV-реактивными красками. При обычном свете невидим — при ультрафиолете проявляется.",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    padding: 24,
                    border: `1px solid rgba(${accent},.1)`,
                    borderRadius: 8,
                    background: "rgba(255,255,255,.02)",
                    animation: `slideUp .8s cubic-bezier(.16,1,.3,1) ${i * 0.15}s both`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Unbounded',sans-serif",
                      fontSize: 32,
                      fontWeight: 200,
                      color: `rgba(${accent},.2)`,
                      marginBottom: 16,
                    }}
                  >
                    {step.num}
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 400, marginBottom: 12 }}
                  >
                    {step.title}
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,.45)",
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 32,
                padding: 20,
                border: `1px solid rgba(${accent},.15)`,
                borderRadius: 8,
                display: "flex",
                gap: 32,
                justifyContent: "center",
              }}
            >
              {[
                {
                  l: "ОСНОВНАЯ ТЕХНИКА",
                  v: "Акрил на пастельной бумаге / текстиле",
                },
                { l: "ФОРМАТЫ", v: "70×100, 50×65, A3, A4 + хаори" },
                { l: "ЦЕНОВОЙ ДИАПАЗОН", v: "15 015 – 98 989 ₽" },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'Unbounded',sans-serif",
                      fontSize: 8,
                      letterSpacing: 3,
                      color: "rgba(255,255,255,.3)",
                      marginBottom: 6,
                    }}
                  >
                    {item.l}
                  </div>
                  <div style={{ fontSize: 14, color: `rgba(${accent},.7)` }}>
                    {item.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5: CTA */}
        {section === 5 && (
          <div
            style={{
              textAlign: "center",
              maxWidth: 600,
              animation: "slideUp 1s cubic-bezier(.16,1,.3,1) both",
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                margin: "0 auto 40px",
                border: `1px solid rgba(${accent},.2)`,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "breathe 4s ease-in-out infinite",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40">
                <path
                  d="M20 5C20 5,35 15,30 25C25 35,15 35,10 25C5 15,20 5,20 5"
                  fill="none"
                  stroke={accentHex}
                  strokeWidth="1.5"
                  opacity=".5"
                />
                <circle cx="20" cy="20" r="3" fill={accentHex} opacity=".7" />
              </svg>
            </div>
            <h2
              style={{
                fontSize: 40,
                fontWeight: 300,
                marginBottom: 16,
                background: uvMode
                  ? "linear-gradient(135deg,#ff00b4,#8b00ff)"
                  : "linear-gradient(135deg,#fff,rgba(0,255,180,.6))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              HaoriVision × Федькина
            </h2>
            <p
              style={{
                fontSize: 18,
                fontWeight: 300,
                color: "rgba(255,255,255,.4)",
                lineHeight: 1.8,
                marginBottom: 40,
              }}
            >
              Ручная роспись. Флуоресцентные краски.
              <br />
              Каждое хаори — уникальный портал.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              {[
                { l: "Instagram", v: "@diko.rativno" },
                { l: "Город", v: "Москва" },
                { l: "Email", v: "iesm144@yandex.ru" },
              ].map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 28px",
                    border: `1px solid rgba(${accent},.2)`,
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Unbounded',sans-serif",
                      fontSize: 8,
                      letterSpacing: 3,
                      color: "rgba(255,255,255,.3)",
                      marginBottom: 6,
                    }}
                  >
                    {c.l}
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.7)" }}>
                    {c.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
