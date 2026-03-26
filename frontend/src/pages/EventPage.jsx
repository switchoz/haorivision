import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageMeta from "../components/PageMeta";

/**
 * Event Landing Page - Glow Ritual
 * Автоматически генерируемый лендинг для событий
 */

export default function EventPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState(null);

  // Загрузить событие
  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${slug}`);
      const data = await response.json();

      if (data.success) {
        setEvent(data.event);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load event:", error);
      setLoading(false);
    }
  };

  // RSVP
  const handleRSVP = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/events/${event._id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: rsvpEmail,
          status: "confirmed",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRsvpStatus("confirmed");
      } else {
        setRsvpStatus("error");
      }
    } catch (error) {
      setRsvpStatus("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-purple-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400 text-xl">Event not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white">
      <PageMeta
        title="Событие"
        description="Событие HAORI VISION — выставки, показы, встречи с художником."
      />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-violet-900/20" />

        {/* Animated glow orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
              {event.name}
            </h1>

            {event.tagline && (
              <p className="text-2xl text-purple-300 mb-12 italic">
                {event.tagline}
              </p>
            )}

            <CountdownTimer targetDate={event.dates.start} />

            {/* Event Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <InfoCard icon="📍" title="Место" value={event.venue.name} />
              <InfoCard
                icon="📅"
                title="Дата"
                value={new Date(event.dates.start).toLocaleDateString("ru-RU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              />
              <InfoCard
                icon="⏰"
                title="Время"
                value={new Date(event.dates.doors).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            </div>

            {/* RSVP Button */}
            <motion.a
              href="#rsvp"
              className="inline-block mt-12 px-12 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full text-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Подтвердить участие
            </motion.a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-purple-400 text-sm">↓ Scroll</div>
        </motion.div>
      </section>

      {/* Description Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-purple-300">О событии</h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            {event.description?.long ||
              event.description?.short ||
              "Эксклюзивный Glow Ritual от HAORI VISION"}
          </p>

          {/* Venue Details */}
          <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">
              📍 Локация
            </h3>
            <p className="text-lg mb-2">{event.venue.name}</p>
            <p className="text-gray-400">
              {event.venue.address}, {event.venue.city}
            </p>
            {event.venue.capacity && (
              <p className="text-sm text-purple-300 mt-4">
                Вместимость: {event.venue.capacity} человек
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Performance Scenario - 3 Phases */}
      <section className="py-20 px-6 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            Сценарий Ритуала
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PhaseCard
              phase={1}
              name={event.performance.scenario.phase1.name}
              duration={event.performance.scenario.phase1.duration}
              description={event.performance.scenario.phase1.description}
              lighting={event.performance.scenario.phase1.lighting}
              music={event.performance.scenario.phase1.music}
              gradient="from-gray-900 to-purple-900"
            />

            <PhaseCard
              phase={2}
              name={event.performance.scenario.phase2.name}
              duration={event.performance.scenario.phase2.duration}
              description={event.performance.scenario.phase2.description}
              lighting={event.performance.scenario.phase2.lighting}
              music={event.performance.scenario.phase2.music}
              gradient="from-purple-900 to-violet-600"
            />

            <PhaseCard
              phase={3}
              name={event.performance.scenario.phase3.name}
              duration={event.performance.scenario.phase3.duration}
              description={event.performance.scenario.phase3.description}
              lighting={event.performance.scenario.phase3.lighting}
              music={event.performance.scenario.phase3.music}
              gradient="from-violet-600 to-purple-300"
            />
          </div>

          <p className="text-center text-purple-300 mt-12 text-lg">
            ⏱️ Общая длительность: {event.performance.totalDuration} минут
          </p>
        </div>
      </section>

      {/* Ambiance */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center text-purple-300">
            Атмосфера
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">
                👔 Dress Code
              </h3>
              <p className="text-gray-300">{event.ambiance.dress_code}</p>
            </div>

            <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">
                ✨ Vibes
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.ambiance.vibes.map((vibe, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-300"
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Playlist */}
          {event.ambiance.playlist && event.ambiance.playlist.length > 0 && (
            <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-semibold mb-6 text-purple-400">
                🎵 Ambient Playlist
              </h3>
              <div className="space-y-3">
                {event.ambiance.playlist.map((track, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span className="text-gray-400">{track.artist}</span>
                      <span className="mx-2 text-purple-500">—</span>
                      <span className="text-white">{track.track}</span>
                    </div>
                    <span className="text-xs text-purple-400">
                      {track.phase}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RSVP Form */}
      <section id="rsvp" className="py-20 px-6 bg-black/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            Подтверди участие
          </h2>

          {rsvpStatus === "confirmed" ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-8">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-2xl font-semibold mb-2">RSVP подтверждён!</h3>
              <p className="text-gray-300 mb-4">Увидимся на {event.name}!</p>
              <p className="text-sm text-purple-300">
                🎫 После события ты получишь памятный сертификат участника
              </p>
            </div>
          ) : (
            <form onSubmit={handleRSVP} className="space-y-6">
              <div className="bg-white/5 border border-purple-500/30 rounded-2xl p-8">
                <p className="text-gray-300 mb-6">
                  Это событие доступно только для VIP-клиентов HAORI VISION.
                  <br />
                  Введи email для подтверждения.
                </p>

                <input
                  type="email"
                  value={rsvpEmail}
                  onChange={(e) => setRsvpEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-6 py-4 bg-white/10 border border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors"
                />

                <button
                  type="submit"
                  className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl font-semibold hover:from-purple-500 hover:to-violet-500 transition-all"
                >
                  Подтвердить участие
                </button>

                <p className="text-xs text-gray-500 mt-4">
                  🔒 Твои данные защищены и не будут переданы третьим лицам
                </p>
              </div>
            </form>
          )}

          {/* Participation Badge */}
          <div className="mt-12 bg-gradient-to-r from-purple-900/30 to-violet-900/30 border border-purple-500/30 rounded-2xl p-8">
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold mb-2">Сертификат участника</h3>
            <p className="text-gray-400 text-sm">
              Каждый участник получит уникальный памятный сертификат после
              события.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Countdown Timer Component
function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return null;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="text-3xl font-bold text-purple-400">
        🔴 Событие началось!
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-6 mb-8">
      <TimeUnit value={timeLeft.days} label="дней" />
      <TimeUnit value={timeLeft.hours} label="часов" />
      <TimeUnit value={timeLeft.minutes} label="минут" />
      <TimeUnit value={timeLeft.seconds} label="секунд" />
    </div>
  );
}

function TimeUnit({ value, label }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-purple-500/30 rounded-xl px-6 py-4 min-w-[100px]">
      <div className="text-4xl font-bold text-purple-300">{value}</div>
      <div className="text-sm text-gray-400 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

// Info Card Component
function InfoCard({ icon, title, value }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm text-gray-400 uppercase tracking-wide mb-1">
        {title}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

// Phase Card Component
function PhaseCard({
  phase,
  name,
  duration,
  description,
  lighting,
  music,
  gradient,
}) {
  return (
    <motion.div
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-8 border border-purple-500/30`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: phase * 0.2 }}
    >
      <div className="text-4xl font-bold text-purple-300 mb-4">
        Phase {phase}
      </div>
      <h3 className="text-2xl font-semibold mb-2">{name}</h3>
      <p className="text-sm text-purple-300 mb-4">{duration} минут</p>
      <p className="text-gray-300 mb-6 leading-relaxed">{description}</p>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-purple-400">💡 Lighting:</span>
          <p className="text-gray-400">{lighting}</p>
        </div>
        <div>
          <span className="text-purple-400">🎵 Music:</span>
          <p className="text-gray-400">{music}</p>
        </div>
      </div>
    </motion.div>
  );
}
