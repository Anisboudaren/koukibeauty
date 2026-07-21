import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  signAdminSession,
  verifyAdminSession,
} from "@/lib/auth/admin-session";
import {
  getEffectivePrice,
  hasPromo,
  DEFAULT_COURSE_LIST_PRICE,
} from "@/lib/types";
import { absoluteUrl, SITE_URL } from "@/lib/seo";
import { extractYouTubeId } from "@/lib/youtube";
import { paginate } from "@/lib/paginate";

describe("password hashing", () => {
  it("hashes deterministically and verifies", () => {
    const hash = hashPassword("KoukiBeauty#2026");
    expect(hash).toHaveLength(64);
    expect(verifyPassword("KoukiBeauty#2026", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("admin session cookie", () => {
  it("signs and verifies a user id", async () => {
    const token = await signAdminSession("user_kouki");
    expect(token).toContain("user_kouki.");
    await expect(verifyAdminSession(token)).resolves.toBe("user_kouki");
    await expect(verifyAdminSession("tampered.sig")).resolves.toBeNull();
    await expect(verifyAdminSession(null)).resolves.toBeNull();
  });
});

describe("course pricing", () => {
  it("uses promo when lower than price", () => {
    expect(
      getEffectivePrice({
        priceType: "paid",
        price: 4500,
        promoPrice: 3500,
      })
    ).toBe(3500);
    expect(
      hasPromo({ priceType: "paid", price: 4500, promoPrice: 3500 })
    ).toBe(true);
  });

  it("ignores invalid promo and free courses", () => {
    expect(
      getEffectivePrice({
        priceType: "paid",
        price: 4500,
        promoPrice: 5000,
      })
    ).toBe(4500);
    expect(
      getEffectivePrice({
        priceType: "free",
        price: 4500,
        promoPrice: 100,
      })
    ).toBe(0);
    expect(DEFAULT_COURSE_LIST_PRICE).toBe(4500);
  });
});

describe("seo helpers", () => {
  it("builds absolute urls", () => {
    expect(absoluteUrl("/courses")).toBe(`${SITE_URL}/courses`);
    expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x");
  });
});

describe("youtube id extract", () => {
  it("parses common url forms", () => {
    expect(extractYouTubeId("https://youtu.be/0FcRISWsaJ0")).toBe(
      "0FcRISWsaJ0"
    );
    expect(
      extractYouTubeId("https://www.youtube.com/watch?v=0FcRISWsaJ0")
    ).toBe("0FcRISWsaJ0");
    expect(extractYouTubeId("0FcRISWsaJ0")).toBe("0FcRISWsaJ0");
    expect(extractYouTubeId("")).toBeNull();
  });
});

describe("paginate", () => {
  it("slices pages correctly", () => {
    const items = [1, 2, 3, 4, 5];
    expect(paginate(items, 1, 2)).toEqual([1, 2]);
    expect(paginate(items, 2, 2)).toEqual([3, 4]);
    expect(paginate(items, 3, 2)).toEqual([5]);
  });
});
