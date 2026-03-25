import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../api";
import Table from "../ui/Table";
import { tid } from "../../shared/testid";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
  Clock,
  Trash2,
  Edit3,
  Zap,
  BarChart3,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const postTypes = [
  "esoteric",
  "haori_work",
  "news",
  "promo",
  "behind_scenes",
] as const;
type PostType = (typeof postTypes)[number];

const typeLabels: Record<PostType, string> = {
  esoteric: "Эзотерика",
  haori_work: "Работы",
  news: "Новости",
  promo: "Промо",
  behind_scenes: "За кулисами",
};

const typeColors: Record<PostType, string> = {
  esoteric: "bg-violet-100 text-violet-800",
  haori_work: "bg-pink-100 text-pink-800",
  news: "bg-blue-100 text-blue-800",
  promo: "bg-amber-100 text-amber-800",
  behind_scenes: "bg-teal-100 text-teal-800",
};

const statusLabels: Record<string, string> = {
  "": "Все",
  draft: "Черновик",
  scheduled: "Запланирован",
  sent: "Отправлен",
  failed: "Ошибка",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-yellow-100 text-yellow-800",
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function Telegram() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [genType, setGenType] = useState<PostType>("haori_work");
  const [genTopic, setGenTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  // Edit modal
  const [editPost, setEditPost] = useState<any>(null);
  const [editText, setEditText] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [saving, setSaving] = useState(false);

  // Send raw modal
  const [showRaw, setShowRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  const [rawImage, setRawImage] = useState("");
  const [sendingRaw, setSendingRaw] = useState(false);

  const limit = 15;
  const pages = Math.ceil(total / limit);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: String(limit),
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(typeFilter ? { type: typeFilter } : {}),
        });
        const r = await api(`/api/telegram/posts?${qs.toString()}`);
        setItems(r.posts || []);
        setTotal(r.total || 0);
        setPage(r.page || 1);
      } catch {
        toast.error("Ошибка загрузки постов");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, typeFilter],
  );

  const loadStats = async () => {
    try {
      const r = await api("/api/telegram/stats");
      setStats(r.stats);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load(1);
    loadStats();
  }, []);

  // AI Generate
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await api("/api/telegram/generate", {
        method: "POST",
        body: JSON.stringify({
          type: genType,
          topic: genTopic || undefined,
        }),
      });
      if (r.success) {
        toast.success("Черновик создан");
        setShowGenerate(false);
        setGenTopic("");
        load(1);
      } else {
        toast.error(r.error || "Ошибка генерации");
      }
    } catch {
      toast.error("Ошибка генерации");
    } finally {
      setGenerating(false);
    }
  };

  // Publish
  const handlePublish = async (id: string) => {
    const toastId = toast.loading("Публикация...");
    try {
      const r = await api(`/api/telegram/publish/${id}`, { method: "POST" });
      if (r.success) {
        toast.success("Опубликовано в канал", { id: toastId });
        load(page);
        loadStats();
      } else {
        toast.error(r.error || "Ошибка", { id: toastId });
      }
    } catch {
      toast.error("Ошибка публикации", { id: toastId });
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Удалить черновик?")) return;
    try {
      await api(`/api/telegram/posts/${id}`, { method: "DELETE" });
      toast.success("Удалено");
      load(page);
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  // Edit save
  const handleSaveEdit = async () => {
    if (!editPost) return;
    setSaving(true);
    try {
      const body: any = {};
      if (editText !== editPost.text) body.text = editText;
      if (editSchedule) body.scheduledAt = new Date(editSchedule).toISOString();
      await api(`/api/telegram/posts/${editPost._id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success("Сохранено");
      setEditPost(null);
      load(page);
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // Send raw
  const handleSendRaw = async () => {
    if (!rawText.trim()) return;
    setSendingRaw(true);
    try {
      const r = await api("/api/telegram/send-raw", {
        method: "POST",
        body: JSON.stringify({
          text: rawText,
          imageUrl: rawImage || undefined,
        }),
      });
      if (r.success) {
        toast.success("Отправлено в канал");
        setShowRaw(false);
        setRawText("");
        setRawImage("");
        load(1);
        loadStats();
      } else {
        toast.error(r.error || "Ошибка");
      }
    } catch {
      toast.error("Ошибка отправки");
    } finally {
      setSendingRaw(false);
    }
  };

  const openEdit = (post: any) => {
    setEditPost(post);
    setEditText(post.text);
    setEditSchedule(
      post.scheduledAt
        ? new Date(post.scheduledAt).toISOString().slice(0, 16)
        : "",
    );
  };

  const head = ["Тип", "Текст", "Статус", "AI", "Дата", "Действия"];
  const rows = useMemo(
    () =>
      items.map((p: any) => [
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[p.type as PostType] || "bg-gray-100"}`}
        >
          {typeLabels[p.type as PostType] || p.type}
        </span>,
        <div className="max-w-xs truncate text-sm" title={p.text}>
          {p.text}
        </div>,
        <div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || ""}`}
          >
            {statusLabels[p.status] || p.status}
          </span>
          {p.scheduledAt && p.status === "scheduled" && (
            <div className="text-xs text-gray-500 mt-1">
              {new Date(p.scheduledAt).toLocaleString("ru-RU")}
            </div>
          )}
          {p.error && (
            <div
              className="text-xs text-red-500 mt-1 truncate max-w-[150px]"
              title={p.error}
            >
              {p.error}
            </div>
          )}
        </div>,
        p.aiGenerated ? (
          <Sparkles className="w-4 h-4 text-purple-500" />
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
        new Date(p.createdAt).toLocaleString("ru-RU"),
        <div className="flex items-center gap-1">
          {(p.status === "draft" || p.status === "scheduled") && (
            <>
              <button
                onClick={() => handlePublish(p._id)}
                className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600 transition-colors"
                title="Опубликовать"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={() => openEdit(p)}
                className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                title="Редактировать"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(p._id)}
                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {p.status === "failed" && (
            <button
              onClick={() => handlePublish(p._id)}
              className="p-1.5 hover:bg-yellow-50 rounded-lg text-gray-500 hover:text-yellow-600 transition-colors"
              title="Повторить"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}
        </div>,
      ]),
    [items],
  );

  return (
    <div className="space-y-6" {...tid("admin-telegram")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Telegram</h1>
          <p className="text-gray-600 mt-1">Управление постами в канале</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRaw(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <Send className="w-4 h-4" />
            Отправить текст
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4" />
            AI Генерация
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Всего", value: stats.total || 0, color: "text-gray-900" },
            {
              label: "Отправлено",
              value: stats.sent || 0,
              color: "text-green-600",
            },
            {
              label: "Черновики",
              value: stats.drafts || 0,
              color: "text-gray-500",
            },
            {
              label: "Запланировано",
              value: stats.scheduled || 0,
              color: "text-yellow-600",
            },
            {
              label: "Ошибки",
              value: stats.failed || 0,
              color: "text-red-500",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center"
            >
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {Object.entries(statusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Тип
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Все типы</option>
              {postTypes.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => load(1)}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mx-auto animate-spin" />
              ) : (
                "Применить"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Посты не найдены
          </div>
        ) : (
          <Table head={head} rows={rows} />
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => load(Math.max(1, page - 1))}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Назад
          </button>
          <div className="text-sm text-gray-600">
            Страница {page} из {pages}
          </div>
          <button
            disabled={page >= pages}
            onClick={() => load(Math.min(pages, page + 1))}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Вперёд
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                AI Генерация поста
              </h2>
              <button
                onClick={() => setShowGenerate(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип контента
                </label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as PostType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {postTypes.map((t) => (
                    <option key={t} value={t}>
                      {typeLabels[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тема (необязательно)
                </label>
                <input
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="О чём написать..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {generating ? "Генерация..." : "Сгенерировать черновик"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Редактирование
              </h2>
              <button
                onClick={() => setEditPost(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текст поста
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Запланировать (необязательно)
                </label>
                <input
                  type="datetime-local"
                  value={editSchedule}
                  onChange={(e) => setEditSchedule(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Сохранить"
                  )}
                </button>
                <button
                  onClick={() => {
                    handlePublish(editPost._id);
                    setEditPost(null);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Отправить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Raw Modal */}
      {showRaw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Отправить в канал
              </h2>
              <button
                onClick={() => setShowRaw(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текст
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={6}
                  placeholder="Текст поста (поддерживается HTML)..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL изображения (необязательно)
                </label>
                <input
                  value={rawImage}
                  onChange={(e) => setRawImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                onClick={handleSendRaw}
                disabled={sendingRaw || !rawText.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {sendingRaw ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {sendingRaw ? "Отправка..." : "Отправить сейчас"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
