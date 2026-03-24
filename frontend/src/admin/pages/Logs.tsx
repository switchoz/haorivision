import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { tid } from "../../shared/testid";
import {
  Search,
  Calendar,
  Filter,
  FileText,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

const levels = ["", "info", "warn", "error", "debug"] as const;
type LogLevel = (typeof levels)[number];

const levelLabels: Record<LogLevel, string> = {
  "": "Все уровни",
  info: "Инфо",
  warn: "Предупреждение",
  error: "Ошибка",
  debug: "Отладка",
};

const levelColors: Record<Exclude<LogLevel, "">, string> = {
  info: "bg-blue-100 text-blue-800 border-blue-200",
  warn: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
  debug: "bg-gray-100 text-gray-800 border-gray-200",
};

const levelIcons: Record<Exclude<LogLevel, "">, any> = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  debug: CheckCircle,
};

interface Log {
  _id: string;
  level: string;
  message: string;
  timestamp: string;
  meta?: any;
  userId?: string;
  action?: string;
}

export default function Logs() {
  const [items, setItems] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<LogLevel>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: "50",
          ...(search ? { search } : {}),
          ...(level ? { level } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        });
        const r = await api(`/api/admin/logs?${qs.toString()}`);
        setItems(r.items || []);
        setPage(r.page || 1);
        setPages(r.pages || 1);
      } catch (error) {
        toast.error("Ошибка загрузки логов");
      } finally {
        setLoading(false);
      }
    },
    [search, level, from, to],
  );

  useEffect(() => {
    load(1);
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => load(page), 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, page, load]);

  const exportLogs = async () => {
    const toastId = toast.loading("Экспорт логов...");
    try {
      const body = {
        search: search || undefined,
        level: level || undefined,
        from: from || undefined,
        to: to || undefined,
      };
      const r = await fetch(
        (import.meta.env.VITE_API_URL || "") + "/api/admin/logs/export",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer " + (localStorage.getItem("admin_jwt") || ""),
          },
          body: JSON.stringify(body),
        },
      );
      if (!r.ok) throw new Error("Export failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-${new Date().toISOString().split("T")[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Логи экспортированы", { id: toastId });
    } catch (error) {
      toast.error("Ошибка экспорта", { id: toastId });
    }
  };

  const getLevelIcon = (lvl: string) => {
    const Icon = levelIcons[lvl as Exclude<LogLevel, "">] || Info;
    return <Icon className="w-4 h-4" />;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-6" {...tid("admin-logs")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Логи</h1>
          <p className="text-gray-600 mt-1">
            Системные события и действия пользователей
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              autoRefresh
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            title="Автообновление каждые 10 секунд"
          >
            <RefreshCw
              className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`}
            />
            Авто
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all"
            title="Экспорт логов"
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
        </div>
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
              placeholder="Поиск по сообщению..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              {...tid("flt-search")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Уровень
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as LogLevel)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              {...tid("flt-level")}
            >
              {levels.map((l) => (
                <option key={l} value={l}>
                  {levelLabels[l]}
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
              {...tid("flt-from")}
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
              {...tid("flt-to")}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => load(1)}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              {...tid("flt-apply")}
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

      {/* Logs List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Логи не найдены</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((log) => {
              const isExpanded = expandedId === log._id;
              const levelColor =
                levelColors[log.level as Exclude<LogLevel, "">] ||
                levelColors.info;

              return (
                <div
                  key={log._id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Level Badge */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${levelColor}`}
                    >
                      {getLevelIcon(log.level)}
                      {levelLabels[log.level as LogLevel] || log.level}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">
                            {log.message}
                          </p>
                          {log.action && (
                            <p className="text-sm text-gray-600 mt-1">
                              Действие:{" "}
                              <span className="font-mono">{log.action}</span>
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                          {formatTime(log.timestamp)}
                        </div>
                      </div>

                      {/* Meta Info */}
                      {log.meta && Object.keys(log.meta).length > 0 && (
                        <div className="mt-2">
                          <button
                            onClick={() =>
                              setExpandedId(isExpanded ? null : log._id)
                            }
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Скрыть детали
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Показать детали
                              </>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                              <pre className="text-xs font-mono text-gray-700 overflow-x-auto">
                                {JSON.stringify(log.meta, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Назад
          </button>
          <span className="text-sm text-gray-600">
            Страница {page} из {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
}
