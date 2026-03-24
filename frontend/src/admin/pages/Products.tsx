import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../api";
import Table from "../ui/Table";
import { tid } from "../../shared/testid";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  Package,
  DollarSign,
  Image as ImageIcon,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

interface Product {
  _id: string;
  sku: string;
  name: string;
  price: number;
  currency?: string;
  stock?: number;
  image?: string;
  description?: string;
  category?: string;
}

export default function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: "20",
          ...(search ? { search } : {}),
        });
        const r = await api(`/api/admin/products?${qs.toString()}`);
        setItems(r.items || []);
        setPage(r.page || 1);
        setPages(r.pages || 1);
      } catch (error) {
        toast.error("Ошибка загрузки товаров");
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    load(1);
  }, []);

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({ currency: "rub", stock: 0 });
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowModal(true);
  };

  const handleDelete = async (productId: string, sku: string) => {
    if (!confirm(`Удалить товар ${sku}?`)) return;

    const toastId = toast.loading("Удаление...");
    try {
      await api(`/api/admin/products/${productId}`, { method: "DELETE" });
      toast.success("Товар удалён", { id: toastId });
      load(page);
    } catch (error) {
      toast.error("Ошибка удаления", { id: toastId });
    }
  };

  const handleSave = async () => {
    if (!formData.sku || !formData.name || !formData.price) {
      toast.error("Заполните обязательные поля");
      return;
    }

    setSaving(true);
    const toastId = toast.loading(
      editingProduct ? "Сохранение..." : "Создание...",
    );

    try {
      if (editingProduct) {
        await api(`/api/admin/products/${editingProduct._id}`, {
          method: "PATCH",
          body: JSON.stringify(formData),
        });
        toast.success("Товар обновлён", { id: toastId });
      } else {
        await api("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast.success("Товар создан", { id: toastId });
      }
      setShowModal(false);
      load(page);
    } catch (error) {
      toast.error("Ошибка сохранения", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const head = ["SKU", "Название", "Цена", "Остаток", "Категория", "Действия"];
  const rows = useMemo(
    () =>
      items.map((p) => [
        <div className="flex items-center gap-2">
          {p.image && (
            <img
              src={p.image}
              alt={p.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <span className="font-mono text-sm">{p.sku}</span>
        </div>,
        <div>
          <div className="font-medium text-gray-900">{p.name}</div>
          {p.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {p.description}
            </div>
          )}
        </div>,
        <span className="font-semibold text-gray-900">
          {p.price.toLocaleString("ru-RU")} {p.currency?.toUpperCase() || "RUB"}
        </span>,
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            (p.stock || 0) > 10
              ? "bg-green-100 text-green-800"
              : (p.stock || 0) > 0
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {p.stock || 0} шт.
        </span>,
        <span className="text-gray-600">{p.category || "—"}</span>,
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(p)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Редактировать"
            {...tid(`edit-${p.sku}`)}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(p._id, p.sku)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Удалить"
            {...tid(`delete-${p.sku}`)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>,
      ]),
    [items, page],
  );

  return (
    <div className="space-y-6" {...tid("admin-products")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Товары</h1>
          <p className="text-gray-600 mt-1">Управление каталогом продукции</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
          {...tid("create-product")}
        >
          <Plus className="w-5 h-5" />
          Добавить товар
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Поиск
            </label>
            <input
              placeholder="Поиск по SKU, названию..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              {...tid("search-product")}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => load(1)}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              {...tid("search-apply")}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Найти"}
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
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Товары не найдены</p>
          </div>
        ) : (
          <Table head={head} rows={rows} />
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? "Редактировать товар" : "Новый товар"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="HV-001"
                    {...tid("input-sku")}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Цена <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="9900"
                    {...tid("input-price")}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Haori Kimono Black"
                  {...tid("input-name")}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Описание товара..."
                  {...tid("input-description")}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="w-4 h-4 inline mr-1" />
                    Остаток
                  </label>
                  <input
                    type="number"
                    value={formData.stock || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    {...tid("input-stock")}
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Валюта
                  </label>
                  <select
                    value={formData.currency || "rub"}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    {...tid("input-currency")}
                  >
                    <option value="rub">RUB</option>
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория
                  </label>
                  <input
                    type="text"
                    value={formData.category || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Kimono"
                    {...tid("input-category")}
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  URL изображения
                </label>
                <input
                  type="text"
                  value={formData.image || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="https://..."
                  {...tid("input-image")}
                />
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="mt-2 w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                {...tid("save-product")}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
