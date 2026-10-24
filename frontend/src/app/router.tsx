import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import { RouteError } from "@/shared/ui/RouteError";
import { routeLoaders, getRouteLoader } from "./routes";

/**
 * Route table with React.lazy-style code splitting via RR7's `lazy`.
 * Each page is its own chunk; Layout is the shared shell chunk.
 * The same loaders are reused by usePrefetchRoute for hover/focus prefetching.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        lazy: async () => {
          const mod = await getRouteLoader("/")();
          return { Component: (mod as { default: React.ComponentType }).default };
        },
      },
      {
        path: "about",
        lazy: async () => {
          const mod = await getRouteLoader("/about")();
          return { Component: (mod as { default: React.ComponentType }).default };
        },
      },
      {
        path: "products",
        lazy: async () => {
          const mod = await getRouteLoader("/products")();
          return { Component: (mod as { default: React.ComponentType }).default };
        },
      },
      {
        path: "contact",
        lazy: async () => {
          const mod = await getRouteLoader("/contact")();
          return { Component: (mod as { default: React.ComponentType }).default };
        },
      },
      {
        path: "*",
        lazy: async () => {
          const mod = await import("@/shared/ui/NotFound");
          return { Component: mod.default };
        },
      },
    ],
  },
  /*
  {
    path: "/login-admin",
    lazy: async () => {
      const mod = await getRouteLoader("/login-admin")();
      return { Component: (mod as { default: React.ComponentType }).default };
    },
    errorElement: <RouteError />,
  },
  {
    element: <RequireAdmin />,
    errorElement: <RouteError />,
    children: [
      {
        path: "/admin",
        lazy: async () => {
          const mod = await getRouteLoader("/admin")();
          return { Component: (mod as { default: React.ComponentType }).default };
        },
      },
    ],
  },
  */
]);

export { routeLoaders };
