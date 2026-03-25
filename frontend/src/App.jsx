import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import Layout from "./components/Layout";
import CartDrawer from "./components/CartDrawer";
import ScrollToTop from "./components/ScrollToTop";

// Lazy loaded pages
const Home = lazy(() => import("./pages/Home"));
const Collections = lazy(() => import("./pages/Collections"));
const Experience = lazy(() => import("./pages/Experience"));
const Shop = lazy(() => import("./pages/Shop"));
const About = lazy(() => import("./pages/About"));

// All pages lazy loaded for optimal code splitting
const Contact = lazy(() => import("./pages/Contact"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ProductDetailWithTrustBlocks = lazy(
  () => import("./pages/ProductDetailWithTrustBlocks"),
);
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const FAQ = lazy(() => import("./pages/FAQ"));
const EventsListPage = lazy(() => import("./pages/EventsListPage"));
const EventPage = lazy(() => import("./pages/EventPage"));
const UnboxingPage = lazy(() => import("./pages/UnboxingPage"));
const UnboxingFeedbackPage = lazy(() => import("./pages/UnboxingFeedbackPage"));
const Gallery = lazy(() => import("./pages/Gallery"));
const BespokeCommission = lazy(() => import("./pages/BespokeCommissionPage"));
const ARTryOn = lazy(() => import("./pages/ARTryOn"));
const Haori3DStudio = lazy(() => import("./pages/Haori3DStudio"));
const Presentation = lazy(() => import("./pages/Presentation"));
const Metrics = lazy(() => import("./pages/admin/Metrics"));
const TestErrorBoundary = lazy(() => import("./pages/TestErrorBoundary"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ServerError = lazy(() => import("./pages/ServerError"));
import { setupErrorTracking } from "./lib/logger";

// Admin Panel Components (lazy)
const Guard = lazy(() => import("./admin/Guard"));
const AdminLayout = lazy(() => import("./admin/Layout"));
const AdminLogin = lazy(() => import("./admin/Login"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const Orders = lazy(() => import("./admin/pages/Orders"));
const Flags = lazy(() => import("./admin/pages/Flags"));
const AdminProducts = lazy(() => import("./admin/pages/Products"));
const Logs = lazy(() => import("./admin/pages/Logs"));
const Messages = lazy(() => import("./admin/pages/Messages"));
const AdminBespoke = lazy(() => import("./admin/pages/Bespoke"));
const AdminTelegram = lazy(() => import("./admin/pages/Telegram"));
const AdminBlogPage = lazy(() => import("./admin/pages/Blog"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const ReviewsPage = lazy(() => import("./pages/Reviews"));
const AccountPage = lazy(() => import("./pages/Account"));
const AdminReviewsPage = lazy(() => import("./admin/pages/Reviews"));
const AdminPromo = lazy(() => import("./admin/pages/Promo"));

function App() {
  // Setup global error tracking for Reliability Kit
  useEffect(() => {
    if (import.meta.env.REACT_APP_RELIABILITY_KIT === "1") {
      setupErrorTracking();
    }
  }, []);
  return (
    <ThemeProvider>
      <CartProvider>
        <Toaster position="top-right" />
        <Router>
          <ScrollToTop />
          <Suspense
            fallback={
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="text-4xl mb-4"
                    style={{ fontFamily: "serif" }}
                  >
                    光
                  </div>
                  <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto"></div>
                </div>
              </div>
            }
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
                <Route path="bespoke" element={<BespokeCommission />} />
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
                <Route path="journal" element={<Blog />} />
                <Route path="journal/:slug" element={<BlogPostPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="ar-tryon" element={<ARTryOn />} />
                <Route path="3d-studio" element={<Haori3DStudio />} />
                <Route path="presentation" element={<Presentation />} />
                <Route path="admin/metrics" element={<Metrics />} />
                <Route
                  path="test-error-boundary"
                  element={<TestErrorBoundary />}
                />
                {/* Error Pages (P22) */}
                <Route path="/500" element={<ServerError />} />
              </Route>

              {/* Admin Panel Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <Guard>
                    <AdminLayout />
                  </Guard>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="messages" element={<Messages />} />
                <Route path="bespoke" element={<AdminBespoke />} />
                <Route path="telegram" element={<AdminTelegram />} />
                <Route path="blog" element={<AdminBlogPage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="promo" element={<AdminPromo />} />
                <Route
                  path="products"
                  element={
                    <Guard allow={["admin", "editor"]}>
                      <AdminProducts />
                    </Guard>
                  }
                />
                <Route
                  path="flags"
                  element={
                    <Guard allow={["admin"]}>
                      <Flags />
                    </Guard>
                  }
                />
                <Route path="logs" element={<Logs />} />
              </Route>

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CartDrawer />
        </Router>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
