import { describe, it, expect } from "vitest";
import { translate } from "@/i18n";

describe("translate (util layer)", () => {
  it("returns the English string for a valid key", () => {
    expect(translate("nav.home", "en")).toBe("Home");
  });

  it("returns the Nepali string for the same key", () => {
    expect(translate("nav.home", "ne")).toBe("गृहपृष्ठ");
  });

  it("falls back to the key string for an unknown path", () => {
    // Cast bypasses the compile-time key check to test runtime behavior.
    expect(translate("does.not.exist" as never, "en")).toBe("does.not.exist");
  });
});
