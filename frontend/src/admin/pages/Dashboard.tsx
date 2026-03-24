import { useEffect, useState } from "react";
import { api } from "../api";
import KpiCard from "../ui/KpiCard";
import SalesChart from "../ui/SalesChart";
import { tid } from "../../shared/testid";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/admin/stats")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const kpi = data?.kpi || { revenue: 0, orders: 0, aov: 0, users: 0 };
  const trend =
    data?.trend ||
    Array.from({ length: 30 }, (_, i) => ({
      date: `д${i}`,
      value: Math.round(Math.random() * 10000),
    }));
  const top = data?.trending || [];

  // Форматирование чисел
  const formatNumber = (num: number) =>
    new Intl.NumberFormat("ru-RU").format(num);
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
    }).format(num);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" {...tid("admin-dashboard")}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
        <p className="text-gray-600 mt-1">Обзор ключевых метрик и аналитики</p>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Выручка"
          value={formatCurrency(kpi.revenue)}
          sub="за последние 30 дней"
          icon={DollarSign}
          trend={12.5}
          trendUp
        />
        <KpiCard
          title="Заказы"
          value={formatNumber(kpi.orders)}
          sub="всего заказов"
          icon={ShoppingCart}
          trend={8.2}
          trendUp
        />
        <KpiCard
          title="Средний чек"
          value={formatCurrency(kpi.aov)}
          sub="на один заказ"
          icon={TrendingUp}
          trend={-2.4}
          trendUp={false}
        />
        <KpiCard
          title="Пользователи"
          value={formatNumber(kpi.users)}
          sub="зарегистрировано"
          icon={Users}
          trend={15.3}
          trendUp
        />
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Динамика продаж
            </h2>
            <p className="text-sm text-gray-600">
              Продажи за последние 30 дней
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUpRight className="w-4 h-4" />
              <span className="font-semibold">+12.5%</span>
            </div>
            <span className="text-gray-500">vs прошлый месяц</span>
          </div>
        </div>
        <SalesChart data={trend} />
      </div>

      {/* Trending Products */}
      {top.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Популярные товары
            </h2>
            <p className="text-sm text-gray-600">
              Топ продаж за текущий период
            </p>
          </div>
          <div className="space-y-3">
            {top.map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      {item.sales} продаж
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(item.revenue || item.sales * 1000)}
                  </div>
                  <div className="text-sm text-gray-600">выручка</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Конверсия</h3>
          <div className="text-3xl font-bold mb-1">3.8%</div>
          <p className="text-sm opacity-75">от визитов к покупкам</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Возвраты</h3>
          <div className="text-3xl font-bold mb-1">1.2%</div>
          <p className="text-sm opacity-75">от общего числа заказов</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Повторные</h3>
          <div className="text-3xl font-bold mb-1">24%</div>
          <p className="text-sm opacity-75">клиентов делают 2+ заказа</p>
        </div>
      </div>
    </div>
  );
}
