import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import HikariChat from "./HikariChat";
import { useTheme } from "../contexts/ThemeContext";

const Layout = () => {
  const { isUVMode } = useTheme();

  return (
    <div
      className={`min-h-screen ${isUVMode ? "uv-light-bg" : "bg-black"} transition-colors duration-500`}
    >
      <Navigation />
      <main className="pt-16">
        <Outlet />
      </main>
      <Footer />
      <HikariChat />
    </div>
  );
};

export default Layout;
