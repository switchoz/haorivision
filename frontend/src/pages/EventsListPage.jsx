import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageMeta from "../components/PageMeta";

/**
 * Events List Page - Все Glow Rituals
 */

export default function EventsListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter);
      }

      const response = await fetch(`/api/events?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setEvents(data.events);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load events:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black text-white">
      <PageMeta
        title="События"
        description="События и мероприятия HAORI VISION. Выставки, показы, встречи с художником."
      />
      {/* Header */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-violet-300 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Glow Rituals
          </motion.h1>

          <motion.p
            className="text-xl text-purple-300 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Трансформирующие события на границе искусства, света и технологии
          </motion.p>

          {/* Filters */}
          <div className="flex justify-center gap-4 mb-12">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="Все"
            />
            <FilterButton
              active={filter === "announced"}
              onClick={() => setFilter("announced")}
              label="Анонсированы"
            />
            <FilterButton
              active={filter === "happening"}
              onClick={() => setFilter("happening")}
              label="Сейчас"
            />
            <FilterButton
              active={filter === "completed"}
              onClick={() => setFilter("completed")}
              label="Завершены"
            />
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center text-purple-400 text-xl">
              Загрузка событий...
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-xl">Пока нет событий в этой категории</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => (
                <EventCard key={event._id} event={event} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Filter Button
function FilterButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-full transition-all ${
        active
          ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
          : "bg-white/10 text-gray-400 hover:bg-white/20"
      }`}
    >
      {label}
    </button>
  );
}

// Event Card
function EventCard({ event, index }) {
  const getStatusBadge = (status) => {
    const badges = {
      draft: { text: "Черновик", color: "bg-gray-500/20 text-gray-400" },
      announced: { text: "Анонсирован", color: "bg-blue-500/20 text-blue-400" },
      happening: { text: "🔴 Сейчас", color: "bg-red-500/20 text-red-400" },
      completed: { text: "Завершён", color: "bg-green-500/20 text-green-400" },
      cancelled: { text: "Отменён", color: "bg-gray-500/20 text-gray-400" },
    };

    return badges[status] || badges.draft;
  };

  const statusBadge = getStatusBadge(event.status);

  const getDaysUntil = (date) => {
    const diff = new Date(date) - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "Прошло";
    if (days === 0) return "Сегодня";
    if (days === 1) return "Завтра";
    return `Через ${days} дней`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Link to={`/events/${event.slug}`}>
        <div className="group bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-2xl overflow-hidden hover:border-purple-500/60 transition-all duration-300">
          {/* Cover Image */}
          <div className="relative h-64 bg-gradient-to-br from-purple-900 to-violet-600 overflow-hidden">
            {event.media?.coverImage ? (
              <img
                src={event.media.coverImage}
                alt={event.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl opacity-50">✨</div>
              </div>
            )}

            {/* Status Badge */}
            <div
              className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm ${statusBadge.color}`}
            >
              {statusBadge.text}
            </div>

            {/* Featured Badge */}
            {event.featured && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400">
                ⭐ Featured
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-2 text-purple-300 group-hover:text-purple-200 transition-colors">
              {event.name}
            </h3>

            {event.tagline && (
              <p className="text-sm text-gray-400 italic mb-4">
                {event.tagline}
              </p>
            )}

            {/* Event Type */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-purple-500/20 rounded-full text-xs text-purple-300 uppercase">
                {event.type}
              </span>
              <span className="text-sm text-purple-400">
                {event.performance?.totalDuration} мин
              </span>
            </div>

            {/* Date & Venue */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <span>📅</span>
                <span>
                  {new Date(event.dates.start).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <span>📍</span>
                <span>{event.venue?.city || "TBA"}</span>
              </div>

              <div className="flex items-center gap-2 text-purple-400 font-semibold">
                <span>⏰</span>
                <span>{getDaysUntil(event.dates.start)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
              <div className="text-sm text-gray-400">
                👥 {event.attendance?.registered || 0} /{" "}
                {event.attendance?.capacity || 0}
              </div>

              {event.certificate && (
                <div className="text-sm text-purple-400">
                  🎫 Сертификат участника
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="mt-4">
              <div className="text-center py-3 bg-gradient-to-r from-purple-600/30 to-violet-600/30 rounded-lg text-purple-300 group-hover:from-purple-600/50 group-hover:to-violet-600/50 transition-all">
                Узнать больше →
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
