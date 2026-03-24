import { useState, useEffect } from "react";
import { adminLogin, setToken } from "./api";
import { tid } from "../shared/testid";
import { Lock, Mail, Sparkles, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle OAuth redirect with token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");
    const provider = params.get("provider");

    if (error) {
      const errorMessages: Record<string, string> = {
        vk_auth_failed: "Ошибка авторизации через ВКонтакте",
        yandex_auth_failed: "Ошибка авторизации через Яндекс",
        mailru_auth_failed: "Ошибка авторизации через Mail.ru",
        token_generation_failed: "Ошибка создания токена авторизации",
      };
      setErr(errorMessages[error] || "Ошибка авторизации");
      // Clean URL
      window.history.replaceState({}, "", "/admin/login");
    } else if (token && provider) {
      // Save token and redirect
      setToken(token);
      window.location.href = "/admin";
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setErr("Заполните все поля");
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const res = await adminLogin(email, password);
      if (res?.ok && res.token) {
        setToken(res.token);
        location.href = "/admin";
      } else {
        setErr("Неверный email или пароль");
      }
    } catch (error) {
      setErr("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HaoriVision</h1>
          <p className="text-gray-600">Панель администратора</p>
        </div>

        {/* Login Card */}
        <div
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
          {...tid("admin-login")}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Вход в систему
          </h2>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="admin@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                {...tid("admin-email")}
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                {...tid("admin-password")}
              />
            </div>
          </div>

          {/* Error Message */}
          {err && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{err}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            {...tid("admin-login-submit")}
          >
            {loading ? "Вход..." : "Войти"}
          </button>

          {/* Social Login Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Или войти через
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() =>
                (window.location.href =
                  (import.meta.env.VITE_API_URL || "") + "/api/admin/auth/vk")
              }
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
              title="Войти через ВКонтакте"
              {...tid("login-vk")}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.785 16.241s.288-.032.436-.193c.136-.148.132-.427.132-.427s-.02-1.304.573-1.497c.583-.19 1.331 1.26 2.124 1.817.6.422 1.056.33 1.056.33l2.123-.03s1.11-.07.584-.963c-.043-.073-.308-.663-1.584-1.876-1.336-1.27-1.157-1.065.452-3.263.98-1.339 1.372-2.156 1.25-2.506-.117-.333-.84-.245-.84-.245l-2.39.015s-.177-.025-.308.056c-.128.079-.21.263-.21.263s-.377 1.025-.88 1.897c-1.06 1.837-1.484 1.934-1.658 1.819-.403-.267-.302-1.075-.302-1.648 0-1.79.265-2.535-.517-2.729-.26-.065-.451-.107-1.115-.114-.852-.009-1.573.003-1.981.207-.271.136-.48.439-.353.457.158.022.515.099.704.363.244.342.236 1.11.236 1.11s.141 2.108-.329 2.37c-.322.18-.763-.187-1.711-1.866-.485-.85-.852-1.789-.852-1.789s-.071-.177-.197-.272c-.153-.115-.367-.152-.367-.152l-2.27.015s-.341.01-.466.161c-.111.134-.009.411-.009.411s1.779 4.249 3.795 6.392c1.85 1.966 3.947 1.836 3.947 1.836h.953z" />
              </svg>
              <span className="hidden sm:inline">VK</span>
            </button>

            <button
              onClick={() =>
                (window.location.href =
                  (import.meta.env.VITE_API_URL || "") +
                  "/api/admin/auth/yandex")
              }
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all"
              title="Войти через Яндекс"
              {...tid("login-yandex")}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.93 14.93h-2.31l-2.69-5.38V16.93H6.62V7.07h3.23c2.01 0 3.23 1.12 3.23 2.89 0 1.54-.92 2.42-2.16 2.73l2.54 4.24h.47zm-2.85-6.39c.92 0 1.54-.54 1.54-1.39 0-.85-.62-1.31-1.54-1.31h-.85v2.7h.85z" />
              </svg>
              <span className="hidden sm:inline">Яндекс</span>
            </button>

            <button
              onClick={() =>
                (window.location.href =
                  (import.meta.env.VITE_API_URL || "") +
                  "/api/admin/auth/mailru")
              }
              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-all"
              title="Войти через Mail.ru"
              {...tid("login-mailru")}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.585 5.267c1.834 0 3.558.811 4.824 2.08v.004c0-.609.41-1.068.979-1.068h.145c.891 0 1.073.842 1.073 1.109l.005 9.475c-.063.621.64.941 1.029.543 1.521-1.564 3.342-8.038-.946-11.79-3.996-3.497-9.357-2.921-12.209-.955-3.031 2.091-4.971 6.718-3.086 11.064 2.054 4.74 7.931 6.152 11.424 4.744 1.769-.715 2.586 1.676.749 2.457-2.776 1.184-10.502 1.064-14.11-5.188C-.977 13.521-.847 6.093 5.62 2.245 10.567-.698 17.09.117 21.022 4.224c4.111 4.294 3.872 12.334-.139 15.461-1.816 1.42-4.516.037-4.498-2.031l-.019-.678c-1.265 1.256-2.948 1.988-4.782 1.988-3.625 0-6.813-3.189-6.813-6.812 0-3.659 3.189-6.885 6.814-6.885zm4.561 6.623c-.137-2.653-2.106-4.249-4.484-4.249h-.09c-2.745 0-4.268 2.159-4.268 4.61 0 2.747 1.842 4.481 4.256 4.481 2.693 0 4.464-1.973 4.592-4.306l-.006-.536z" />
              </svg>
              <span className="hidden sm:inline">Mail</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Используйте учетные данные администратора
            </p>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Version 1.0.0 • HaoriVision Admin
        </p>
      </div>
    </div>
  );
}
