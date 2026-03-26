import { Link, NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Flag,
  FileText,
  LogOut,
  Sparkles,
  MessageSquare,
  Palette,
  Send,
  BookOpen,
  Star,
  Tag,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { getRole } from "./api";

export default function AdminLayout() {
  const role = getRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("hv_admin_dark") === "1",
  );

  useEffect(() => {
    localStorage.setItem("hv_admin_dark", darkMode ? "1" : "0");
  }, [darkMode]);

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
    { to: "/admin/messages", icon: MessageSquare, label: "Сообщения" },
    { to: "/admin/bespoke", icon: Palette, label: "Bespoke" },
    { to: "/admin/telegram", icon: Send, label: "Telegram" },
    { to: "/admin/blog", icon: BookOpen, label: "Журнал" },
    { to: "/admin/reviews", icon: Star, label: "Отзывы" },
    { to: "/admin/promo", icon: Tag, label: "Промокоды" },
    { to: "/admin/products", icon: Package, label: "Товары" },
    { to: "/admin/flags", icon: Flag, label: "Фичи" },
    { to: "/admin/logs", icon: FileText, label: "Логи" },
  ];

  const sidebar = (
    <>
      {/* Logo */}
      <div
        className={`p-6 border-b ${darkMode ? "border-zinc-800" : "border-gray-200"}`}
      >
        <div className="flex items-center justify-between">
          <Link
            to="/admin"
            className="flex items-center gap-2 group"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div
                className={`font-bold text-lg ${darkMode ? "text-zinc-100" : "text-gray-900"}`}
              >
                HaoriVision
              </div>
              <div
                className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-500"}`}
              >
                Админ панель
              </div>
            </div>
          </Link>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? "text-yellow-400 hover:bg-zinc-800" : "text-gray-500 hover:bg-gray-100"}`}
            title={darkMode ? "Светлая тема" : "Тёмная тема"}
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                  : darkMode
                    ? "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-5 h-5 ${isActive ? "text-white" : darkMode ? "text-zinc-500" : "text-gray-500"}`}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info & Logout */}
      <div
        className={`p-4 border-t ${darkMode ? "border-zinc-800" : "border-gray-200"}`}
      >
        <div
          className={`mb-3 px-4 py-2 rounded-xl ${darkMode ? "bg-zinc-800" : "bg-gray-50"}`}
        >
          <div
            className={`text-xs ${darkMode ? "text-zinc-500" : "text-gray-500"}`}
          >
            Роль
          </div>
          <div
            className={`font-semibold capitalize ${darkMode ? "text-zinc-100" : "text-gray-900"}`}
          >
            {role || "admin"}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 text-red-500 rounded-xl font-medium transition-all duration-200 ${darkMode ? "hover:bg-red-950/30" : "hover:bg-red-50"}`}
        >
          <LogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
    </>
  );

  return (
    <div
      className={`min-h-screen ${darkMode ? "admin-dark bg-zinc-950" : "bg-gray-50"}`}
    >
      {/* Mobile header */}
      <div
        className={`md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-40 ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"}`}
      >
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span
            className={`font-bold ${darkMode ? "text-zinc-100" : "text-gray-900"}`}
          >
            HaoriVision
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg transition-colors ${darkMode ? "text-yellow-400 hover:bg-zinc-800" : "text-gray-500 hover:bg-gray-100"}`}
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg ${darkMode ? "text-zinc-400 hover:bg-zinc-800" : "text-gray-600 hover:bg-gray-100"}`}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside
          className={`hidden md:flex w-64 min-h-screen border-r flex-col sticky top-0 h-screen ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"}`}
        >
          {sidebar}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside
              className={`md:hidden fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col shadow-xl ${darkMode ? "bg-zinc-900" : "bg-white"}`}
            >
              {sidebar}
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
