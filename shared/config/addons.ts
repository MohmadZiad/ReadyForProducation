import type { AddOnConfig } from "./types";

export const addons: AddOnConfig[] = [
  {
    id: "anghami",
    label: { en: "Anghami", ar: "أنغامي" },
    price: 2,
    explain: {
      en: "Music streaming add-on applied monthly.",
      ar: "إضافة بث موسيقي تُطبق شهرياً.",
    },
  },
  {
    id: "tod-mobile",
    label: { en: "TOD Mobile", ar: "TOD موبايل" },
    price: 6,
    explain: {
      en: "Mobile-only TOD subscription (up to 6 JD).",
      ar: "اشتراك TOD على الأجهزة المحمولة (حتى 6 دنانير).",
    },
  },
  {
    id: "tod-view",
    label: { en: "TOD View", ar: "TOD View" },
    price: 10,
    explain: {
      en: "Streaming-only TOD View package.",
      ar: "باقة TOD View للبث فقط.",
    },
  },
  {
    id: "tod-1k",
    label: { en: "TOD 1K", ar: "TOD 1K" },
    price: 12,
    explain: {
      en: "TOD 1K entertainment bundle.",
      ar: "باقة TOD 1K الترفيهية.",
    },
  },
  {
    id: "tod-4k",
    label: { en: "TOD 4K", ar: "TOD 4K" },
    price: 16,
    explain: {
      en: "TOD 4K premium experience add-on.",
      ar: "إضافة TOD 4K المميزة.",
    },
  },
];
