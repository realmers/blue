/**
 * Enhetstester för cn()-verktygsfunktionen.
 *
 * Täcker:
 * - Sammanslagning av enstaka klasser.
 * - Sammanslagning av flera klasser.
 * - Hantering av villkorliga klasser (falsy-värden).
 * - Konflikthantering via tailwind-merge.
 * - Tomt anrop.
 *
 */

import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn()", () => {
  it("borde returnera en enstaka klass", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("borde slå ihop flera klasser", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("borde filtrera bort falsy-värden", () => {
    expect(cn("text-red-500", false, null, undefined, "", "bg-blue-500")).toBe(
      "text-red-500 bg-blue-500",
    );
  });

  it("borde hantera villkorliga klasser", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active",
    );
  });

  it("borde lösa Tailwind-klasskonflikter (sista vinner)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("borde lösa padding-konflikter", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("borde hantera objekt-syntax via clsx", () => {
    expect(cn({ "text-red-500": true, "bg-blue-500": false })).toBe(
      "text-red-500",
    );
  });

  it("borde hantera array-syntax", () => {
    expect(cn(["text-red-500", "bg-blue-500"])).toBe(
      "text-red-500 bg-blue-500",
    );
  });

  it("borde returnera tom sträng utan argument", () => {
    expect(cn()).toBe("");
  });

  it("borde behålla icke-konflikterande klasser", () => {
    expect(cn("text-red-500", "bg-blue-500", "font-bold", "p-4")).toBe(
      "text-red-500 bg-blue-500 font-bold p-4",
    );
  });
});
