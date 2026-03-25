import Navigation from "./Navigation";
import Footer from "./Footer";
import HikariChat from "./HikariChat";
import AnimatedOutlet from "./AnimatedOutlet";
import ErrorBoundary from "../lib/ErrorBoundary";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";

const PageErrorFallback = (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div
        className="text-5xl mb-4"
        style={{ fontFamily: "serif", color: "#71717a" }}
      >
        光
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">
        Что-то пошло не так
      </h2>
      <p className="text-zinc-400 mb-6">
        Страница временно недоступна. Попробуйте обновить или вернуться на
        главную.
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors"
        >
          Обновить
        </button>
        <Link
          to="/"
          className="px-6 py-3 bg-white text-black rounded hover:bg-zinc-200 transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  </div>
);

const Layout = () => {
  const { isUVMode } = useTheme();

  return (
    <div
      className={`min-h-screen ${isUVMode ? "uv-light-bg" : "bg-black"} transition-colors duration-500`}
    >
      <Navigation />
      <main className="pt-16">
        <ErrorBoundary name="PageContent" fallback={PageErrorFallback}>
          <AnimatedOutlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <HikariChat />
    </div>
  );
};

export default Layout;
