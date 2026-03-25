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
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminBlog() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [pubFilter, setPubFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit/Create modal
  const [modal, setModal] = useState<any>(null); // null = closed, {} = new, {_id} = edit
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: "20",
          ...(search ? { search } : {}),
          ...(pubFilter ? { published: pubFilter } : {}),
        });
        const r = await api(`/api/admin/blog?${qs}`);
        setItems(r.items || []);
        setPage(r.page || 1);
        setPages(r.pages || 1);
      } catch {
        toast.error("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    },
    [search, pubFilter],
  );

  useEffect(() => {
    load(1);
  }, []);

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await api(`/api/admin/blog/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ published: !current }),
      });
      toast.success(!current ? "Опубликовано" : "Снято с публикации");
      load(page);
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить статью?")) return;
    try {
      await api(`/api/admin/blog/${id}`, { method: "DELETE" });
      toast.success("Удалено");
      load(page);
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleSave = async () => {
    if (!modal?.title?.trim() || !modal?.content?.trim()) {
      toast.error("Заголовок и содержание обязательны");
      return;
    }
    setSaving(true);
    try {
      const isNew = !modal._id;
      const body = {
        title: modal.title,
        slug: modal.slug,
        excerpt: modal.excerpt,
        content: modal.content,
        coverImage: modal.coverImage,
        tags: modal.tagsStr
          ? modal.tagsStr
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : modal.tags || [],
        published: modal.published || false,
      };

      if (isNew) {
        await api("/api/admin/blog", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Статья создана");
      } else {
        await api(`/api/admin/blog/${modal._id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Сохранено");
      }
      setModal(null);
      load(page);
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (post: any) => {
    setModal({
      ...post,
      tagsStr: post.tags?.join(", ") || "",
    });
  };

  const openNew = () => {
    setModal({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      tagsStr: "",
      published: false,
    });
  };

  const head = ["Заголовок", "Slug", "Теги", "Статус", "Дата", ""];
  const rows = useMemo(
    () =>
      items.map((p: any) => [
        <div className="max-w-[200px] truncate font-medium text-gray-900">
          {p.title}
        </div>,
        <span className="text-xs text-gray-500 font-mono">{p.slug}</span>,
        <div className="flex flex-wrap gap-1">
          {p.tags?.slice(0, 3).map((t: string) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
            >
              {t}
            </span>
          ))}
        </div>,
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            p.published
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {p.published ? "Опубликован" : "Черновик"}
        </span>,
        new Date(p.publishedAt || p.createdAt).toLocaleDateString("ru-RU"),
        <div className="flex items-center gap-1">
          <button
            onClick={() => togglePublish(p._id, p.published)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title={p.published ? "Снять с публикации" : "Опубликовать"}
          >
            {p.published ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
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
        </div>,
      ]),
    [items],
  );

  return (
    <div className="space-y-6" {...tid("admin-blog")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Журнал</h1>
          <p className="text-gray-600 mt-1">Управление статьями</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Новая статья
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Поиск
            </label>
            <input
              placeholder="Заголовок, тег..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Статус
            </label>
            <select
              value={pubFilter}
              onChange={(e) => setPubFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Все</option>
              <option value="true">Опубликованные</option>
              <option value="false">Черновики</option>
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
            Статьи не найдены
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
            <ChevronLeft className="w-5 h-5" /> Назад
          </button>
          <div className="text-sm text-gray-600">
            Страница {page} из {pages}
          </div>
          <button
            disabled={page >= pages}
            onClick={() => load(Math.min(pages, page + 1))}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Вперёд <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {modal._id ? "Редактирование" : "Новая статья"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заголовок *
                </label>
                <input
                  value={modal.title || ""}
                  onChange={(e) =>
                    setModal({ ...modal, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (авто если пусто)
                </label>
                <input
                  value={modal.slug || ""}
                  onChange={(e) => setModal({ ...modal, slug: e.target.value })}
                  placeholder="avtogeneratsiya-iz-zagolovka"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Краткое описание
                </label>
                <input
                  value={modal.excerpt || ""}
                  onChange={(e) =>
                    setModal({ ...modal, excerpt: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Содержание (HTML) *
                </label>
                <textarea
                  value={modal.content || ""}
                  onChange={(e) =>
                    setModal({ ...modal, content: e.target.value })
                  }
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-y font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL обложки
                </label>
                <input
                  value={modal.coverImage || ""}
                  onChange={(e) =>
                    setModal({ ...modal, coverImage: e.target.value })
                  }
                  placeholder="/artist/page1_img1.webp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Теги (через запятую)
                </label>
                <input
                  value={modal.tagsStr || ""}
                  onChange={(e) =>
                    setModal({ ...modal, tagsStr: e.target.value })
                  }
                  placeholder="процесс, UV, хаори"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modal.published || false}
                    onChange={(e) =>
                      setModal({ ...modal, published: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Опубликовать сразу
                  </span>
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Сохранить"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
