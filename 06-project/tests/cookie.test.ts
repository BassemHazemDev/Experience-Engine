import { describe, expect, it } from "vitest";
import { DEFAULT_REQUEST } from "@/engine/definitions";
import { parseExperienceCookie, serializeExperienceCookie } from "@/engine/experience-cookie";

describe("experience cookie", () => {
  it("parses a registered experience", () => {
    expect(parseExperienceCookie("ar-EG.luxury.smooth")).toEqual({
      request: { culture: "ar-EG", theme: "luxury", motion: "smooth" },
      source: "cookie",
    });
  });

  it("round-trips through serialize", () => {
    const request = { culture: "en-US", theme: "midnight", motion: "reduced" } as const;
    expect(parseExperienceCookie(serializeExperienceCookie(request)).request).toEqual(request);
  });

  it("falls back when the cookie is missing", () => {
    expect(parseExperienceCookie(undefined)).toEqual({ request: DEFAULT_REQUEST, source: "missing" });
  });

  it.each([
    "fr-FR.light.instant",
    "ar-EG.neon.smooth",
    "ar-EG.luxury.bouncy",
    "ar-EG.luxury",
    "ar-EG.luxury.smooth.extra",
    "constructor.__proto__.toString",
    "prototype",
    "random",
    "<script>",
    "<script>alert(1)</script>",
    "AR-EG.LUXURY.SMOOTH",
  ])("falls back to the safe default for %s", (value) => {
    expect(parseExperienceCookie(value)).toEqual({ request: DEFAULT_REQUEST, source: "invalid" });
  });
});
