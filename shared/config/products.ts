import type { ProductConfig } from "./types";

export const products: ProductConfig[] = [
  {
    id: "iew",
    label: { en: "Internet Everywhere", ar: "إنترنت في كل مكان" },
    anchorDay: 15,
    defaultBasePrice: 29,
    description: {
      en: "Mobile broadband with a mid-month billing anchor.",
      ar: "خدمة إنترنت متنقلة بدورة فوترة في منتصف الشهر.",
    },
  },
  {
    id: "mobile-postpaid",
    label: { en: "Mobile Postpaid", ar: "موبايل فوترة" },
    anchorDay: 15,
    defaultBasePrice: 18,
    description: {
      en: "Standard postpaid mobile plan aligned to day 15.",
      ar: "باقة موبايل مفوترة بمرتكز فوترة على اليوم 15.",
    },
  },
  {
    id: "ftth",
    label: { en: "FTTH", ar: "ألياف ضوئية" },
    anchorDay: 1,
    defaultBasePrice: 35,
    description: {
      en: "Fiber to the home with a first-of-month anchor.",
      ar: "خدمة ألياف منزلية بمرتكز فوترة في اليوم الأول من الشهر.",
    },
  },
  {
    id: "adsl",
    label: { en: "ADSL", ar: "خدمة ADSL" },
    anchorDay: 1,
    defaultBasePrice: 22,
    description: {
      en: "Legacy broadband aligned with first-of-month billing.",
      ar: "إنترنت تقليدي مع فوترة تبدأ في بداية الشهر.",
    },
  },
];
