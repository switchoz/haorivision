import { Link, NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Flag,
  FileText,
  LogOut,
  Sparkles,
} from "lucide-react";
import { getToken, getRole } from "./api";

export default function AdminLayout() {
  const role = getRole();

  const handleLogout = () => {
    localStorage.removeItem("admin_jwt");
    location.href = "/admin/login";
  };

  const navItems = [
    {
      to: "/admin",
      icon: LayoutDashboard,
      label: "Панель управления",
      end: true,
    },
    { to: "/admin/orders", icon: ShoppingBag, label: "Заказы" },
    { to: "/admin/products", icon: Package, label: "Товары" },
    { to: "/admin/flags", icon: Flag, label: "Фичи" },
    { to: "/admin/logs", icon: FileText, label: "Логи" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link to="/admin" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">
                  HaoriVision
                </div>
                <div className="text-xs text-gray-500">Админ панель</div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3 px-4 py-2 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500">Роль</div>
              <div className="font-semibold text-gray-900 capitalize">
                {role || "admin"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Выйти</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
