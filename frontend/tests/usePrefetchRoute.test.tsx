import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePrefetchRoute } from "@/app/usePrefetchRoute";
import { routeLoaders } from "@/app/routes";

describe("usePrefetchRoute (hook layer)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mouse/focus handlers for a registered route", () => {
    const { result } = renderHook(() => usePrefetchRoute("/products"));
    expect(result.current.handlers.onMouseEnter).toBeTypeOf("function");
    expect(result.current.handlers.onFocus).toBeTypeOf("function");
  });

  it("invokes the route's dynamic import when hovered", async () => {
    const spy = vi.fn(routeLoaders["/products"]!);
    routeLoaders["/products"] = spy;

    const { result } = renderHook(() => usePrefetchRoute("/products"));
    result.current.handlers.onMouseEnter({} as never);

    expect(spy).toHaveBeenCalledTimes(1);

    routeLoaders["/products"] = () => import("@/pages/Products");
  });

  it("does not throw for hover on an unregistered path", () => {
    const { result } = renderHook(() => usePrefetchRoute("/not-registered"));
    expect(() =>
      result.current.handlers.onMouseEnter({} as never),
    ).not.toThrow();
  });
});
