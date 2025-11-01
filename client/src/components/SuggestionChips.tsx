import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const suggestionsByPage: Record<
  SuggestionChipsProps["page"],
  string[]
> = {
  home: [
    "What can I do on the home page?",
    "كيف أبدأ استخدام الحاسبة الرئيسية؟",
    "Show me today's top tools",
    "أين أجد آخر التحديثات؟",
    "Give me a quick site tour",
    "كيف أتواصل مع الدعم مباشرة؟",
  ],
  calculator: [
    "How do I calculate the net salary?",
    "كيف أحسب الضريبة بسرعة؟",
    "Show tips for using the calculator",
    "هل يمكن مقارنة نتيجتين؟",
    "What formulas are behind this tool?",
    "ارشدني للخطوات خطوة بخطوة",
  ],
  prorata: [
    "What is the pro-rata calculator for?",
    "كيف أحسب بدل الإجازات؟",
    "Explain pro-rata in simple terms",
    "اعطني مثال عملي على احتساب برو راتا",
    "Which inputs are required here?",
    "ما الفرق بين برو راتا الشهري واليومي؟",
  ],
  docs: [
    "Find me the latest policy document",
    "وين موجود دليل الإجراءات؟",
    "Summarize the onboarding docs",
    "أعطني روابط مستندات الموارد البشرية",
    "What document explains allowances?",
    "كيف أبحث داخل الوثائق بسرعة؟",
  ],
  assistant: [
    "What can this assistant help me with?",
    "كيف أطرح سؤال عن الرواتب؟",
    "Suggest a quick productivity tip",
    "اربطني بصفحة الحاسبة المناسبة",
    "Share the most asked questions",
    "كيف أرسل ملاحظات عن الإجابات؟",
  ],
};

export type SuggestionChipsProps = {
  page: "home" | "calculator" | "prorata" | "docs" | "assistant";
  onPick: (text: string) => void;
  className?: string;
};

export function SuggestionChips({ page, onPick, className }: SuggestionChipsProps) {
  const items = suggestionsByPage[page];

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      role="list"
      aria-label="Chat suggestions"
    >
      {items.map((text) => (
        <Button
          key={text}
          type="button"
          variant="secondary"
          size="sm"
          className="whitespace-nowrap rounded-full border border-orange-100/80 bg-white/80 px-3 py-1.5 text-[12px] font-medium text-orange-700 shadow-sm transition hover:bg-orange-50 active:scale-[0.98] sm:px-3.5 sm:text-sm"
          onClick={() => onPick(text)}
        >
          {text}
        </Button>
      ))}
    </div>
  );
}

export default SuggestionChips;
