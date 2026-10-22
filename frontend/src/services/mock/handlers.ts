import { http, HttpResponse, delay } from "msw";
import { mockMembers, mockProducts } from "./data";

/**
 * MSW request handlers. Paths are relative to the http client's baseURL (/api).
 * When the real backend is ready, delete this folder + the browser.ts import in
 * main.tsx and set VITE_API_MODE=live — no feature code changes.
 */
export const handlers = [
  http.get("/api/products", async () => {
    await delay(200); // simulate network so skeletons are visible in dev
    return HttpResponse.json(mockProducts);
  }),

  // Must be registered BEFORE /products/:id or it would be matched as id="featured".
  http.get("/api/products/featured", async () => {
    await delay(200);
    const featured = [...mockProducts]
      .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
      .slice(0, 4);
    return HttpResponse.json(featured);
  }),

  http.get("/api/products/:id", ({ params }) => {
    const product = mockProducts.find((p) => p.id === params.id);
    if (!product) {
      return HttpResponse.json({ message: "Product not found" }, { status: 404 });
    }
    return HttpResponse.json(product);
  }),

  http.get("/api/members", async () => {
    await delay(200);
    return HttpResponse.json(mockMembers);
  }),

  http.post("/api/contacts", async () => {
    await delay(400);
    return HttpResponse.json({ ok: true }, { status: 201 });
  }),
];
