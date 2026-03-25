import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../api";
import Table from "../ui/Table";
import { tid } from "../../shared/testid";
import {
  Search,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MailOpen,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

const readOptions = [
  { value: "", label: "Все" },
  { value: "false", label: "Непрочитанные" },
  { value: "true", label: "Прочитанные" },
];

export default function Messages() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [read, setRead] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: "20",
          ...(search ? { search } : {}),
          ...(read ? { read } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        });
        const r = await api(`/api/admin/messages?${qs.toString()}`);
        setItems(r.items || []);
        setPage(r.page || 1);
        setPages(r.pages || 1);
        setUnreadCount(r.unreadCount || 0);
      } catch {
        toast.error("Ошибка загрузки сообщений");
      } finally {
        setLoading(false);
      }
    },
    [search, read, from, to],
  );

  useEffect(() => {
    load(1);
  }, []);

  const toggleRead = async (id: string, currentRead: boolean) => {
    try {
      await api(`/api/admin/messages/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({ read: !currentRead }),
      });
      load(page);
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Удалить сообщение?")) return;
    try {
      await api(`/api/admin/messages/${id}`, { method: "DELETE" });
      toast.success("Удалено");
      load(page);
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const head = ["", "Имя", "Email", "Тип", "Сообщение", "Дата", ""];
  const rows = useMemo(
    () =>
      items.map((m: any) => [
        <button
          onClick={() => toggleRead(m._id, m.readByAdmin)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          title={
            m.readByAdmin ? "Отметить непрочитанным" : "Отметить прочитанным"
          }
        >
          {m.readByAdmin ? (
            <MailOpen className="w-4 h-4 text-gray-400" />
          ) : (
            <Mail className="w-4 h-4 text-blue-600" />
          )}
        </button>,
        <span
          className={
            m.readByAdmin ? "text-gray-500" : "font-semibold text-gray-900"
          }
        >
          {m.name}
        </span>,
        m.email,
        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
          {m.type || "general"}
        </span>,
        <div
          className="max-w-xs truncate cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => setExpanded(expanded === m._id ? null : m._id)}
          title="Нажмите для раскрытия"
        >
          {m.message}
        </div>,
        new Date(m.createdAt).toLocaleString("ru-RU"),
        <button
          onClick={() => deleteMessage(m._id)}
          className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
          title="Удалить"
        >
          <Trash2 className="w-4 h-4" />
        </button>,
      ]),
    [items, expanded],
  );

  return (
    <div className="space-y-6" {...tid("admin-messages")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Сообщения</h1>
          <p className="text-gray-600 mt-1">Обращения с формы контактов</p>
        </div>
        {unreadCount > 0 && (
          <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium">
            {unreadCount} непрочитанных
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Поиск
            </label>
            <input
              placeholder="Имя, email, текст..."
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
              value={read}
              onChange={(e) => setRead(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {readOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              От
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              До
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
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

      {/* Expanded message */}
      {expanded && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-900">
              Полный текст сообщения
            </h3>
            <button
              onClick={() => setExpanded(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">
            {items.find((m) => m._id === expanded)?.message}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Сообщения не найдены
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
    </div>
  );
}
