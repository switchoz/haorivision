import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../api";
import Table from "../ui/Table";
import { tid } from "../../shared/testid";
import {
  Plus,
  Loader2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPromo() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api("/api/admin/promo?limit=50");
      setItems(r.items || []);
    } catch {
      toast.error("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await api(`/api/admin/promo/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !active }),
      });
      load();
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить промокод?")) return;
    try {
      await api(`/api/admin/promo/${id}`, { method: "DELETE" });
      toast.success("Удалено");
      load();
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleSave = async () => {
    if (!modal?.code || !modal?.type || !modal?.value) {
      toast.error("Код, тип и значение обязательны");
      return;
    }
    setSaving(true);
    try {
      await api("/api/admin/promo", {
        method: "POST",
        body: JSON.stringify({
          code: modal.code,
          type: modal.type,
          value: modal.value,
          currency: modal.currency || "USD",
          minOrderAmount: modal.minOrderAmount || 0,
          maxUses: modal.maxUses || null,
          expiresAt: modal.expiresAt || null,
        }),
      });
      toast.success("Промокод создан");
      setModal(null);
      load();
    } catch {
      toast.error("Ошибка создания");
    } finally {
      setSaving(false);
    }
  };

  const head = [
    "Код",
    "Тип",
    "Скидка",
    "Использован",
    "Лимит",
    "Истекает",
    "Статус",
    "",
  ];
  const rows = useMemo(
    () =>
      items.map((p: any) => [
        <span className="font-mono font-bold text-gray-900">{p.code}</span>,
        p.type === "percent" ? "%" : "Фикс.",
        <span className="font-medium">
          {p.value}
          {p.type === "percent" ? "%" : ` ${p.currency}`}
        </span>,
        p.usedCount,
        p.maxUses ?? "∞",
        p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("ru-RU") : "—",
        <button onClick={() => toggleActive(p._id, p.active)}>
          {p.active ? (
            <ToggleRight className="w-6 h-6 text-green-500" />
          ) : (
            <ToggleLeft className="w-6 h-6 text-gray-400" />
          )}
        </button>,
        <button
          onClick={() => handleDelete(p._id)}
          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>,
      ]),
    [items],
  );

  return (
    <div className="space-y-6" {...tid("admin-promo")}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Промокоды</h1>
          <p className="text-gray-600 mt-1">Управление скидками</p>
        </div>
        <button
          onClick={() =>
            setModal({
              code: "",
              type: "percent",
              value: 10,
              currency: "USD",
              minOrderAmount: 0,
              maxUses: "",
              expiresAt: "",
            })
          }
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" /> Создать
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Промокоды не найдены
          </div>
        ) : (
          <Table head={head} rows={rows} />
        )}
      </div>

      {/* Create Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Новый промокод
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
                  Код *
                </label>
                <input
                  value={modal.code}
                  onChange={(e) =>
                    setModal({ ...modal, code: e.target.value.toUpperCase() })
                  }
                  placeholder="HAORI20"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип *
                  </label>
                  <select
                    value={modal.type}
                    onChange={(e) =>
                      setModal({ ...modal, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none"
                  >
                    <option value="percent">Процент (%)</option>
                    <option value="fixed">Фиксированная</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Значение *
                  </label>
                  <input
                    type="number"
                    value={modal.value}
                    onChange={(e) =>
                      setModal({ ...modal, value: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Мин. сумма
                  </label>
                  <input
                    type="number"
                    value={modal.minOrderAmount}
                    onChange={(e) =>
                      setModal({ ...modal, minOrderAmount: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Макс. использований
                  </label>
                  <input
                    type="number"
                    value={modal.maxUses}
                    onChange={(e) =>
                      setModal({ ...modal, maxUses: e.target.value })
                    }
                    placeholder="∞"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Истекает
                </label>
                <input
                  type="date"
                  value={modal.expiresAt}
                  onChange={(e) =>
                    setModal({ ...modal, expiresAt: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                ) : (
                  "Создать промокод"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
