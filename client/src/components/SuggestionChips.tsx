import * as React from "react";
import { Button } from "@/components/ui/button";

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
      className={`flex gap-2 overflow-x-auto pb-1 ${className ?? ""}`.trim()}
      role="list"
      aria-label="Chat suggestions"
    >
      {items.map((text) => (
        <Button
          key={text}
          type="button"
          variant="secondary"
          size="sm"
          className="whitespace-nowrap rounded-full"
          onClick={() => onPick(text)}
        >
          {text}
        </Button>
      ))}
    </div>
  );
}

export default SuggestionChips;
