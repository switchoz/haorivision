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
  Check,
  X,
  Star,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminReviews() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [search, setSearch] = useState("");
  const [approvedFilter, setApprovedFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: "20",
          ...(search ? { search } : {}),
          ...(approvedFilter ? { approved: approvedFilter } : {}),
        });
        const r = await api(`/api/admin/reviews?${qs}`);
        setItems(r.items || []);
        setPage(r.page || 1);
        setPages(r.pages || 1);
        setPendingCount(r.pendingCount || 0);
      } catch {
        toast.error("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    },
    [search, approvedFilter],
  );

  useEffect(() => {
    load(1);
  }, []);

  const approve = async (id: string, val: boolean) => {
    try {
      await api(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ approved: val }),
      });
      toast.success(val ? "Одобрено" : "Скрыто");
      load(page);
    } catch {
      toast.error("Ошибка");
    }
  };

  const toggleFeatured = async (id: string, val: boolean) => {
    try {
      await api(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ featured: !val }),
      });
      load(page);
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить отзыв?")) return;
    try {
      await api(`/api/admin/reviews/${id}`, { method: "DELETE" });
      toast.success("Удалено");
      load(page);
    } catch {
      toast.error("Ошибка");
    }
  };

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  const head = ["Имя", "Оценка", "Текст", "Изделие", "Статус", "Дата", ""];
  const rows = useMemo(
    () =>
      items.map((r: any) => [
        <div>
          <span className="font-medium text-gray-900">{r.name}</span>
          {r.city && (
            <span className="text-xs text-gray-500 ml-1">({r.city})</span>
          )}
        </div>,
        <span className="text-yellow-500 text-sm">{stars(r.rating)}</span>,
        <div
          className="max-w-[200px] truncate text-sm text-gray-600"
          title={r.text}
        >
          {r.text}
        </div>,
        r.productName ? (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            {r.productName}
          </span>
        ) : (
          "—"
        ),
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              r.approved
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {r.approved ? "Одобрен" : "На модерации"}
          </span>
          {r.featured && (
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          )}
        </div>,
        new Date(r.createdAt).toLocaleDateString("ru-RU"),
        <div className="flex items-center gap-1">
          {!r.approved ? (
            <button
              onClick={() => approve(r._id, true)}
              className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600 transition-colors"
              title="Одобрить"
            >
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => approve(r._id, false)}
              className="p-1.5 hover:bg-yellow-50 rounded-lg text-gray-500 hover:text-yellow-600 transition-colors"
              title="Скрыть"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => toggleFeatured(r._id, r.featured)}
            className={`p-1.5 rounded-lg transition-colors ${
              r.featured
                ? "text-yellow-500 hover:bg-yellow-50"
                : "text-gray-400 hover:bg-gray-100 hover:text-yellow-500"
            }`}
            title={r.featured ? "Убрать из избранных" : "В избранные"}
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(r._id)}
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
    <div className="space-y-6" {...tid("admin-reviews")}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Отзывы</h1>
          <p className="text-gray-600 mt-1">Модерация отзывов клиентов</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-500 text-white px-4 py-2 rounded-xl font-medium">
            {pendingCount} на модерации
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Поиск
            </label>
            <input
              placeholder="Имя, текст..."
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
              value={approvedFilter}
              onChange={(e) => setApprovedFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Все</option>
              <option value="false">На модерации</option>
              <option value="true">Одобренные</option>
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Отзывы не найдены
          </div>
        ) : (
          <Table head={head} rows={rows} />
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => load(Math.max(1, page - 1))}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronLeft className="w-5 h-5" /> Назад
          </button>
          <div className="text-sm text-gray-600">
            Страница {page} из {pages}
          </div>
          <button
            disabled={page >= pages}
            onClick={() => load(Math.min(pages, page + 1))}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50"
          >
            Вперёд <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
