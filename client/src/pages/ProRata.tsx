import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import {
  Calculator,
  Percent,
  FileText,
  Copy,
  Check,
  Wallet,
  Layers,
  Receipt,
  Info,
  CalendarDays,
  ListPlus,
  Phone,
  MessageCircle,
  FileDown,
  Share2,
  Mail,
} from "lucide-react";

import Header from "@/components/Header";
import GlassCard from "@/components/GlassCard";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import { ProRataAssistant } from "@/components/ProRataAssistant";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { resolveApiUrl } from "@/lib/apiBase";
import {
  computeFromMonthly,
  buildScriptFromFullInvoice,
  type Lang,
  fmt3,
  formatDateForLang,
  type ProResult,
} from "@/lib/proRata";
import { translations } from "@/lib/i18n";
import type { ProductConfig, AddOnConfig } from "@shared/config";

const cleanScript = (s: string) =>
  s
    .replace(/\*\*/g, "")
    .replace(/\u200E/g, "")
    .replace(/\s+([،:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

const fadeIn = (i = 0) => ({
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, delay: i * 0.06 },
  },
});

function Stat({
  icon: Icon,
  label,
  value,
  formatter,
  testid,
  className = "",
}: {
  icon: any;
  label: string;
  value: number;
  formatter: (value: number) => string;
  testid?: string;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = React.useState(() => formatter(0));

  React.useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    motionValue.set(0);
    const controls = animate(motionValue, target, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(formatter(latest)),
    });
    return () => controls.stop();
  }, [value, formatter, motionValue]);

  return (
    <motion.div
      {...fadeIn()}
      className={`rounded-2xl border bg-white/70 dark:bg-neutral-900/40 p-5 ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-xs opacity-70">{label}</div>
      </div>
      <div data-testid={testid} className="text-2xl font-bold">
        {display}
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white/60 dark:bg-neutral-900/40 px-3 py-2 text-sm">
      <span className="opacity-70">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function ChatBubble({
  role,
  title,
  content,
  onCopy,
  copied,
  lang,
}: {
  role: "agent" | "customer";
  title: string;
  content: string;
  onCopy?: () => void;
  copied?: boolean;
  lang: Lang;
}) {
  if (!content || !content.trim()) {
    return null;
  }

  const paragraphs = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const isAgent = role === "agent";
  const alignment = isAgent ? "justify-end" : "justify-start";
  const bubbleClasses = isAgent
    ? "bg-gradient-to-br from-orange-500/90 via-orange-400/80 to-orange-500/90 text-white border-orange-300/60"
    : "bg-white/95 dark:bg-neutral-900/70 border-orange-100/60 dark:border-orange-900/40 text-foreground";

  return (
    <div className={`flex ${alignment}`}>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className={`relative max-w-2xl px-5 py-4 rounded-3xl shadow-lg border ${bubbleClasses}`}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {isAgent ? (
              <MessageCircle className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            <span>{title}</span>
          </div>
          {onCopy && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-full transition ${
                isAgent
                  ? "bg-white/15 hover:bg-white/25 text-white"
                  : "text-orange-500 hover:text-orange-600"
              }`}
              onClick={onCopy}
              aria-label={title}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
        </div>
        <div className="mt-3 space-y-2 text-sm leading-relaxed whitespace-pre-wrap">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TimelineBar({
  summary,
  lang,
}: {
  summary: ProResult | ComputedResult | null;
  lang: Lang;
}) {
  if (!summary) return null;

  const cycleDays = summary.cycleDays || 1;
  const proDays = summary.proDays || 0;
  const preDays = Math.max(0, cycleDays - proDays);
  const prePercent = Math.max(0, (preDays / cycleDays) * 100);
  const rawProPercent = Math.max(0, (proDays / cycleDays) * 100);
  const proPercent = rawProPercent === 0 ? 0 : Math.max(rawProPercent, 6);
  const adjustedProPercent = Math.min(100 - prePercent, proPercent);

  return (
    <div className="rounded-3xl border bg-white/70 dark:bg-neutral-900/40 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
        <CalendarDays className="h-4 w-4" />
        {lang === "ar" ? "الخط الزمني للفوترة" : "Billing timeline"}
      </div>
      <div className="mt-4">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-orange-100/60 dark:bg-orange-900/20">
          {prePercent > 0 && (
            <div
              className="absolute inset-y-0 left-0 bg-neutral-200/80 dark:bg-neutral-700/70"
              style={{ width: `${prePercent}%` }}
            />
          )}
          {adjustedProPercent > 0 && (
            <div
              className="absolute inset-y-0 bg-gradient-to-r from-orange-400 to-orange-500"
              style={{ left: `${prePercent}%`, width: `${adjustedProPercent}%` }}
            />
          )}
        </div>
        <div className="mt-3 grid grid-cols-3 text-xs text-muted-foreground font-medium">
          <div className="flex flex-col gap-1">
            <span>{lang === "ar" ? "بداية الدورة" : "Cycle start"}</span>
            <span className="font-semibold text-foreground">
              {formatDateForLang(summary.cycleStartUTC, lang)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span>{lang === "ar" ? "التفعيل" : "Activation"}</span>
            <span className="font-semibold text-foreground">
              {formatDateForLang(summary.periodStartUTC, lang)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span>{lang === "ar" ? "Anchor" : "Anchor"}</span>
            <span className="font-semibold text-foreground">
              {formatDateForLang(summary.periodEndUTC, lang)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  });
  if (current) {
    lines.push(current);
  }
  return lines.length ? lines : [text];
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

function createPdfFromJpeg(
  imageBytes: Uint8Array,
  pixelWidth: number,
  pixelHeight: number
): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [0];
  let offset = 0;

  const push = (data: string | Uint8Array) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    parts.push(bytes);
    offset += bytes.length;
  };

  const beginObject = (content: string) => {
    offsets.push(offset);
    push(content);
  };

  push("%PDF-1.4\n");

  beginObject("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  beginObject("2 0 obj<< /Type /Pages /Count 1 /Kids [3 0 R] >>endobj\n");
  beginObject(
    `3 0 obj<< /Type /Page /Parent 2 0 R /Resources << /XObject << /Im1 4 0 R >> /ProcSet [/PDF /ImageC] >> /MediaBox [0 0 ${A4_WIDTH.toFixed(
      2
    )} ${A4_HEIGHT.toFixed(2)}] /Contents 5 0 R >>endobj\n`
  );

  offsets.push(offset);
  push(
    `4 0 obj<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>stream\n`
  );
  push(imageBytes);
  push("\nendstream\nendobj\n");

  const content = `q\n${A4_WIDTH.toFixed(2)} 0 0 ${A4_HEIGHT.toFixed(2)} 0 0 cm\n/Im1 Do\nQ\n`;
  beginObject(
    `5 0 obj<< /Length ${content.length} >>stream\n${content}endstream\nendobj\n`
  );

  const xrefOffset = offset;
  let xref = `xref\n0 ${offsets.length}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  push(xref);
  push(trailer);

  return concatUint8Arrays(parts);
}

type PricingConfig = {
  products: ProductConfig[];
  addons: AddOnConfig[];
};

type ComputedResult = ProResult & {
  basePrice: number;
  addOnsTotal: number;
};

export default function ProRataPage() {
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();

  const lang: Lang = language === "ar" ? "ar" : "en";
  const [productId, setProductId] = React.useState<string | null>(null);
  const [anchor, setAnchor] = React.useState<number>(15);
  const [basePrice, setBasePrice] = React.useState<number>(0);
  const [activation, setActivation] = React.useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedAddOns, setSelectedAddOns] = React.useState<string[]>([]);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [callMode, setCallMode] = React.useState(false);
  const [out, setOut] = React.useState<ComputedResult | null>(null);
  const copyTimeout = React.useRef<number | null>(null);


  const configQuery = useQuery<PricingConfig>({
    queryKey: ["pro-rata-config"],
    queryFn: async () => {
      const res = await fetch(resolveApiUrl("/api/pro-rata/config"));
      if (!res.ok) throw new Error("Failed to load pro-rata config");
      return (await res.json()) as PricingConfig;
    },
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (!configQuery.error) return;
    toast({
      title: t("error"),
      description: t("tryAgain"),
      variant: "destructive",
    });
  }, [configQuery.error, t, toast]);

  const config = configQuery.data;
  const products = config?.products ?? [];
  const addons = config?.addons ?? [];

  React.useEffect(() => {
    if (!products.length || productId) return;
    const first = products[0];
    setProductId(first.id);
    setAnchor(first.anchorDay);
    setBasePrice(first.defaultBasePrice);
  }, [products, productId]);

  const selectedProduct = React.useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  const selectedAddonDetails = React.useMemo(
    () => addons.filter((addon) => selectedAddOns.includes(addon.id)),
    [addons, selectedAddOns]
  );

  const addOnsTotal = React.useMemo(
    () => selectedAddonDetails.reduce((sum, addon) => sum + addon.price, 0),
    [selectedAddonDetails]
  );

  const monthlyNet = basePrice + addOnsTotal;

  const preview = React.useMemo(() => {
    try {
      return computeFromMonthly(monthlyNet, activation, anchor);
    } catch {
      return null;
    }
  }, [monthlyNet, activation, anchor]);

  React.useEffect(() => {
    setOut(null);
    setCopiedKey(null);
    if (copyTimeout.current) {
      window.clearTimeout(copyTimeout.current);
      copyTimeout.current = null;
    }
    setCallMode(false);
  }, [productId, activation, anchor, basePrice, selectedAddOns]);

  const handleProductChange = (id: string) => {
    if (!config) return;
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setProductId(id);
    setAnchor(product.anchorDay);
    setBasePrice(product.defaultBasePrice);
  };

  const handleToggleAddon = (id: string, checked: boolean) => {
    setSelectedAddOns((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const handleSetAddOns = (ids: string[]) => {
    setSelectedAddOns(ids);
  };

  const onCalc = React.useCallback(() => {
    if (!selectedProduct) {
      toast({
        title: t("error"),
        description: t("proRataProductLabel"),
        variant: "destructive",
      });
      return;
    }

    if (!activation) {
      toast({
        title: t("error"),
        description: t("proRataActivationLabel"),
        variant: "destructive",
      });
      return;
    }

    const timestamp = new Date(`${activation}T00:00:00Z`).getTime();
    if (Number.isNaN(timestamp)) {
      toast({
        title: t("error"),
        description: t("proRataActivationLabel"),
        variant: "destructive",
      });
      return;
    }

    if (basePrice < 0) {
      toast({
        title: t("error"),
        description: t("proRataBasePriceLabel"),
        variant: "destructive",
      });
      return;
    }

    if (!preview) {
      toast({
        title: t("error"),
        description: t("tryAgain"),
        variant: "destructive",
      });
      return;
    }

    setOut({ ...preview, basePrice, addOnsTotal });
    setCopiedKey(null);
  }, [selectedProduct, activation, basePrice, preview, addOnsTotal, t, toast]);

  const handleCopy = React.useCallback(
    async (text: string, key: string) => {
      if (!text) return;
      const sanitized = cleanScript(text);
      await navigator.clipboard.writeText(sanitized);
      setCopiedKey(key);
      toast({
        title: lang === "ar" ? "تم النسخ" : "Copied",
        description:
          lang === "ar"
            ? "تم نسخ المحتوى إلى الحافظة."
            : "The content has been copied to the clipboard.",
      });
      if (copyTimeout.current) {
        window.clearTimeout(copyTimeout.current);
      }
      copyTimeout.current = window.setTimeout(() => {
        setCopiedKey(null);
        copyTimeout.current = null;
      }, 1800);
    },
    [lang, toast]
  );

  React.useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        window.clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const handleCopy = React.useCallback(
    async (text: string, key: string) => {
      if (!text) return;
      const sanitized = cleanScript(text);
      await navigator.clipboard.writeText(sanitized);
      setCopiedKey(key);
      toast({
        title: lang === "ar" ? "تم النسخ" : "Copied",
        description:
          lang === "ar"
            ? "تم نسخ المحتوى إلى الحافظة."
            : "The content has been copied to the clipboard.",
      });
      if (copyTimeout.current) {
        window.clearTimeout(copyTimeout.current);
      }
      copyTimeout.current = window.setTimeout(() => {
        setCopiedKey(null);
        copyTimeout.current = null;
      }, 1800);
    },
    [lang, toast]
  );

  React.useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        window.clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const summary = out ?? preview;
  const addOnsLabel = selectedAddonDetails.length
    ? selectedAddonDetails.map((addon) => addon.label[lang]).join(", ")
    : t("proRataAddOnsPlaceholder");

  const scriptBundle = React.useMemo(() => {
    if (!out) return null;
    const addOnInfo = selectedAddonDetails.map((addon) => ({
      label: addon.label[lang],
      price: addon.price,
    }));
    return buildScriptFromFullInvoice(out, lang, {
      product: selectedProduct?.label[lang] ?? "",
      anchorDay: anchor,
      addOns: addOnInfo,
    });
  }, [out, selectedAddonDetails, lang, selectedProduct, anchor]);

  const sanitizedScripts = React.useMemo(() => {
    if (!scriptBundle) {
      return {
        detailed: "",
        note: "",
        call: "",
        combined: "",
      };
    }
    return {
      detailed: cleanScript(
        [scriptBundle.main, ...scriptBundle.addOnLines].join("\n\n")
      ),
      note: cleanScript(scriptBundle.allInclusiveNote),
      call: cleanScript(scriptBundle.callMode),
      combined: cleanScript(scriptBundle.combined),
    };
  }, [scriptBundle]);

  const currencyFormatter = React.useMemo(
    () =>
      (value: number) =>
        lang === "ar"
          ? `${fmt3(value)} JD`
          : `JD ${fmt3(value)}`,
    [lang]
  );

  const percentFormatter = React.useCallback(
    (value: number) => `${value.toFixed(2)}%`,
    []
  );

  const handleExportPdf = React.useCallback(async () => {
    if (!summary || !out) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pdfStrings = translations[lang].pdf;
    const quoteNumber = `OR-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    const bundle = buildScriptFromFullInvoice(out, lang, {
      product: selectedProduct?.label[lang] ?? "",
      anchorDay: anchor,
      addOns: selectedAddonDetails.map((addon) => ({
        label: addon.label[lang],
        price: addon.price,
      })),
    });

    const scriptDetailed = cleanScript(
      [bundle.main, ...bundle.addOnLines].join("\n\n")
    );
    const callModeText = cleanScript(bundle.callMode);
    const noteLine = cleanScript(bundle.allInclusiveNote);

    const addOnLines = selectedAddonDetails.length === 0
      ? [pdfStrings.addOnsEmpty]
      : selectedAddonDetails.map(
          (addon) =>
            `• ${addon.label[lang]} — JD ${fmt3(addon.price)} (${addon.explain[lang]})`
        );

    const summaryLines = [
      `${pdfStrings.summary.product}: ${selectedProduct?.label[lang] ?? "—"}`,
      `${pdfStrings.summary.activation}: ${formatDateForLang(
        summary.activationUTC,
        lang
      )}`,
      `${pdfStrings.summary.anchor}: ${anchor}`,
      `${pdfStrings.summary.period}: ${formatDateForLang(
        summary.cycleStartUTC,
        lang
      )} ${lang === "ar" ? "←" : "→"} ${formatDateForLang(
        summary.periodEndUTC,
        lang
      )}`,
      `${pdfStrings.summary.ratio}: ${(summary.ratio * 100).toFixed(2)}%`,
      `${pdfStrings.summary.addOns}: ${bundle.addOnsList}`,
    ];

    const amountLines: CardLine[] = [
      { text: `${pdfStrings.amounts.monthly}: ${currencyFormatter(summary.monthlyNet)}` },
      { text: `${pdfStrings.amounts.proRata}: ${currencyFormatter(summary.proAmountNet)}` },
      {
        text: `${pdfStrings.amounts.firstInvoice}: ${currencyFormatter(summary.invoiceNet)}`,
        badge: pdfStrings.amounts.badge,
      },
    ];

    const scriptLines = [
      { text: scriptDetailed },
      { text: `${pdfStrings.script.callMode}: ${callModeText}` },
    ];

    const noteLines = [{ text: noteLine }];

    ctx.save();
    ctx.fillStyle = "#fefbf6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "#ff8a1a");
    gradient.addColorStop(1, "#ff6a00");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 220);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px 'Segoe UI', 'Cairo', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Orange", 80, 60);

    ctx.font = "24px 'Segoe UI', sans-serif";
    ctx.fillText(pdfStrings.headerTitle, 80, 130);

    ctx.textAlign = "right";
    ctx.font = "18px 'Segoe UI', sans-serif";
    ctx.fillText(
      `${pdfStrings.createdLabel}: ${formatDateForLang(now, lang)}`,
      canvas.width - 80,
      80
    );
    ctx.fillText(
      `${pdfStrings.quoteLabel}: ${quoteNumber}`,
      canvas.width - 80,
      110
    );

    ctx.restore();

    type CardLine = { text: string; badge?: string };

    const column = {
      x: 80,
      width: canvas.width - 160,
      y: 260,
      align: (lang === "ar" ? "right" : "left") as CanvasTextAlign,
      direction: (lang === "ar" ? "rtl" : "ltr") as CanvasDirection,
    };

    const drawCard = (title: string, lines: CardLine[]) => {
      if (!lines.length) return;
      ctx.save();
      ctx.textBaseline = "top";
      ctx.direction = column.direction;
      ctx.textAlign = column.align;

      const paddingX = 32;
      const paddingY = 36;
      const lineHeight = 28;
      const innerWidth = column.width - paddingX * 2;
      const textX =
        column.align === "left"
          ? column.x + paddingX
          : column.x + column.width - paddingX;

      const lineData = lines.map((entry) => ({
        ...entry,
        parts: wrapText(ctx, entry.text, innerWidth),
      }));

      const contentHeight = lineData.reduce((acc, entry, index) => {
        const blockHeight = entry.parts.length * lineHeight;
        const spacing = index < lineData.length - 1 ? lineHeight * 0.5 : 0;
        return acc + blockHeight + spacing;
      }, 0);

      const cardHeight = paddingY * 2 + 24 + contentHeight;

      drawRoundedRect(ctx, column.x, column.y, column.width, cardHeight, 26);
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,130,20,0.18)";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = "#ff7f11";
      ctx.font = "bold 22px 'Segoe UI', 'Cairo', sans-serif";
      ctx.fillText(title, textX, column.y + paddingY - 8);

      ctx.fillStyle = "#2b2b2b";
      ctx.font = "16px 'Segoe UI', 'Cairo', sans-serif";
      let textY = column.y + paddingY + 28;

      lineData.forEach((entry, index) => {
        const blockHeight = entry.parts.length * lineHeight;
        if (entry.badge) {
          ctx.save();
          const highlightX =
            column.align === "left"
              ? column.x + paddingX
              : column.x + column.width - paddingX - innerWidth;
          const highlightY = textY - 14;
          const highlightHeight = blockHeight + 28;
          drawRoundedRect(
            ctx,
            highlightX,
            highlightY,
            innerWidth,
            highlightHeight,
            18
          );
          ctx.fillStyle = "rgba(255,158,66,0.15)";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,158,66,0.35)";
          ctx.lineWidth = 1;
          ctx.stroke();

          const badgeText = entry.badge;
          const badgePaddingX = 16;
          const badgeHeight = 26;
          ctx.font = "12px 'Segoe UI', 'Cairo', sans-serif";
          const badgeWidth =
            ctx.measureText(badgeText).width + badgePaddingX * 2;
          const badgeX =
            column.align === "left"
              ? highlightX + innerWidth - badgeWidth - 14
              : highlightX + 14;
          const badgeY = highlightY + 10;
          drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 10);
          ctx.fillStyle = "#ff7f11";
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            badgeText,
            badgeX + badgeWidth / 2,
            badgeY + badgeHeight / 2
          );
          ctx.restore();
          ctx.textBaseline = "top";
          ctx.direction = column.direction;
          ctx.textAlign = column.align;
          ctx.font = "16px 'Segoe UI', 'Cairo', sans-serif";
          ctx.fillStyle = "#2b2b2b";
        }

        entry.parts.forEach((part) => {
          ctx.fillText(part, textX, textY);
          textY += lineHeight;
        });
        if (index < lineData.length - 1) {
          textY += lineHeight * 0.5;
        }
      });

      ctx.restore();
      column.y = column.y + cardHeight + 28;
    };

    drawCard(pdfStrings.sections.summary, summaryLines.map((text) => ({ text })));
    drawCard(pdfStrings.sections.amounts, amountLines);
    drawCard(pdfStrings.sections.addOns, addOnLines.map((text) => ({ text })));
    drawCard(pdfStrings.sections.script, scriptLines);
    drawCard(pdfStrings.sections.notes, noteLines);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64 = dataUrl.split(",")[1];
    const imageBytes = base64ToUint8(base64);
    const pdfBytes = createPdfFromJpeg(imageBytes, canvas.width, canvas.height);

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orange-first-invoice-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [
    summary,
    out,
    selectedProduct,
    selectedAddonDetails,
    anchor,
    lang,
    currencyFormatter,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/10">
      <Header />

      <div className="container mx-auto px-6 pt-28 pb-16 max-w-6xl">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 mb-5 shadow-xl">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            {t("proRataTitle")}
          </h1>
          <p className="text-muted-foreground mt-2">{t("proRataHeroDescription")}</p>
        </motion.div>

        <motion.div {...fadeIn()} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="opacity-70">{t("proRataProductLabel")}</span>
                    <select
                      value={productId ?? ""}
                      onChange={(e) => handleProductChange(e.target.value)}
                      disabled={!products.length}
                      className="rounded-2xl border-2 px-4 py-3 bg-background focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    >
                      {!productId && <option value="">{t("loading")}</option>}
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.label[lang]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="opacity-70">{t("proRataBillAnchorLabel")}</span>
                    <input
                      value={anchor}
                      readOnly
                      className="rounded-2xl border-2 px-4 py-3 bg-muted text-muted-foreground"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="opacity-70">{t("proRataActivationLabel")}</span>
                    <input
                      type="date"
                      value={activation}
                      onChange={(e) => setActivation(e.target.value)}
                      className="rounded-2xl border-2 px-4 py-3 bg-background focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm">
                    <span className="opacity-70">{t("proRataBasePriceLabel")}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className="rounded-2xl border-2 px-4 py-3 bg-background focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                    />
                  </label>

                  <div className="flex flex-col gap-2 text-sm md:col-span-2">
                    <span className="opacity-70">{t("proRataAddOnsLabel")}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-between rounded-2xl border-2 px-4 py-3 h-auto"
                        >
                          <span className="text-left truncate max-w-[260px]">
                            {addOnsLabel || t("proRataAddOnsPlaceholder")}
                          </span>
                          <ListPlus className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-72">
                        {addons.map((addon) => (
                          <DropdownMenuCheckboxItem
                            key={addon.id}
                            checked={selectedAddOns.includes(addon.id)}
                            onCheckedChange={(checked) =>
                              handleToggleAddon(addon.id, Boolean(checked))
                            }
                          >
                            <div className="flex flex-col gap-0.5 w-full">
                              <span>{addon.label[lang]}</span>
                              <span className="text-xs text-muted-foreground">
                                JD {fmt3(addon.price)} · {addon.explain[lang]}
                              </span>
                            </div>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AnimatePresence>
                      {selectedAddonDetails.map((addon) => (
                        <motion.div
                          key={addon.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="inline-flex"
                        >
                          <div className="px-3 py-1.5 rounded-full bg-orange-100/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200 shadow-sm text-sm font-medium flex items-center gap-1">
                            <span>{addon.label[lang]}</span>
                            <span className="text-xs">· JD {fmt3(addon.price)}</span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {selectedProduct?.description && (
                  <div className="text-xs text-muted-foreground bg-white/60 dark:bg-neutral-900/40 rounded-2xl px-4 py-3 border">
                    {selectedProduct.description[lang]}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={onCalc}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-medium shadow hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    {t("proRataCalculateAction")}
                  </Button>

                  <Button
                    onClick={() => handleCopy(sanitizedScripts.combined, "script-main")}
                    disabled={!scriptBundle}
                    variant="outline"
                    className="px-6 py-3 rounded-2xl border-2 border-orange-300/70 bg-white/70 dark:bg-neutral-900/40 hover:bg-white text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {copiedKey === "script-main" ? (
                      <>
                        <Check className="w-5 h-5" />
                        {lang === "ar" ? "تم النسخ" : "Copied"}
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        {t("labels.copyScript")}
                      </>
                    )}
                  </Button>
                </div>

                {products.length > 0 && (
                  <ProRataAssistant
                    products={products}
                    addons={addons}
                    productId={productId}
                    onProductChange={handleProductChange}
                    activationDate={activation}
                    onActivationChange={setActivation}
                    selectedAddOns={selectedAddOns}
                    onSetAddOns={handleSetAddOns}
                    onConfirm={onCalc}
                    breakdown={out}
                    anchorDay={anchor}
                  />
                )}

                <AnimatePresence mode="popLayout">
                  {scriptBundle && (
                    <motion.div
                      key="script"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/70 dark:bg-neutral-900/40 border px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                          <FileText className="h-4 w-4" />
                          {lang === "ar" ? "السكربت الجاهز" : "Customer-ready script"}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-2 text-xs font-medium text-orange-600 dark:border-orange-900/40 dark:bg-orange-900/20 dark:text-orange-200">
                            <Phone className="h-4 w-4" />
                            <span>{t("labels.callModeToggle")}</span>
                            <Switch
                              checked={callMode}
                              onCheckedChange={(checked) => setCallMode(Boolean(checked))}
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={handleExportPdf}
                            className="flex items-center gap-2 rounded-2xl border-orange-200 px-4 py-2 text-sm"
                          >
                            <FileDown className="h-4 w-4" />
                            {t("labels.exportPDF")}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {callMode && (
                          <ChatBubble
                            role="agent"
                            title={
                              lang === "ar"
                                ? "الموظف · وضع المكالمات"
                                : "Agent · Call Mode"
                            }
                            content={sanitizedScripts.call}
                            onCopy={() => handleCopy(sanitizedScripts.call, "call-mode")}
                            copied={copiedKey === "call-mode"}
                            lang={lang}
                          />
                        )}
                        <ChatBubble
                          role="agent"
                          title={lang === "ar" ? "الموظف" : "Agent"}
                          content={sanitizedScripts.detailed}
                          onCopy={() =>
                            handleCopy(sanitizedScripts.combined, "agent-detailed")
                          }
                          copied={copiedKey === "agent-detailed"}
                          lang={lang}
                        />
                        <ChatBubble
                          role="customer"
                          title={lang === "ar" ? "العميل" : "Customer"}
                          content={sanitizedScripts.note}
                          onCopy={() => handleCopy(sanitizedScripts.note, "customer-note")}
                          copied={copiedKey === "customer-note"}
                          lang={lang}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          className="rounded-2xl border-orange-200 px-4 py-2 text-sm flex items-center gap-2"
                          onClick={() => handleCopy(sanitizedScripts.combined, "copy-script")}
                        >
                          <Copy className="h-4 w-4" />
                          {copiedKey === "copy-script"
                            ? lang === "ar"
                              ? "تم النسخ"
                              : "Copied"
                            : t("labels.copyScript")}
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl border-orange-200 px-4 py-2 text-sm flex items-center gap-2"
                          onClick={() => handleCopy(sanitizedScripts.combined, "copy-whatsapp")}
                        >
                          <Share2 className="h-4 w-4" />
                          {copiedKey === "copy-whatsapp"
                            ? lang === "ar"
                              ? "تم النسخ"
                              : "Copied"
                            : t("labels.copyWhatsApp")}
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-2xl border-orange-200 px-4 py-2 text-sm flex items-center gap-2"
                          onClick={() =>
                            handleCopy(sanitizedScripts.combined, "copy-email")
                          }
                        >
                          <Mail className="h-4 w-4" />
                          {copiedKey === "copy-email"
                            ? lang === "ar"
                              ? "تم النسخ"
                              : "Copied"
                            : t("labels.copyEmail")}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border bg-white/60 dark:bg-neutral-900/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-300">
                    <Info className="h-4 w-4" />
                    {t("proRataBillCycleInfo")}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {t("proRataBillAnchorLabel")}: {anchor}
                  </div>
                </div>

                <div className="grid gap-3">
                  <InfoRow
                    label={t("proRataActivationLabel")}
                    value={activation ? formatDateForLang(new Date(`${activation}T00:00:00Z`), lang) : "—"}
                  />
                  <InfoRow
                    label={t("proRataBillCycleStart")}
                    value={summary ? formatDateForLang(summary.cycleStartUTC, lang) : "—"}
                  />
                  <InfoRow
                    label={t("proRataBillCycleEnd")}
                    value={summary ? formatDateForLang(summary.periodEndUTC, lang) : "—"}
                  />
                  <InfoRow
                    label={t("proRataBillCycleNext")}
                    value={summary ? formatDateForLang(summary.nextPeriodEndUTC, lang) : "—"}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoRow
                    label={t("proRataCycleDays")}
                    value={summary ? summary.cycleDays : "—"}
                  />
                  <InfoRow
                    label={t("proRataProDays")}
                    value={summary ? summary.proDays : "—"}
                  />
                  <InfoRow
                    label={t("proRataBase")}
                    value={`JD ${fmt3(basePrice)}`}
                  />
                  <InfoRow
                    label={t("proRataAddOnsTotal")}
                    value={`JD ${fmt3(addOnsTotal)}`}
                  />
                </div>

                <TimelineBar summary={summary} lang={lang} />

                <div className="grid gap-4 md:grid-cols-2">
                  <Stat
                    icon={Percent}
                    label={t("proRataRatio")}
                    value={(summary?.ratio ?? 0) * 100}
                    formatter={percentFormatter}
                    testid="ratio"
                  />
                  <Stat
                    icon={Wallet}
                    label={t("proRataMonthlyNet")}
                    value={summary?.monthlyNet ?? monthlyNet}
                    formatter={currencyFormatter}
                    testid="monthly"
                  />
                  <Stat
                    icon={Calculator}
                    label={t("proRataProAmount")}
                    value={summary?.proAmountNet ?? 0}
                    formatter={currencyFormatter}
                    testid="proration"
                  />
                  <Stat
                    icon={Receipt}
                    label={t("proRataInvoice")}
                    value={summary?.invoiceNet ?? monthlyNet}
                    formatter={currencyFormatter}
                  />
                </div>

                <div className="rounded-3xl border bg-white/60 dark:bg-neutral-900/40 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Layers className="h-4 w-4 text-orange-500" />
                    {t("proRataAddOnNotes")}
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    {selectedAddonDetails.length === 0 && (
                      <div className="text-muted-foreground">{t("proRataNoAddOns")}</div>
                    )}
                    {selectedAddonDetails.map((addon) => (
                      <div key={addon.id} className="rounded-2xl bg-white/70 dark:bg-neutral-900/50 border px-3 py-2">
                        <div className="font-medium text-sm">{addon.label[lang]}</div>
                        <div className="text-xs text-muted-foreground">
                          JD {fmt3(addon.price)} · {addon.explain[lang]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
