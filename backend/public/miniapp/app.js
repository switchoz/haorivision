/**
 * HaoriVision Telegram Mini App — Core
 * SPA Router + Telegram WebApp + State
 */

const App = {
  tg: null,
  user: null,
  currentScreen: "home",
  cart: [],
  orders: [],
  products: [],
  favorites: new Set(),

  // Fallback product data (used when API is unavailable)
  fallbackProducts: [
    {
      id: "haori-neon-dragon",
      name: "Неоновый дракон",
      category: "haori",
      priceType: "custom",
      price: null,
      currency: "USD",
      images: [
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
      ],
      shortDesc: "UV-реактивный дракон с традиционными элементами",
      longDesc:
        "Ручная роспись UV-реактивного дракона, сочетающая древнюю символику с современной неоновой эстетикой. Каждое изделие уникально и светится в ультрафиолете.",
      tags: ["ручная работа", "UV", "лимитированная"],
      featured: true,
      availability: "made_to_order",
    },
    {
      id: "jeans-mandala",
      name: "Мандала джинсы",
      category: "jeans",
      priceType: "fixed",
      price: 299,
      currency: "USD",
      images: [
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
      ],
      shortDesc: "Сакральная геометрия на премиальном дениме",
      longDesc:
        "Сложные узоры мандалы, расписанные вручную на премиальном японском дениме с UV-реактивными акцентами.",
      tags: ["ручная работа", "UV", "геометрия"],
      featured: true,
      availability: "in_stock",
    },
    {
      id: "jacket-cosmic",
      name: "Космический бомбер",
      category: "jackets",
      priceType: "fixed",
      price: 449,
      currency: "USD",
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80",
      ],
      shortDesc: "Бомбер в стиле галактики",
      longDesc:
        "Стрит-стайл бомбер с расписанными вручную космическими узорами и UV-реактивными звёздами.",
      tags: ["ручная работа", "UV", "космос"],
      featured: true,
      availability: "made_to_order",
    },
    {
      id: "art-mandala-canvas",
      name: "Мандала холст",
      category: "art",
      priceType: "fixed",
      price: 189,
      currency: "USD",
      images: [
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80",
      ],
      shortDesc: "Оригинальная мандала на холсте",
      longDesc:
        "Расписанная вручную мандала на премиальном холсте с UV-реактивными элементами для медитативных пространств.",
      tags: ["ручная работа", "UV", "медитация"],
      featured: true,
      availability: "in_stock",
    },
    {
      id: "haori-phoenix",
      name: "Феникс хаори",
      category: "haori",
      priceType: "fixed",
      price: 399,
      currency: "USD",
      images: [
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80",
      ],
      shortDesc: "Символ возрождения в неоновом пламени",
      longDesc:
        "Величественный дизайн феникса с неоновым пламенем и UV-реактивными деталями.",
      tags: ["ручная работа", "UV", "феникс"],
      featured: false,
      availability: "made_to_order",
    },
    {
      id: "accessories-backpack",
      name: "Космический рюкзак",
      category: "accessories",
      priceType: "fixed",
      price: 159,
      currency: "USD",
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80",
      ],
      shortDesc: "Расписанный вручную космический дизайн",
      longDesc:
        "Премиальный рюкзак с расписанными вручную галактическими узорами и светящимися в темноте звёздами.",
      tags: ["ручная работа", "космос", "практичный"],
      featured: false,
      availability: "in_stock",
    },
  ],

  // Initialize
  async init() {
    this.initTelegram();
    this.loadSavedData();
    await this.loadProducts();
    await this.loadFavorites();
    this.initRouter();
    this.navigate(window.location.hash.slice(1) || "home");
  },

  initTelegram() {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      this.tg = tg;
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#0a0a0a");
      tg.setBackgroundColor("#0a0a0a");

      if (tg.initDataUnsafe?.user) {
        this.user = tg.initDataUnsafe.user;
      }

      tg.BackButton.onClick(() => {
        if (this.currentScreen !== "home") {
          this.navigate("home");
        }
      });

      this.haptic("light");
    }
  },

  haptic(type) {
    this.tg?.HapticFeedback?.impactOccurred(type);
  },

  hapticNotify(type) {
    this.tg?.HapticFeedback?.notificationOccurred(type);
  },

  async loadProducts() {
    try {
      const data = await Api.getProducts();
      if (data?.products?.length) {
        this.products = data.products.map((p) => ({
          ...p,
          id: p.id || p._id,
          images: [p.images?.daylight?.hero, p.images?.uv?.hero].filter(
            Boolean,
          ),
          shortDesc: p.description?.short || p.tagline || "",
          longDesc: p.description?.long || p.description?.short || "",
          priceType: p.price ? "fixed" : "custom",
          tags: p.materials || p.techniques || [],
          availability:
            p.status === "sold-out"
              ? "sold_out"
              : p.editions?.remaining > 0
                ? "in_stock"
                : "made_to_order",
        }));
      } else {
        this.products = this.fallbackProducts;
      }
    } catch {
      this.products = this.fallbackProducts;
    }
  },

  async refreshProducts() {
    await this.loadProducts();
    if (this.currentScreen === "home") this.renderScreen("home");
  },

  async loadFavorites() {
    // Try TG CloudStorage first, fallback to localStorage
    if (this.tg?.CloudStorage) {
      try {
        const data = await new Promise((resolve, reject) => {
          this.tg.CloudStorage.getItem("favorites", (err, val) =>
            err ? reject(err) : resolve(val),
          );
        });
        if (data) this.favorites = new Set(JSON.parse(data));
      } catch {
        this.loadFavoritesLocal();
      }
    } else {
      this.loadFavoritesLocal();
    }
  },

  loadFavoritesLocal() {
    try {
      const saved = localStorage.getItem("hv_miniapp_fav");
      if (saved) this.favorites = new Set(JSON.parse(saved));
    } catch {}
  },

  async saveFavorites() {
    const arr = [...this.favorites];
    if (this.tg?.CloudStorage) {
      try {
        this.tg.CloudStorage.setItem("favorites", JSON.stringify(arr));
      } catch {}
    }
    localStorage.setItem("hv_miniapp_fav", JSON.stringify(arr));
  },

  toggleFavorite(productId) {
    if (this.favorites.has(productId)) {
      this.favorites.delete(productId);
      this.hapticNotify("warning");
    } else {
      this.favorites.add(productId);
      this.hapticNotify("success");
    }
    this.saveFavorites();
  },

  isFavorite(productId) {
    return this.favorites.has(productId);
  },

  loadSavedData() {
    try {
      const saved = localStorage.getItem("haori_orders");
      if (saved) this.orders = JSON.parse(saved);
    } catch {
      /* ignore */
    }
  },

  // Router
  initRouter() {
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.slice(1) || "home";
      const [screen, ...params] = hash.split("/");
      this.renderScreen(screen, params.join("/"));
    });
  },

  navigate(screen, param) {
    this.haptic("light");
    const hash = param ? `${screen}/${param}` : screen;
    window.location.hash = hash;
  },

  renderScreen(screen, param) {
    this.currentScreen = screen;
    if (this._pullCleanup) {
      this._pullCleanup();
      this._pullCleanup = null;
    }
    const app = document.getElementById("app");

    // Скрываем MainButton и убираем обработчик при смене экрана
    if (this.tg) {
      if (Screens._mainButtonHandler) {
        this.tg.MainButton.offClick(Screens._mainButtonHandler);
        Screens._mainButtonHandler = null;
      }
      this.tg.MainButton.hide();
    }

    // Telegram back button
    if (this.tg) {
      if (screen === "home") {
        this.tg.BackButton.hide();
      } else {
        this.tg.BackButton.show();
      }
    }

    // Closing confirmation on checkout
    if (this.tg) {
      if (screen === "checkout") {
        this.tg.enableClosingConfirmation();
      } else {
        this.tg.disableClosingConfirmation();
      }
    }

    switch (screen) {
      case "home":
        app.innerHTML = Screens.home();
        break;
      case "catalog":
        app.innerHTML = Screens.catalog();
        break;
      case "product":
        app.innerHTML = Screens.product(param);
        break;
      case "portfolio":
        app.innerHTML = Screens.portfolio();
        break;
      case "order":
        app.innerHTML = Screens.orderCustom();
        break;
      case "checkout":
        app.innerHTML = Screens.checkout(param);
        break;
      case "orders":
        app.innerHTML = Screens.orders();
        break;
      default:
        app.innerHTML = Screens.home();
        break;
    }

    // Scroll to top
    window.scrollTo(0, 0);

    // Init screen-specific logic
    switch (screen) {
      case "home":
        this._initPullToRefresh();
        break;
      case "catalog":
        Screens.initCatalog();
        break;
      case "product":
        Screens.initProduct(param);
        break;
      case "checkout":
        Screens.initCheckout(param);
        break;
    }

    this.updateNav(screen);
  },

  _initPullToRefresh() {
    let startY = 0;
    let pulling = false;
    const hint = document.getElementById("pull-hint");
    const onStart = (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    };
    const onMove = (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 0 && hint) hint.style.opacity = Math.min(dy / 80, 1);
    };
    const onEnd = (e) => {
      if (!pulling) return;
      pulling = false;
      const dy = e.changedTouches[0].clientY - startY;
      if (hint) hint.style.opacity = "0.6";
      if (dy >= 80 && window.scrollY === 0) {
        if (hint) hint.textContent = "Обновление...";
        this.refreshProducts().then(() => {
          if (hint) hint.textContent = "Потяните вниз для обновления";
        });
      }
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    this._pullCleanup = () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  },

  updateNav(screen) {
    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.screen === screen);
    });
  },

  formatPrice(product) {
    if (!product) return "";
    if (product.priceType === "custom" || !product.price) return "По запросу";
    const symbols = { USD: "$", EUR: "€", RUB: "₽" };
    const sym = symbols[product.currency] || product.currency || "$";
    return `${product.price.toLocaleString("ru-RU")} ${sym}`;
  },

  getProduct(id) {
    return this.products.find((p) => p.id === id || p._id === id);
  },

  createOrder(orderData) {
    const order = {
      id: `order_${Date.now()}`,
      userId: this.user?.id || null,
      username: this.user?.username || null,
      status: "sent",
      createdAt: new Date().toISOString(),
      ...orderData,
    };
    this.orders.push(order);
    localStorage.setItem("haori_orders", JSON.stringify(this.orders));

    if (this.tg) {
      try {
        this.tg.sendData(JSON.stringify(order));
      } catch {
        /* fallback */
      }
    } else {
      // Если не в Telegram — сохраняем заказ через API
      try {
        Api.request("/orders", {
          method: "POST",
          body: JSON.stringify(order),
        });
      } catch {
        /* silent — заказ сохранён локально */
      }
    }
    return order;
  },
};

// Boot
document.addEventListener("DOMContentLoaded", () => App.init());
