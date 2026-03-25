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
  Eye,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const statuses = [
  "submitted",
  "moodboard_created",
  "consultation_scheduled",
  "consultation_completed",
  "approved",
  "in_progress",
  "completed",
  "delivered",
  "cancelled",
] as const;
type Status = (typeof statuses)[number];

const statusLabels: Record<Status | "", string> = {
  "": "Все статусы",
  submitted: "Заявка подана",
  moodboard_created: "Moodboard создан",
  consultation_scheduled: "Консультация назначена",
  consultation_completed: "Консультация прошла",
  approved: "Утверждён",
  in_progress: "В работе",
  completed: "Завершено",
  delivered: "Доставлено",
  cancelled: "Отменено",
};

const statusColors: Record<Status, string> = {
  submitted: "bg-blue-100 text-blue-800",
  moodboard_created: "bg-indigo-100 text-indigo-800",
  consultation_scheduled: "bg-yellow-100 text-yellow-800",
  consultation_completed: "bg-orange-100 text-orange-800",
  approved: "bg-emerald-100 text-emerald-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  delivered: "bg-teal-100 text-teal-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Bespoke() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: "20",
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        });
        const r = await api(`/api/admin/bespoke?${qs.toString()}`);
        setItems(r.items || []);
        setPage(r.page || 1);
        setPages(r.pages || 1);
        setStatusCounts(r.statusCounts || {});
      } catch {
        toast.error("Ошибка загрузки комиссий");
      } finally {
        setLoading(false);
      }
    },
    [search, status, from, to],
  );

  useEffect(() => {
    load(1);
  }, []);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const r = await api(`/api/admin/bespoke/${id}`);
      setDetail(r.item);
    } catch {
      toast.error("Ошибка загрузки деталей");
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const toastId = toast.loading("Обновление...");
    try {
      await api(`/api/admin/bespoke/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Статус обновлён", { id: toastId });
      load(page);
      if (detail?._id === id) {
        setDetail({ ...detail, status: newStatus });
      }
    } catch {
      toast.error("Ошибка обновления", { id: toastId });
    }
  };

  const activeCount = Object.entries(statusCounts)
    .filter(([s]) => !["completed", "delivered", "cancelled"].includes(s))
    .reduce((sum, [, c]) => sum + c, 0);

  const head = ["№", "Клиент", "Энергия", "Тип", "Цена", "Статус", "Дата", ""];
  const rows = useMemo(
    () =>
      items.map((c: any) => [
        c.commissionNumber,
        <div>
          <div className="font-medium text-gray-900">
            {c.customerId?.name || "—"}
          </div>
          <div className="text-xs text-gray-500">
            {c.customerId?.email || "—"}
          </div>
        </div>,
        <div className="max-w-[120px] truncate" title={c.brief?.energy}>
          {c.brief?.energy || "—"}
        </div>,
        c.specifications?.garmentType || "haori",
        c.pricing?.totalPrice
          ? `${c.pricing.totalPrice} ${c.pricing.currency || "USD"}`
          : "—",
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status as Status]}`}
          >
            {statusLabels[c.status as Status]}
          </span>
          {c.pricing?.depositPaid && (
            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
              Депозит
            </span>
          )}
        </div>,
        new Date(c.createdAt).toLocaleDateString("ru-RU"),
        <div className="flex items-center gap-1">
          <button
            onClick={() => openDetail(c._id)}
            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
            title="Подробнее"
          >
            <Eye className="w-4 h-4" />
          </button>
          <select
            value={c.status}
            onChange={(e) => updateStatus(c._id, e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>,
      ]),
    [items],
  );

  return (
    <div className="space-y-6" {...tid("admin-bespoke")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bespoke</h1>
          <p className="text-gray-600 mt-1">Индивидуальные комиссии</p>
        </div>
        {activeCount > 0 && (
          <div className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium">
            {activeCount} активных
          </div>
        )}
      </div>

      {/* Status summary */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([s, count]) => (
            <button
              key={s}
              onClick={() => {
                setStatus(status === s ? "" : (s as Status));
                load(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                status === s ? "ring-2 ring-blue-500 ring-offset-1" : ""
              } ${statusColors[s as Status] || "bg-gray-100 text-gray-700"}`}
            >
              {statusLabels[s as Status] || s}: {count}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Поиск
            </label>
            <input
              placeholder="Номер, энергия, история..."
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
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Все статусы</option>
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Комиссии не найдены
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

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6 shadow-xl">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : detail ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {detail.commissionNumber}
                    </h2>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${statusColors[detail.status as Status]}`}
                    >
                      {statusLabels[detail.status as Status]}
                    </span>
                  </div>
                  <button
                    onClick={() => setDetail(null)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Client */}
                <section className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                    Клиент
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-medium">
                      {detail.customerId?.name || "—"}
                    </p>
                    <p className="text-gray-600">
                      {detail.customerId?.email || "—"}
                    </p>
                  </div>
                </section>

                {/* Brief */}
                {detail.brief && (
                  <section className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      Бриф
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {detail.brief.energy && (
                        <p>
                          <span className="text-gray-500">Энергия:</span>{" "}
                          {detail.brief.energy}
                        </p>
                      )}
                      {detail.brief.colors?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Цвета:</span>
                          {detail.brief.colors.map((c: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-white rounded-lg text-sm border"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                      {detail.brief.emotions?.length > 0 && (
                        <p>
                          <span className="text-gray-500">Эмоции:</span>{" "}
                          {detail.brief.emotions.join(", ")}
                        </p>
                      )}
                      {detail.brief.story && (
                        <p>
                          <span className="text-gray-500">История:</span>{" "}
                          {detail.brief.story}
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {/* Pricing */}
                {detail.pricing && (
                  <section className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      Цена
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-500 text-sm">Базовая:</span>
                        <p className="font-medium">
                          {detail.pricing.basePrice || "—"}{" "}
                          {detail.pricing.currency}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Итого:</span>
                        <p className="font-bold text-lg">
                          {detail.pricing.totalPrice || "—"}{" "}
                          {detail.pricing.currency}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">
                          Множитель:
                        </span>
                        <p className="font-medium">
                          x{detail.pricing.complexityMultiplier || 1}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Депозит:</span>
                        <p
                          className={`font-medium ${detail.pricing.depositPaid ? "text-green-600" : "text-red-500"}`}
                        >
                          {detail.pricing.depositPaid
                            ? "Оплачен"
                            : "Не оплачен"}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* Moodboard */}
                {detail.moodboard?.generated && (
                  <section className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      Moodboard
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      {detail.moodboard.aiAnalysis && (
                        <p className="text-gray-700">
                          {detail.moodboard.aiAnalysis}
                        </p>
                      )}
                      {detail.moodboard.colorPalette?.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {detail.moodboard.colorPalette.map(
                            (c: any, i: number) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-lg border"
                                style={{ backgroundColor: c.hex }}
                                title={`${c.name}${c.uvReactive ? " (UV)" : ""}`}
                              />
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Artist notes */}
                {detail.artistNotes?.designNotes && (
                  <section className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                      Заметки художника
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {detail.artistNotes.designNotes}
                      </p>
                    </div>
                  </section>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
