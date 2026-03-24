/**
 * HaoriVision Mini App — Screen Renderers
 */

const Screens = {
  // ═══════════════════════════════════════════
  // HOME
  // ═══════════════════════════════════════════
  home() {
    const featured = App.products.filter((p) => p.featured);
    const userName = App.user?.first_name || "";

    return `
    <header class="header">
      <a class="logo" onclick="App.navigate('home')">HaoriVision</a>
      <div class="header-actions">
        <button class="icon-btn" onclick="App.navigate('catalog')">
          <i class="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
    </header>

    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="brand-icon"><i class="fa-solid fa-palette"></i></div>
        ${
          userName
            ? `<p class="text-caption text-secondary" style="margin-bottom:var(--space-2)">
          ${userName}, ...</p>`
            : ""
        }
        <h1 class="text-display">HaoriVision</h1>
        <p class="manifesto">Свет, который можно носить.<br>Ручная роспись.<br>Единственный экземпляр.</p>
      </div>
    </section>

    <section class="section">
      <div class="cta-grid">
        <a class="card cta-tile" onclick="App.navigate('catalog')">
          <div class="cta-tile-icon"><i class="fa-solid fa-bag-shopping"></i></div>
          <h2 class="cta-tile-title">Каталог</h2>
          <p class="cta-tile-desc">Готовые изделия</p>
        </a>
        <a class="card cta-tile" onclick="App.navigate('order')">
          <div class="cta-tile-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
          <h2 class="cta-tile-title">Заказать</h2>
          <p class="cta-tile-desc">Индивидуальный дизайн</p>
        </a>
        <a class="card cta-tile" onclick="App.navigate('portfolio')">
          <div class="cta-tile-icon"><i class="fa-solid fa-images"></i></div>
          <h2 class="cta-tile-title">Портфолио</h2>
          <p class="cta-tile-desc">Наши работы</p>
        </a>
      </div>
    </section>

    <section class="section">
      <h2 class="text-h1" style="margin-bottom:var(--space-6);text-align:center;">Избранное</h2>
      <div class="featured-grid">
        ${featured
          .map(
            (p) => `
          <a class="card product-card" onclick="App.navigate('product','${p.id || p._id}')">
            <img src="${p.images?.[0] || ""}" alt="${p.name}" class="product-image" loading="lazy">
            <div style="padding:var(--space-3)">
              <h3 class="product-name">${p.name}</h3>
              <p class="product-price">${App.formatPrice(p)}</p>
            </div>
          </a>
        `,
          )
          .join("")}
      </div>
    </section>

    <section class="section">
      <h2 class="text-h1" style="margin-bottom:var(--space-6);text-align:center;">Как это работает</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Выберите основу</h3>
            <p>Хаори, джинсы, куртки или арт-объекты</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Утвердите эскиз</h3>
            <p>Мы создаём цифровой превью вашего дизайна</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Получите носимое искусство</h3>
            <p>Ручная роспись UV-пигментами, доставка по всему миру</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="trust-blocks">
        <div class="trust-block">
          <div class="trust-icon"><i class="fa-solid fa-paintbrush"></i></div>
          <div class="trust-title">Ручная роспись</div>
          <div class="trust-desc">Каждое изделие уникально</div>
        </div>
        <div class="trust-block">
          <div class="trust-icon"><i class="fa-solid fa-lightbulb"></i></div>
          <div class="trust-title">UV-реактивность</div>
          <div class="trust-desc">Светится в ультрафиолете</div>
        </div>
        <div class="trust-block">
          <div class="trust-icon"><i class="fa-solid fa-gem"></i></div>
          <div class="trust-title">Единственный экземпляр</div>
          <div class="trust-desc">Никогда не повторяется</div>
        </div>
        <div class="trust-block">
          <div class="trust-icon"><i class="fa-solid fa-box"></i></div>
          <div class="trust-title">Под заказ</div>
          <div class="trust-desc">2-3 недели изготовления</div>
        </div>
      </div>
    </section>

    <div style="height:80px"></div>
    ${this._bottomNav("home")}`;
  },

  // ═══════════════════════════════════════════
  // CATALOG
  // ═══════════════════════════════════════════
  catalog() {
    return `
    <header class="header">
      <button class="back-btn" onclick="App.navigate('home')"><i class="fa-solid fa-arrow-left"></i></button>
      <h1 class="header-title">Каталог</h1>
      <button class="search-btn" id="search-toggle"><i class="fa-solid fa-magnifying-glass"></i></button>
    </header>

    <div id="search-bar" class="search-bar" style="display:none">
      <input type="text" id="search-input" class="search-input" placeholder="Поиск..." oninput="Screens.filterCatalog()">
    </div>

    <section class="filters-section">
      <div class="filter-tabs" id="category-tabs">
        <button class="filter-tab active" data-cat="all">Все</button>
        <button class="filter-tab" data-cat="haori">Хаори</button>
        <button class="filter-tab" data-cat="jeans">Джинсы</button>
        <button class="filter-tab" data-cat="jackets">Куртки</button>
        <button class="filter-tab" data-cat="accessories">Аксессуары</button>
        <button class="filter-tab" data-cat="art">Арт</button>
      </div>
      <div class="filter-controls">
        <select class="filter-select" id="price-filter" onchange="Screens.filterCatalog()">
          <option value="">Все цены</option>
          <option value="0-200">До $200</option>
          <option value="200-400">$200 - $400</option>
          <option value="400+">$400+</option>
          <option value="custom">Индивидуальная</option>
        </select>
        <select class="filter-select" id="sort-select" onchange="Screens.filterCatalog()">
          <option value="featured">Рекомендуемые</option>
          <option value="price-low">Цена: по возрастанию</option>
          <option value="price-high">Цена: по убыванию</option>
        </select>
      </div>
    </section>

    <main class="products-section">
      <div class="products-header">
        <div class="results-count" id="results-count"></div>
        <div class="view-toggle">
          <button class="view-btn active" data-view="grid" onclick="Screens.setView('grid')">
            <i class="fa-solid fa-grid-2"></i>
          </button>
          <button class="view-btn" data-view="list" onclick="Screens.setView('list')">
            <i class="fa-solid fa-bars"></i>
          </button>
        </div>
      </div>
      <div id="products-grid" class="products-grid"></div>
      <div id="empty-state" class="empty-state" style="display:none">
        <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h2 class="empty-title">Ничего не найдено</h2>
        <p class="empty-desc">Попробуйте изменить фильтры</p>
      </div>
    </main>

    <div style="height:80px"></div>
    ${this._bottomNav("catalog")}`;
  },

  _catalogCategory: "all",
  _catalogView: "grid",

  initCatalog() {
    // Category tabs
    document.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this._catalogCategory = tab.dataset.cat;
        this.filterCatalog();
      });
    });

    // Search toggle
    document.getElementById("search-toggle")?.addEventListener("click", () => {
      const bar = document.getElementById("search-bar");
      bar.style.display = bar.style.display === "none" ? "block" : "none";
      if (bar.style.display === "block")
        document.getElementById("search-input").focus();
    });

    this.filterCatalog();
  },

  filterCatalog() {
    const search =
      document.getElementById("search-input")?.value?.toLowerCase() || "";
    const priceFilter = document.getElementById("price-filter")?.value || "";
    const sort = document.getElementById("sort-select")?.value || "featured";

    let filtered = App.products.filter((p) => {
      // Category
      if (
        this._catalogCategory !== "all" &&
        p.category !== this._catalogCategory
      )
        return false;
      // Search
      if (
        search &&
        !(
          p.name.toLowerCase().includes(search) ||
          p.shortDesc?.toLowerCase().includes(search)
        )
      )
        return false;
      // Price
      if (priceFilter) {
        if (priceFilter === "custom") return p.priceType === "custom";
        const [min, max] = priceFilter.split("-").map(Number);
        if (p.priceType === "custom") return false;
        if (max) return p.price >= min && p.price <= max;
        return p.price >= min;
      }
      return true;
    });

    // Sort
    if (sort === "price-low")
      filtered.sort((a, b) => (a.price || 9999) - (b.price || 9999));
    if (sort === "price-high")
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));

    const grid = document.getElementById("products-grid");
    const empty = document.getElementById("empty-state");
    const count = document.getElementById("results-count");

    if (!filtered.length) {
      grid.style.display = "none";
      empty.style.display = "block";
      count.textContent = "Ничего не найдено";
      return;
    }

    grid.style.display = "grid";
    empty.style.display = "none";
    count.textContent = `${filtered.length} ${this._plural(filtered.length, "товар", "товара", "товаров")}`;

    grid.className = `products-grid ${this._catalogView === "list" ? "list-view" : ""}`;
    grid.innerHTML = filtered
      .map(
        (p) => `
      <a class="card product-card ${this._catalogView === "list" ? "list-view" : ""}"
         onclick="App.navigate('product','${p.id || p._id}')">
        <div class="product-image-wrap">
          <img src="${p.images?.[0] || ""}" alt="${p.name}" class="product-img" loading="lazy">
          <div class="product-badge">${p.availability === "in_stock" ? "В наличии" : "Под заказ"}</div>
        </div>
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-price">${App.formatPrice(p)}</p>
          <p class="product-desc">${p.shortDesc || ""}</p>
          <div class="product-tags">
            ${(p.tags || []).map((t) => `<span class="product-tag">${t}</span>`).join("")}
          </div>
        </div>
      </a>
    `,
      )
      .join("");
  },

  setView(view) {
    this._catalogView = view;
    document
      .querySelectorAll(".view-btn")
      .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    this.filterCatalog();
  },

  // ═══════════════════════════════════════════
  // PRODUCT DETAIL
  // ═══════════════════════════════════════════
  product(id) {
    const p = App.getProduct(id);
    if (!p) return `<div class="empty-state"><h2>Товар не найден</h2></div>`;

    return `
    <header class="header">
      <button class="back-btn" onclick="App.navigate('catalog')"><i class="fa-solid fa-arrow-left"></i></button>
      <h1 class="header-title">${p.name}</h1>
      <button class="icon-btn" id="share-btn"><i class="fa-solid fa-share-nodes"></i></button>
    </header>

    <div class="product-gallery" id="gallery">
      <div class="gallery-slider" id="gallery-slider">
        ${(p.images || [])
          .map(
            (img, i) => `
          <div class="gallery-slide ${i === 0 ? "active" : ""}">
            <img src="${img}" alt="${p.name}" loading="lazy">
          </div>
        `,
          )
          .join("")}
      </div>
      ${
        p.images?.length > 1
          ? `
        <div class="gallery-dots">
          ${p.images.map((_, i) => `<button class="gallery-dot ${i === 0 ? "active" : ""}" onclick="Screens.goToSlide(${i})"></button>`).join("")}
        </div>
      `
          : ""
      }
    </div>

    <section class="section">
      <h1 class="text-h1" style="margin-bottom:var(--space-2)">${p.name}</h1>
      <p class="product-price-lg">${App.formatPrice(p)}</p>

      <div class="product-badges" style="margin:var(--space-4) 0">
        <span class="badge badge-cyan"><i class="fa-solid fa-paintbrush"></i> Ручная роспись</span>
        <span class="badge badge-magenta"><i class="fa-solid fa-lightbulb"></i> UV-реактивный</span>
        ${p.availability === "made_to_order" ? '<span class="badge badge-lime"><i class="fa-solid fa-gem"></i> Лимитированный</span>' : ""}
      </div>

      <p class="text-body text-secondary" style="margin-bottom:var(--space-6)">${p.longDesc || p.shortDesc}</p>

      <h3 class="text-caption text-secondary" style="margin-bottom:var(--space-2)">Размер</h3>
      <div class="size-selector" id="size-selector">
        ${["XS", "S", "M", "L", "XL", "XXL"]
          .map(
            (s) => `
          <button class="size-btn ${s === "M" ? "active" : ""}" data-size="${s}">${s}</button>
        `,
          )
          .join("")}
      </div>

      <textarea class="custom-notes" id="custom-notes" placeholder="Особые пожелания (необязательно)..." rows="3"></textarea>

      <button class="btn btn-primary btn-lg btn-block" onclick="Screens.orderProduct('${p.id || p._id}')">
        <i class="fa-brands fa-telegram"></i> Заказать в Telegram
      </button>

      <p class="text-small text-tertiary" style="text-align:center;margin-top:var(--space-3)">
        Вы свяжетесь напрямую с художником для уточнения деталей
      </p>
    </section>`;
  },

  _currentSlide: 0,

  initProduct(id) {
    // Size selector
    document.querySelectorAll(".size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".size-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        App.haptic("light");
      });
    });

    // Share
    document.getElementById("share-btn")?.addEventListener("click", () => {
      const p = App.getProduct(id);
      if (navigator.share) {
        navigator.share({
          title: p?.name,
          text: p?.shortDesc,
          url: window.location.href,
        });
      }
    });

    // Swipe gallery
    this._initGallerySwipe();
  },

  _initGallerySwipe() {
    const slider = document.getElementById("gallery-slider");
    if (!slider) return;
    let startX = 0;
    slider.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
    slider.addEventListener("touchend", (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      const slides = slider.querySelectorAll(".gallery-slide");
      if (Math.abs(diff) > 50) {
        if (diff > 0 && this._currentSlide < slides.length - 1)
          this.goToSlide(this._currentSlide + 1);
        else if (diff < 0 && this._currentSlide > 0)
          this.goToSlide(this._currentSlide - 1);
      }
    });
  },

  goToSlide(i) {
    this._currentSlide = i;
    document
      .querySelectorAll(".gallery-slide")
      .forEach((s, idx) => s.classList.toggle("active", idx === i));
    document
      .querySelectorAll(".gallery-dot")
      .forEach((d, idx) => d.classList.toggle("active", idx === i));
  },

  orderProduct(id) {
    const p = App.getProduct(id);
    if (!p) return;
    const size =
      document.querySelector(".size-btn.active")?.dataset.size || "M";
    const notes = document.getElementById("custom-notes")?.value || "";

    App.haptic("medium");

    const order = App.createOrder({
      productId: id,
      productName: p.name,
      price: App.formatPrice(p),
      size,
      notes,
    });

    const msg = encodeURIComponent(
      `🎨 Заказ HaoriVision\n\n📦 ${p.name}\n📐 Размер: ${size}\n💰 ${App.formatPrice(p)}${notes ? `\n📝 ${notes}` : ""}\n\nID: ${order.id}`,
    );

    const botUrl = `https://t.me/haori_vision_bot?start=order_${order.id}`;
    if (App.tg) {
      App.tg.openTelegramLink(botUrl);
    } else {
      window.open(botUrl, "_blank");
    }
  },

  // ═══════════════════════════════════════════
  // PORTFOLIO
  // ═══════════════════════════════════════════
  portfolio() {
    const works = App.products.filter((p) => p.featured);

    return `
    <header class="header">
      <button class="back-btn" onclick="App.navigate('home')"><i class="fa-solid fa-arrow-left"></i></button>
      <h1 class="header-title">Портфолио</h1>
    </header>

    <section class="section">
      <p class="text-body text-secondary" style="text-align:center;margin-bottom:var(--space-6)">
        Каждая работа — уникальное произведение носимого искусства.<br>Ручная роспись UV-пигментами.
      </p>

      <h2 class="text-h2" style="margin-bottom:var(--space-4)">Работы HaoriVision</h2>
      <div class="portfolio-grid">
        ${works
          .map(
            (w) => `
          <div class="card portfolio-item" onclick="App.navigate('product','${w.id || w._id}')">
            <img src="${w.images?.[0] || ""}" alt="${w.name}" class="portfolio-img" loading="lazy">
            <div class="portfolio-overlay">
              <h3>${w.name}</h3>
              <p>${w.shortDesc || ""}</p>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </section>

    <section class="section">
      <div class="card" style="padding:var(--space-6);text-align:center;border-color:var(--color-accent-cyan)">
        <div style="font-size:2rem;margin-bottom:var(--space-3)"><i class="fa-solid fa-palette"></i></div>
        <h3 class="text-h2" style="margin-bottom:var(--space-2)">Каждая работа — по вдохновению</h3>
        <p class="text-caption text-secondary" style="margin-bottom:var(--space-4)">
          Художник не пишет на заказ — каждое изделие рождается из вдохновения.<br>
          Хотите обсудить личный заказ? Напишите нам.
        </p>
        <button class="btn btn-primary btn-lg" onclick="Screens.openDM()">
          <i class="fa-brands fa-telegram"></i> Написать художнику
        </button>
      </div>
    </section>

    <div style="height:80px"></div>
    ${this._bottomNav("portfolio")}`;
  },

  // ═══════════════════════════════════════════
  // PERSONAL ORDER (DM)
  // ═══════════════════════════════════════════
  orderCustom() {
    return `
    <header class="header">
      <button class="back-btn" onclick="App.navigate('home')"><i class="fa-solid fa-arrow-left"></i></button>
      <h1 class="header-title">Личный заказ</h1>
    </header>

    <section class="section" style="text-align:center">
      <div class="brand-icon" style="margin:var(--space-8) auto var(--space-6)"><i class="fa-solid fa-palette"></i></div>
      <h2 class="text-display" style="margin-bottom:var(--space-4)">По вдохновению</h2>
      <p class="text-body text-secondary" style="max-width:340px;margin:0 auto var(--space-8)">
        Каждое изделие HaoriVision рождается из вдохновения художника — не по шаблону, а по зову внутреннего света.
      </p>

      <div class="steps" style="text-align:left;margin-bottom:var(--space-8)">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Напишите нам</h3>
            <p>Расскажите о себе, своей энергии и что вас вдохновляет</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Обсудим лично</h3>
            <p>Художник почувствует вашу энергию и предложит концепцию</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Создание</h3>
            <p>2-4 недели ручной росписи UV-пигментами</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>Доставка</h3>
            <p>Упаковка в подарочную коробку, доставка по всему миру</p>
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-lg btn-block" onclick="Screens.openDM()">
        <i class="fa-brands fa-telegram"></i> Написать художнику
      </button>
      <p class="text-small text-tertiary" style="margin-top:var(--space-3)">
        Ответим в течение 24 часов
      </p>

      <div class="trust-blocks" style="margin-top:var(--space-8)">
        <div class="trust-block">
          <div class="trust-icon"><i class="fa-solid fa-paintbrush"></i></div>
          <div class="trust-title">Ручная роспись</div>
          <div class="trust-desc">Только руками художника</div>
        </div>
        <div class="trust-block">
          <div class="trust-icon"><i class="fa-solid fa-gem"></i></div>
          <div class="trust-title">Уникальность</div>
          <div class="trust-desc">Никогда не повторяется</div>
        </div>
      </div>
    </section>

    <div style="height:80px"></div>
    ${this._bottomNav("order")}`;
  },

  // Opens DM with the bot/artist
  openDM() {
    App.haptic("medium");
    const botUrl = "https://t.me/haori_vision_bot";
    if (App.tg) {
      App.tg.openTelegramLink(botUrl);
    } else {
      window.open(botUrl, "_blank");
    }
  },

  // ═══════════════════════════════════════════
  // CHECKOUT
  // ═══════════════════════════════════════════
  checkout(productId) {
    const p = productId ? App.getProduct(productId) : null;

    return `
    <header class="header">
      <button class="back-btn" onclick="history.back()"><i class="fa-solid fa-arrow-left"></i></button>
      <h1 class="header-title">Оформление заказа</h1>
    </header>

    <section class="section">
      ${
        p
          ? `
        <div class="card" style="padding:var(--space-4);display:flex;gap:var(--space-4);margin-bottom:var(--space-6)">
          <img src="${p.images?.[0] || ""}" alt="${p.name}" style="width:80px;height:80px;border-radius:var(--radius-md);object-fit:cover">
          <div>
            <h3 class="text-body">${p.name}</h3>
            <p class="product-price">${App.formatPrice(p)}</p>
          </div>
        </div>
      `
          : ""
      }

      <form id="checkout-form" class="form" onsubmit="return false">
        <h2 class="text-h2" style="margin-bottom:var(--space-4)">Контактные данные</h2>

        <div class="form-group">
          <label class="form-label">Полное имя *</label>
          <input type="text" class="form-input" id="ch-name" required value="${App.user?.first_name || ""}">
        </div>
        <div class="form-group">
          <label class="form-label">E-mail *</label>
          <input type="email" class="form-input" id="ch-email" required placeholder="your@email.com">
        </div>
        <div class="form-group">
          <label class="form-label">Телефон</label>
          <input type="tel" class="form-input" id="ch-phone" placeholder="+7 ...">
        </div>

        <h2 class="text-h2" style="margin:var(--space-6) 0 var(--space-4)">Доставка</h2>

        <div class="form-group">
          <label class="form-label">Страна *</label>
          <select class="form-select" id="ch-country" required>
            <option value="RU">Россия</option>
            <option value="KZ">Казахстан</option>
            <option value="BY">Беларусь</option>
            <option value="OTHER">Другая</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Город *</label>
          <input type="text" class="form-input" id="ch-city" required>
        </div>
        <div class="form-group">
          <label class="form-label">Адрес *</label>
          <textarea class="form-textarea" id="ch-address" required rows="2" placeholder="Улица, дом, квартира"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Почтовый индекс</label>
          <input type="text" class="form-input" id="ch-zip" placeholder="123456">
        </div>

        ${
          p
            ? `
          <div class="checkout-total card" style="padding:var(--space-4);margin:var(--space-6) 0">
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
              <span class="text-secondary">Товар</span>
              <span>${App.formatPrice(p)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
              <span class="text-secondary">Доставка</span>
              <span>Бесплатно</span>
            </div>
            <div style="display:flex;justify-content:space-between;border-top:1px solid var(--color-border);padding-top:var(--space-3);font-weight:600">
              <span>Итого</span>
              <span class="text-accent">${App.formatPrice(p)}</span>
            </div>
          </div>
        `
            : ""
        }

        <button type="submit" class="btn btn-primary btn-lg btn-block" id="checkout-submit">
          <i class="fa-solid fa-lock"></i> Оплатить
        </button>
        <p class="text-small text-tertiary" style="text-align:center;margin-top:var(--space-3)">
          Безопасная оплата через Stripe
        </p>
      </form>
    </section>`;
  },

  initCheckout(productId) {
    document
      .getElementById("checkout-submit")
      ?.addEventListener("click", () => {
        const name = document.getElementById("ch-name")?.value;
        const email = document.getElementById("ch-email")?.value;
        const city = document.getElementById("ch-city")?.value;
        const address = document.getElementById("ch-address")?.value;

        if (!name || !email || !city || !address) {
          App.hapticNotify("error");
          return alert("Заполните все обязательные поля");
        }

        App.haptic("heavy");

        const p = App.getProduct(productId);
        App.createOrder({
          type: "checkout",
          productId,
          productName: p?.name,
          price: App.formatPrice(p),
          shipping: { name, email, city, address },
        });

        App.hapticNotify("success");
        document.querySelector(".section").innerHTML = `
        <div class="success-screen">
          <div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>
          <h2 class="text-h1">Заказ оформлен!</h2>
          <p class="text-body text-secondary" style="margin:var(--space-4) 0">
            Мы свяжемся с вами по e-mail и в Telegram для подтверждения.
          </p>
          <button class="btn btn-primary" onclick="App.navigate('home')">На главную</button>
        </div>
      `;
      });
  },

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════
  _bottomNav(active) {
    const items = [
      { screen: "home", icon: "fa-house", label: "Главная" },
      { screen: "catalog", icon: "fa-bag-shopping", label: "Каталог" },
      { screen: "order", icon: "fa-pen-nib", label: "Написать" },
      { screen: "portfolio", icon: "fa-images", label: "Портфолио" },
    ];
    return `
    <nav class="bottom-nav">
      <div class="nav-items">
        ${items
          .map(
            (i) => `
          <a class="nav-item ${active === i.screen ? "active" : ""}" data-screen="${i.screen}"
             onclick="App.navigate('${i.screen}')">
            <i class="fa-solid ${i.icon}"></i>
            <span>${i.label}</span>
          </a>
        `,
          )
          .join("")}
      </div>
    </nav>`;
  },

  _statusLabel(status) {
    const labels = {
      pending: "На рассмотрении",
      approved: "Одобрен",
      live: "В продаже",
      archived: "Архив",
    };
    return labels[status] || status;
  },

  _plural(n, one, few, many) {
    const mod = n % 100;
    if (mod >= 11 && mod <= 19) return many;
    const last = n % 10;
    if (last === 1) return one;
    if (last >= 2 && last <= 4) return few;
    return many;
  },
};

window.Screens = Screens;
