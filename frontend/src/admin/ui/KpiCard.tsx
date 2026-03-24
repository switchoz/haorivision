import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  sub?: string;
  icon?: LucideIcon;
  trend?: number;
  trendUp?: boolean;
}

export default function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  trendUp,
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-medium text-gray-600">{title}</div>
        </div>
        {Icon && (
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>

      <div className="flex items-center justify-between">
        {sub && <div className="text-sm text-gray-500">{sub}</div>}
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${trendUp ? "text-green-600" : "text-red-600"}`}
          >
            {trendUp ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
