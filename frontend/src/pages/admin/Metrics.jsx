/**
 * 📊 LIGHT METRICS DASHBOARD
 *
 * Админ-панель с метриками:
 * - Таблица по SKU: просмотры, клики Buy now, заказы
 * - График вовлечённости Reels
 * - Средний чек
 * - Среднее время ответа DM
 * - Фильтр "только новые товары"
 */

import React, { useState, useEffect } from "react";
import "./Metrics.css";

export default function Metrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProductsOnly, setNewProductsOnly] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchMetrics();
  }, [newProductsOnly, dateRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        newProductsOnly: newProductsOnly.toString(),
      });

      // Fetch all metrics in parallel
      const [skuRes, videoRes, aovRes, dmRes] = await Promise.all([
        fetch(`/api/metrics/sku?${params}`),
        fetch(`/api/metrics/video?${params}`),
        fetch(`/api/metrics/aov?${params}`),
        fetch(`/api/metrics/dm?${params}`),
      ]);

      const [skuData, videoData, aovData, dmData] = await Promise.all([
        skuRes.json(),
        videoRes.json(),
        aovRes.json(),
        dmRes.json(),
      ]);

      // Combine metrics
      const combinedMetrics = {
        skuMetrics: skuData.metrics || [],
        videoMetrics: videoData.metrics || [],
        averageCheck: aovData.metrics?.avgOrderValue || 0,
        totalRevenue: aovData.metrics?.totalRevenue || 0,
        totalOrders: aovData.metrics?.totalOrders || 0,
        avgDMResponseTime: {
          value: (dmData.metrics?.responseTime?.avg || 0) / 60, // convert to hours
          trend: "stable",
          last7Days: Array(7).fill(
            (dmData.metrics?.responseTime?.avg || 0) / 60,
          ),
        },
        reelsEngagement: {
          labels: videoData.metrics.slice(0, 5).map((v) => v.sku || "Video"),
          views: videoData.metrics.slice(0, 5).map((v) => v.metrics.plays || 0),
          likes: videoData.metrics.slice(0, 5).map(() => 0),
          comments: videoData.metrics.slice(0, 5).map(() => 0),
          shares: videoData.metrics.slice(0, 5).map(() => 0),
          savesReels: videoData.metrics.slice(0, 5).map(() => 0),
        },
      };

      setMetrics(combinedMetrics);
    } catch (err) {
      console.error("Metrics fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("ru-RU").format(value);
  };

  if (loading && !metrics) {
    return (
      <div className="metrics-container">
        <div className="metrics-loading">
          <div className="spinner"></div>
          <p>Загрузка метрик...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="metrics-container">
        <div className="metrics-error">
          <h2>Ошибка загрузки</h2>
          <p>{error}</p>
          <button onClick={fetchMetrics} className="btn-retry">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-container">
      <header className="metrics-header">
        <div className="header-content">
          <h1>📊 Light Metrics Dashboard</h1>
          <p className="subtitle">Аналитика продаж и вовлечённости</p>
        </div>
      </header>

      {/* Filters */}
      <section className="metrics-filters">
        <div className="filter-group">
          <label htmlFor="dateStart">Период:</label>
          <input
            type="date"
            id="dateStart"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
          />
          <span className="date-separator">—</span>
          <input
            type="date"
            id="dateEnd"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
          />
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={newProductsOnly}
              onChange={(e) => setNewProductsOnly(e.target.checked)}
            />
            <span>Только новые товары (последние 30 дней)</span>
          </label>
        </div>

        <button
          onClick={fetchMetrics}
          className="btn-refresh"
          disabled={loading}
        >
          {loading ? "Обновление..." : "🔄 Обновить"}
        </button>

        <button
          onClick={() =>
            window.open(
              `/api/metrics/sku/csv?startDate=${dateRange.start}&endDate=${dateRange.end}`,
              "_blank",
            )
          }
          className="btn-export"
          disabled={loading}
        >
          📥 Экспорт CSV
        </button>
      </section>

      {/* Key Metrics Cards */}
      <section className="metrics-cards">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Средний чек</h3>
            <div className="metric-value">
              {formatCurrency(metrics?.averageCheck || 0)}
            </div>
            <div className="metric-meta">
              {formatNumber(metrics?.totalOrders || 0)} заказов
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💸</div>
          <div className="metric-content">
            <h3>Общая выручка</h3>
            <div className="metric-value">
              {formatCurrency(metrics?.totalRevenue || 0)}
            </div>
            <div className="metric-meta">за выбранный период</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💬</div>
          <div className="metric-content">
            <h3>Среднее время ответа DM</h3>
            <div className="metric-value">
              {metrics?.avgDMResponseTime?.value || 0} ч
            </div>
            <div
              className={`metric-meta trend-${metrics?.avgDMResponseTime?.trend || "stable"}`}
            >
              {metrics?.avgDMResponseTime?.trend === "improving" &&
                "↓ Улучшается"}
              {metrics?.avgDMResponseTime?.trend === "worsening" &&
                "↑ Ухудшается"}
              {metrics?.avgDMResponseTime?.trend === "stable" && "→ Стабильно"}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📦</div>
          <div className="metric-content">
            <h3>Всего SKU</h3>
            <div className="metric-value">
              {metrics?.skuMetrics?.length || 0}
            </div>
            <div className="metric-meta">
              {newProductsOnly ? "новых товаров" : "товаров в каталоге"}
            </div>
          </div>
        </div>
      </section>

      {/* SKU Performance Table */}
      <section className="metrics-section">
        <h2>📈 Метрики по SKU</h2>
        <div className="table-container">
          <table className="metrics-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Название</th>
                <th>Просмотры</th>
                <th>Клики "Buy Now"</th>
                <th>Заказы</th>
                <th>Выручка</th>
                <th>Конверсия</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.skuMetrics?.length > 0 ? (
                metrics.skuMetrics.map((item, index) => (
                  <tr key={index}>
                    <td className="sku-code">{item.sku}</td>
                    <td className="product-name">
                      {item.productId?.name || "N/A"}
                    </td>
                    <td className="metric-number">
                      {formatNumber(item.metrics.views || 0)}
                    </td>
                    <td className="metric-number">
                      {formatNumber(item.metrics.buyNowClicks || 0)}
                    </td>
                    <td className="metric-number">
                      {formatNumber(item.metrics.orders || 0)}
                    </td>
                    <td className="metric-currency">
                      {formatCurrency(item.metrics.revenue || 0)}
                    </td>
                    <td className="metric-percent">
                      {((item.metrics.conversionRate || 0) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    Нет данных за выбранный период
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reels Engagement Chart */}
      <section className="metrics-section">
        <h2>🎬 Вовлечённость Reels</h2>
        <div className="chart-container">
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color views"></span>
              <span>Просмотры</span>
            </div>
            <div className="legend-item">
              <span className="legend-color likes"></span>
              <span>Лайки</span>
            </div>
            <div className="legend-item">
              <span className="legend-color comments"></span>
              <span>Комментарии</span>
            </div>
            <div className="legend-item">
              <span className="legend-color shares"></span>
              <span>Репосты</span>
            </div>
            <div className="legend-item">
              <span className="legend-color saves"></span>
              <span>Сохранения</span>
            </div>
          </div>

          <div className="bar-chart">
            {metrics?.reelsEngagement?.labels?.map((label, index) => (
              <div key={index} className="chart-bar-group">
                <div className="chart-label">{label}</div>
                <div className="chart-bars">
                  <div
                    className="chart-bar views"
                    style={{
                      height: `${(metrics.reelsEngagement.views[index] / Math.max(...metrics.reelsEngagement.views)) * 150}px`,
                    }}
                    title={`${formatNumber(metrics.reelsEngagement.views[index])} просмотров`}
                  >
                    <span className="bar-value">
                      {formatNumber(metrics.reelsEngagement.views[index])}
                    </span>
                  </div>
                  <div
                    className="chart-bar likes"
                    style={{
                      height: `${(metrics.reelsEngagement.likes[index] / Math.max(...metrics.reelsEngagement.likes)) * 100}px`,
                    }}
                    title={`${formatNumber(metrics.reelsEngagement.likes[index])} лайков`}
                  >
                    <span className="bar-value">
                      {formatNumber(metrics.reelsEngagement.likes[index])}
                    </span>
                  </div>
                  <div
                    className="chart-bar comments"
                    style={{
                      height: `${(metrics.reelsEngagement.comments[index] / Math.max(...metrics.reelsEngagement.comments)) * 80}px`,
                    }}
                    title={`${formatNumber(metrics.reelsEngagement.comments[index])} комментариев`}
                  >
                    <span className="bar-value">
                      {formatNumber(metrics.reelsEngagement.comments[index])}
                    </span>
                  </div>
                  <div
                    className="chart-bar shares"
                    style={{
                      height: `${(metrics.reelsEngagement.shares[index] / Math.max(...metrics.reelsEngagement.shares)) * 60}px`,
                    }}
                    title={`${formatNumber(metrics.reelsEngagement.shares[index])} репостов`}
                  >
                    <span className="bar-value">
                      {formatNumber(metrics.reelsEngagement.shares[index])}
                    </span>
                  </div>
                  <div
                    className="chart-bar saves"
                    style={{
                      height: `${(metrics.reelsEngagement.savesReels[index] / Math.max(...metrics.reelsEngagement.savesReels)) * 70}px`,
                    }}
                    title={`${formatNumber(metrics.reelsEngagement.savesReels[index])} сохранений`}
                  >
                    <span className="bar-value">
                      {formatNumber(metrics.reelsEngagement.savesReels[index])}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DM Response Time Trend */}
      <section className="metrics-section">
        <h2>⏱️ Динамика времени ответа DM (последние 7 дней)</h2>
        <div className="line-chart">
          {metrics?.avgDMResponseTime?.last7Days?.map((value, index) => (
            <div key={index} className="line-chart-point">
              <div
                className="point-bar"
                style={{
                  height: `${(value / Math.max(...metrics.avgDMResponseTime.last7Days)) * 100}px`,
                }}
              >
                <span className="point-value">{value}ч</span>
              </div>
              <div className="point-label">День {index + 1}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
