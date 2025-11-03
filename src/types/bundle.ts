// Bundle Builder Types and Constants

export const CURRENCY = "USD";

export const fmt = (n: number) => n.toLocaleString('en-US', {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

export const round2 = (n: number) => Math.round(n * 100) / 100;

// Tier configuration
export const CONFIG = {
  tiers: [{
    id: 1,
    minCourses: 1,
    percentOff: 0,
    scope: "entire_cart",
    giftCount: 0
  }, {
    id: 2,
    minCourses: 2,
    percentOff: 10,
    scope: "entire_cart",
    giftCount: 0
  }, {
    id: 3,
    minCourses: 3,
    percentOff: 20,
    scope: "entire_cart",
    giftCount: 1
  }]
} as const;

// TypeScript interfaces
export interface Product {
  readonly sku: string;
  readonly title: string;
  readonly link: string;
  readonly type: "course" | "group_coaching" | "assessment" | "addon" | "consultation" | "waitlist";
  readonly summary: string;
  readonly msrp: number;
  readonly imageUrl: string;
  readonly countsTowardThreshold: boolean;
  readonly giftEligible: boolean;
  readonly sortOrder: number;
}

export interface CartLine {
  readonly sku: string;
  readonly title: string;
  readonly msrp: number;
  readonly discount: number;
  readonly net: number;
  readonly type: Product['type'];
  readonly isGift: boolean;
  readonly isOTO?: boolean;
}

export interface Tier {
  readonly id: number;
  readonly minCourses: number;
  readonly percentOff: number;
  readonly scope: "courses_only" | "entire_cart";
  readonly giftCount: number;
}

export interface Totals {
  readonly subtotal: number;
  readonly discount: number;
  readonly couponDiscount?: number;
  readonly total: number;
}

// Utility functions
export const isCourse = (p: Product): boolean => p.type === "course" || p.type === "group_coaching" || p.type === "assessment" || p.type === "consultation";
export const isAddon = (p: Product): boolean => p.type === "addon";
export const bySort = (a: Product, b: Product): number => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);

// SEO structured data generator
export const generateStructuredData = (products: readonly Product[], totals: Totals) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Attachment Style Bundle",
  "description": "Complete relationship transformation bundle with courses, assessments, and guides",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": Math.min(...products.map(p => p.msrp)),
    "highPrice": Math.max(...products.map(p => p.msrp)),
    "offerCount": products.length
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1250"
  }
});