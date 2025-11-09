import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { resolveApiUrl } from "@/lib/apiBase";
import {
  computeFromMonthly,
  buildScriptFromFullInvoice,
  type Lang,
  fmt3,
  formatDateForLang,
  type ProResult,
} from "@/lib/proRata";
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
  testid,
  className = "",
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  testid?: string;
  className?: string;
}) {
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
        {value}
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

type PricingConfig = {
  products: ProductConfig[];
  addons: AddOnConfig[];
};

type ComputedResult = ProResult & {
  basePrice: number;
  addOnsTotal: number;
};

export default function ProRataPage() {
  const { language, t } = useLanguage();
  const { toast } = useToast();

  const [lang, setLang] = React.useState<Lang>((language as Lang) ?? "ar");
  const [productId, setProductId] = React.useState<string | null>(null);
  const [anchor, setAnchor] = React.useState<number>(15);
  const [basePrice, setBasePrice] = React.useState<number>(0);
  const [activation, setActivation] = React.useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [selectedAddOns, setSelectedAddOns] = React.useState<string[]>([]);
  const [copied, setCopied] = React.useState(false);
  const [out, setOut] = React.useState<ComputedResult | null>(null);

  React.useEffect(() => setLang((language as Lang) ?? "ar"), [language]);

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
    setCopied(false);
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
    setCopied(false);
  }, [selectedProduct, activation, basePrice, preview, addOnsTotal, t, toast]);

  const onCopy = async () => {
    if (!out) return;
    const raw = buildScriptFromFullInvoice(out, lang);
    const s = cleanScript(raw);
    await navigator.clipboard.writeText(s);
    setCopied(true);
    toast({
      title: lang === "ar" ? "تم النسخ" : "Copied",
      description:
        lang === "ar"
          ? "النص الجاهز تم نسخه إلى الحافظة."
          : "The ready script has been copied.",
    });
    setTimeout(() => setCopied(false), 1800);
  };

  const summary = out ?? preview;
  const addOnsLabel = selectedAddonDetails.length
    ? selectedAddonDetails.map((addon) => addon.label[lang]).join(", ")
    : t("proRataAddOnsPlaceholder");

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
                    {selectedAddonDetails.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedAddonDetails.map((addon) => (
                          <Badge
                            key={addon.id}
                            variant="secondary"
                            className="rounded-xl bg-orange-100/80 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200"
                          >
                            {addon.label[lang]} · JD {fmt3(addon.price)}
                          </Badge>
                        ))}
                      </div>
                    )}
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
                    onClick={onCopy}
                    disabled={!out}
                    variant="outline"
                    className="px-6 py-3 rounded-2xl border-2 border-orange-300/70 bg-white/70 dark:bg-neutral-900/40 hover:bg-white text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        {t("proRataCopied")}
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        {t("proRataCopyScript")}
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
                  {out && (
                    <motion.div
                      key="script"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2"
                    >
                      <div className="text-sm opacity-70 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {lang === "ar" ? "النص الجاهز" : "Ready-to-send script"}
                      </div>
                      <div className="relative">
                        <pre className="whitespace-pre-wrap text-sm bg-white/80 dark:bg-neutral-900/40 p-4 rounded-2xl border">
                          {cleanScript(buildScriptFromFullInvoice(out, lang))}
                        </pre>
                        <Button
                          onClick={onCopy}
                          disabled={!out}
                          className="absolute -top-3 -end-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow px-3 py-2 text-xs flex items-center gap-1 disabled:opacity-50"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied
                            ? lang === "ar"
                              ? "نُسخ"
                              : "Copied"
                            : lang === "ar"
                            ? "نسخ"
                            : "Copy"}
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

                <div className="grid gap-4 md:grid-cols-2">
                  <Stat
                    icon={Percent}
                    label={t("proRataRatio")}
                    value={`${((summary?.ratio ?? 0) * 100).toFixed(2)}%`}
                    testid="ratio"
                  />
                  <Stat
                    icon={Wallet}
                    label={t("proRataMonthlyNet")}
                    value={`JD ${fmt3(monthlyNet)}`}
                    testid="monthly"
                  />
                  <Stat
                    icon={Calculator}
                    label={t("proRataProAmount")}
                    value={`JD ${fmt3(summary?.proAmountNet ?? 0)}`}
                    testid="proration"
                  />
                  <Stat
                    icon={Receipt}
                    label={t("proRataInvoice")}
                    value={`JD ${fmt3(summary?.invoiceNet ?? monthlyNet)}`}
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
