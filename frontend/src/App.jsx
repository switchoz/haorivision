import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";

// Lazy loaded pages
const Home = lazy(() => import("./pages/Home"));
const Collections = lazy(() => import("./pages/Collections"));
const Experience = lazy(() => import("./pages/Experience"));
const Shop = lazy(() => import("./pages/Shop"));
const About = lazy(() => import("./pages/About"));

// Regular imports for smaller/critical pages
import Contact from "./pages/Contact";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import ProductDetailWithTrustBlocks from "./pages/ProductDetailWithTrustBlocks";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import OrderTracking from "./pages/OrderTracking";
import FAQ from "./pages/FAQ";
import EventsListPage from "./pages/EventsListPage";
import EventPage from "./pages/EventPage";
import UnboxingPage from "./pages/UnboxingPage";
import UnboxingFeedbackPage from "./pages/UnboxingFeedbackPage";
import Gallery from "./pages/Gallery";
import Metrics from "./pages/admin/Metrics";
import TestErrorBoundary from "./pages/TestErrorBoundary";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import { setupErrorTracking } from "./lib/logger";

function App() {
  // Setup global error tracking for Reliability Kit
  useEffect(() => {
    if (import.meta.env.REACT_APP_RELIABILITY_KIT === "1") {
      setupErrorTracking();
    }
  }, []);
  return (
    <ThemeProvider>
      <Router>
        <Suspense
          fallback={<div className="p-8 text-neutral-400">Loading…</div>}
        >
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="collections" element={<Collections />} />
              <Route path="experience" element={<Experience />} />
              <Route path="shop" element={<Shop />} />
              <Route path="products" element={<Products />} />
              <Route
                path="product/:productId"
                element={<ProductDetailWithTrustBlocks />}
              />
              <Route path="checkout" element={<Checkout />} />
              <Route path="checkout/success" element={<CheckoutSuccess />} />
              <Route path="orders/:orderId" element={<OrderTracking />} />
              <Route path="events" element={<EventsListPage />} />
              <Route path="events/:slug" element={<EventPage />} />
              <Route path="unboxing/:qrCode" element={<UnboxingPage />} />
              <Route
                path="unboxing/:qrCode/feedback"
                element={<UnboxingFeedbackPage />}
              />
              <Route path="gallery" element={<Gallery />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="admin/metrics" element={<Metrics />} />
              <Route
                path="test-error-boundary"
                element={<TestErrorBoundary />}
              />
              {/* Error Pages (P22) */}
              <Route path="/500" element={<ServerError />} />
              <Route path="*" element={<NotFound />} /> {/* 404 Catch-all */}
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
