import { test, expect, request as pwRequest } from "@playwright/test";
import { makeToken } from "../helpers/jwt";

const API_BASE = process.env.API_BASE || "http://localhost:3010";

test.describe("RBAC export orders", () => {
  test("viewer → POST /api/admin/orders/export → 403", async () => {
    const ctx = await pwRequest.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${makeToken("viewer")}` },
    });
    const res = await ctx.post("/api/admin/orders/export", { data: {} });
    expect(res.status()).toBe(403);
  });

  test("editor → POST /api/admin/orders/export → 200 CSV", async () => {
    const ctx = await pwRequest.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${makeToken("editor")}` },
    });
    const res = await ctx.post("/api/admin/orders/export", { data: {} });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/text\/csv/);
  });

  test("admin → POST /api/admin/orders/export → 200 CSV", async () => {
    const ctx = await pwRequest.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${makeToken("admin")}` },
    });
    const res = await ctx.post("/api/admin/orders/export", { data: {} });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/text\/csv/);
  });
});
