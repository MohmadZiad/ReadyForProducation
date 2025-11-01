// client/src/lib/calc.ts
export const VOICE_RATE = 0.4616;

// عرض رقم بخانتين
export const fmt2 = (n: number) =>
  Number.isFinite(n) ? Number(n).toFixed(2) : "0.00";

// عرض حسب اللغة (en = أرقام لاتينية، ar = محلية)
export function fmt2Locale(n: number, lang: "ar" | "en") {
  if (!Number.isFinite(n)) return lang === "ar" ? "٠٫٠٠" : "0.00";
  return lang === "ar"
    ? n.toLocaleString("ar-JO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

function computeLine(baseA: number, multiplier: number, addon = 0) {
  const net = Number.isFinite(baseA) ? baseA : 0;
  const gross = net * multiplier;
  const vat = gross - net;
  const afterAddon = gross + (Number.isFinite(addon) ? addon : 0);
  return { net, vat, gross, afterAddon };
}

export function buildAllLines(baseA: number, vat = 0.16, addon = 0) {
  const mData = 1 + vat;
  const mVoice = 1 + VOICE_RATE;
  const mNos = (mVoice + mData) / 2;
  const mBase = mData;

  return {
    A: computeLine(baseA, mBase, addon),
    Nos: computeLine(baseA, mNos, addon),
    Voice: computeLine(baseA, mVoice, addon),
    Data: computeLine(baseA, mData, addon),
  };
}

export function lineToClipboardText(args: {
  title: string;
  net: number;
  vat: number;
  gross: number;
  afterAddon: number;
}) {
  const { title, net, vat, gross, afterAddon } = args;
  return `${title}
الصافي: JD ${fmt2(net)}
الضريبة (ضمن السعر): JD ${fmt2(vat)}
الإجمالي: JD ${fmt2(gross)}
بعد الإضافة: JD ${fmt2(afterAddon)}`;
}
