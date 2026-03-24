import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../api";
import Table from "../ui/Table";
import { tid } from "../../shared/testid";
import {
  Search,
  Calendar,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const statuses = ["new", "paid", "fulfilled", "canceled", "refunded"] as const;
type Status = (typeof statuses)[number];

const statusLabels: Record<Status | "", string> = {
  "": "Все статусы",
  new: "Новый",
  paid: "Оплачен",
  fulfilled: "Выполнен",
  canceled: "Отменён",
  refunded: "Возврат",
};

const statusColors: Record<Status, string> = {
  new: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  fulfilled: "bg-purple-100 text-purple-800",
  canceled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function Orders() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: "20",
          ...(email ? { email } : {}),
          ...(status ? { status } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        });
        const r = await api(`/api/admin/orders?${qs.toString()}`);
        setItems(r.items || []);
        setPage(r.page || 1);
        setPages(r.pages || 1);
      } catch (error) {
        toast.error("Ошибка загрузки заказов");
      } finally {
        setLoading(false);
      }
    },
    [email, status, from, to],
  );

  useEffect(() => {
    load(1);
  }, []);

  const exportCSV = async () => {
    const toastId = toast.loading("Экспорт...");
    try {
      const body = {
        email: email || undefined,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      };
      const r = await fetch(
        (import.meta.env.VITE_API_URL || "") + "/api/admin/orders/export",
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
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV экспортирован", { id: toastId });
    } catch (error) {
      toast.error("Ошибка экспорта", { id: toastId });
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const toastId = toast.loading("Обновление статуса...");
    try {
      await api(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Статус обновлён", { id: toastId });
      load(page);
    } catch (error) {
      toast.error("Ошибка обновления", { id: toastId });
    }
  };

  const head = ["№", "Email", "Сумма", "Статус", "Дата", "Действия"];
  const rows = useMemo(
    () =>
      items.map((o: any) => [
        o.number,
        o.email,
        `${o.amount} ${o.currency}`,
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[o.status as Status]}`}
        >
          {statusLabels[o.status as Status]}
        </span>,
        new Date(o.createdAt).toLocaleString("ru-RU"),
        <select
          value={o.status}
          onChange={(e) => updateStatus(o._id, e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>,
      ]),
    [items, page],
  );

  return (
    <div className="space-y-6" {...tid("admin-orders")}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Заказы</h1>
        <p className="text-gray-600 mt-1">Управление и мониторинг заказов</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              placeholder="Поиск по email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              {...tid("flt-email")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Статус
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              {...tid("flt-status")}
            >
              <option value="">{statusLabels[""]}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
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

          <div className="flex items-end gap-2">
            <button
              onClick={() => load(1)}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              {...tid("flt-apply")}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mx-auto animate-spin" />
              ) : (
                "Применить"
              )}
            </button>
            <button
              onClick={exportCSV}
              className="bg-green-600 text-white p-2 rounded-xl hover:bg-green-700 transition-colors"
              {...tid("export-csv")}
              title="Экспорт CSV"
            >
              <Download className="w-5 h-5" />
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
            Заказы не найдены
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
            onClick={() => {
              const p = Math.max(1, page - 1);
              load(p);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
            {...tid("pg-prev")}
          >
            <ChevronLeft className="w-5 h-5" />
            Назад
          </button>

          <div className="text-sm text-gray-600">
            Страница {page} из {pages}
          </div>

          <button
            disabled={page >= pages}
            onClick={() => {
              const p = Math.min(pages, page + 1);
              load(p);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition-colors"
            {...tid("pg-next")}
          >
            Вперёд
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
