import * as React from "react";
import { Bot, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { formatDateForLang, fmt3, type Lang, type ProResult } from "@/lib/proRata";
import type { AddOnConfig, ProductConfig } from "@shared/config";

interface AssistantProps {
  products: ProductConfig[];
  addons: AddOnConfig[];
  productId: string | null;
  onProductChange: (id: string) => void;
  activationDate: string;
  onActivationChange: (value: string) => void;
  selectedAddOns: string[];
  onSetAddOns: (ids: string[]) => void;
  onConfirm: () => void;
  breakdown: (ProResult & { basePrice: number; addOnsTotal: number }) | null;
  anchorDay: number;
}

type AssistantMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

type AssistantStep = "product" | "activation" | "addons" | "confirm" | "summary";

function MessageBubble({ role, children }: { role: "bot" | "user"; children: React.ReactNode }) {
  const isBot = role === "bot";
  return (
    <div className={cn("flex", isBot ? "justify-start" : "justify-end")}> 
      <div
        className={cn(
          "max-w-full rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
          isBot
            ? "bg-orange-100/80 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100"
            : "bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ProRataAssistant(props: AssistantProps) {
  const {
    products,
    addons,
    productId,
    onProductChange,
    activationDate,
    onActivationChange,
    selectedAddOns,
    onSetAddOns,
    onConfirm,
    breakdown,
    anchorDay,
  } = props;

  const { t, language } = useLanguage();
  const lang = (language as Lang) ?? "en";

  const idRef = React.useRef(0);
  const nextId = React.useCallback(() => `msg-${idRef.current++}`, []);

  const [messages, setMessages] = React.useState<AssistantMessage[]>([]);
  const [step, setStep] = React.useState<AssistantStep>("product");
  const [activationDraft, setActivationDraft] = React.useState<string>(activationDate);
  const [addonDraft, setAddonDraft] = React.useState<string[]>(selectedAddOns);
  const [lastSummaryKey, setLastSummaryKey] = React.useState<string | null>(null);

  const resetConversation = React.useCallback(() => {
    idRef.current = 0;
    setMessages([
      { id: nextId(), role: "bot", text: `${t("proRataAssistantIntro")}` },
    ]);
    setStep("product");
    setActivationDraft(activationDate);
    setAddonDraft(selectedAddOns);
    setLastSummaryKey(null);
  }, [activationDate, nextId, selectedAddOns, t]);

  React.useEffect(() => {
    resetConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  React.useEffect(() => {
    setActivationDraft(activationDate);
  }, [activationDate]);

  React.useEffect(() => {
    setAddonDraft(selectedAddOns);
  }, [selectedAddOns]);

  const pushMessage = React.useCallback(
    (message: Omit<AssistantMessage, "id">) => {
      setMessages((prev) => [...prev, { ...message, id: nextId() }]);
    },
    [nextId]
  );

  const handleSelectProduct = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    onProductChange(id);
    pushMessage({ role: "user", text: product.label[lang] });
    pushMessage({ role: "bot", text: t("proRataAssistantActivationPrompt") });
    setStep("activation");
  };

  const handleActivationConfirm = () => {
    if (!activationDraft) return;
    onActivationChange(activationDraft);
    pushMessage({
      role: "user",
      text: formatDateForLang(new Date(`${activationDraft}T00:00:00Z`), lang),
    });
    pushMessage({ role: "bot", text: t("proRataAssistantAddOnsPrompt") });
    setStep("addons");
  };

  const toggleAddon = (id: string, checked: boolean) => {
    setAddonDraft((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  };

  const confirmAddons = (addonsToApply: string[]) => {
    onSetAddOns(addonsToApply);
    if (addonsToApply.length === 0) {
      pushMessage({ role: "user", text: t("proRataAssistantNoAddOns") });
    } else {
      const labels = addons
        .filter((addon) => addonsToApply.includes(addon.id))
        .map((addon) => addon.label[lang]);
      pushMessage({ role: "user", text: labels.join(", ") });
    }
    pushMessage({ role: "bot", text: t("proRataAssistantConfirmPrompt") });
    setStep("confirm");
  };

  const handleConfirmAddons = () => {
    confirmAddons(addonDraft);
  };

  const handleSkipAddons = () => {
    setAddonDraft([]);
    confirmAddons([]);
  };

  const handleCalculate = () => {
    pushMessage({ role: "user", text: t("proRataAssistantReady") });
    onConfirm();
    setStep("summary");
  };

  React.useEffect(() => {
    if (step !== "summary" || !breakdown) return;
    const summaryKey = `${breakdown.invoiceNet}-${breakdown.periodEndUTC.toISOString()}`;
    if (summaryKey === lastSummaryKey) return;

    const parts = [
      `${t("proRataBillCycleStart")}: ${formatDateForLang(
        breakdown.cycleStartUTC,
        lang
      )}`,
      `${t("proRataBillCycleEnd")}: ${formatDateForLang(
        breakdown.periodEndUTC,
        lang
      )}`,
      `${t("proRataRatio")}: ${(breakdown.ratio * 100).toFixed(2)}%`,
      `${t("proRataBase")}: JD ${fmt3(breakdown.basePrice)}`,
      `${t("proRataAddOnsTotal")}: JD ${fmt3(breakdown.addOnsTotal)}`,
      `${t("proRataMonthlyNet")}: JD ${fmt3(breakdown.monthlyNet)}`,
      `${t("proRataProAmount")}: JD ${fmt3(breakdown.proAmountNet)}`,
      `${t("proRataInvoice")}: JD ${fmt3(breakdown.invoiceNet)}`,
    ];

    if (selectedAddOns.length === 0) {
      parts.push(t("proRataAssistantNoAddOns"));
    } else {
      parts.push(t("proRataAddOnNotes"));
      addons
        .filter((addon) => selectedAddOns.includes(addon.id))
        .forEach((addon) => {
          parts.push(`• ${addon.label[lang]} – ${addon.explain[lang]}`);
        });
    }

    pushMessage({
      role: "bot",
      text: `${t("proRataAssistantSummary")}\n${parts.join("\n")}`,
    });
    setLastSummaryKey(summaryKey);
  }, [addons, breakdown, lang, lastSummaryKey, selectedAddOns, step, t, pushMessage]);

  return (
    <div className="rounded-3xl border bg-white/60 dark:bg-neutral-900/40 p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-300">
        <Bot className="h-4 w-4" />
        {t("proRataAssistantTitle")}
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {messages.map((message) => (
          <MessageBubble key={message.id} role={message.role}>
            {message.text}
          </MessageBubble>
        ))}
      </div>

      {step === "product" && (
        <div className="flex flex-wrap gap-2">
          {products.map((product) => (
            <Button
              key={product.id}
              size="sm"
              variant={product.id === productId ? "default" : "outline"}
              onClick={() => handleSelectProduct(product.id)}
            >
              {product.label[lang]}
            </Button>
          ))}
        </div>
      )}

      {step === "activation" && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={activationDraft}
            onChange={(event) => setActivationDraft(event.target.value)}
            className="rounded-xl border px-3 py-2 text-sm bg-white/70 dark:bg-neutral-900/60"
          />
          <Button size="sm" onClick={handleActivationConfirm}>
            {t("proRataAssistantActivationConfirm")}
          </Button>
        </div>
      )}

      {step === "addons" && (
        <div className="space-y-3">
          <div className="space-y-2">
            {addons.map((addon) => {
              const checked = addonDraft.includes(addon.id);
              return (
                <label
                  key={addon.id}
                  className="flex items-start gap-3 rounded-2xl border bg-white/70 dark:bg-neutral-900/50 px-3 py-2"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggleAddon(addon.id, Boolean(value))
                    }
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <div className="font-medium">{addon.label[lang]}</div>
                    <div className="text-xs opacity-70">
                      JD {fmt3(addon.price)} · {addon.explain[lang]}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleConfirmAddons}>
              {t("proRataAssistantAddOnsConfirm")}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleSkipAddons}>
              {t("proRataAssistantSkip")}
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={handleCalculate}>
            {t("proRataAssistantReady")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              resetConversation();
              if (productId) {
                onProductChange(productId);
              }
            }}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            {t("proRataAssistantRestart")}
          </Button>
        </div>
      )}

      {step === "summary" && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              resetConversation();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            {t("proRataAssistantRestart")}
          </Button>
          <div className="text-xs text-muted-foreground">
            {t("proRataBillAnchorLabel")} · {anchorDay}
          </div>
        </div>
      )}
    </div>
  );
}
