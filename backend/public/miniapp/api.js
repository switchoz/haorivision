/**
 * HaoriVision Mini App — API Client
 * Connects to backend at the same origin
 */

const API_BASE = window.location.origin + "/api";

const Api = {
  async request(path, options = {}) {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`API error [${path}]:`, err);
      return null;
    }
  },

  // Products
  async getProducts() {
    return this.request("/products") || { products: [] };
  },

  async getProduct(id) {
    return this.request(`/products/${id}`);
  },

  // Bespoke orders
  async createBespokeOrder(data) {
    return this.request("/bespoke/create", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Community designs
  async submitDesign(data) {
    return this.request("/community-designs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Telegram
  async getTelegramPosts() {
    return this.request("/telegram/posts?status=sent&limit=10");
  },
};

window.Api = Api;
