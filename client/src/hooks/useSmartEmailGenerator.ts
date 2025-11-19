import * as React from "react";

export type OutputMode = "en" | "ar" | "bi";
export type DetectedLanguage = "unknown" | "en" | "ar" | "mixed";

export const toneOptions = [
  { value: "veryFormal", label: "Very Formal" },
  { value: "professional", label: "Professional & Friendly" },
  { value: "direct", label: "Short & Direct" },
] as const;
export type ToneValue = (typeof toneOptions)[number]["value"];

export const templateOptions = [
  { value: "escalation", label: "Escalation to Technical Team" },
  { value: "request", label: "Request for More Info" },
  { value: "followUp", label: "Follow-up on Previous Case" },
  { value: "refund", label: "Refund / Compensation Request" },
] as const;
export type TemplateValue = (typeof templateOptions)[number]["value"];

const ARABIC_REGEX = /[\u0600-\u06FF]/;
const ARABIC_CHARACTERS_GLOBAL = /[\u0600-\u06FF]+/g;
const LATIN_REGEX = /[A-Za-z]/;
const CONTACT_REGEX = /(\+?\d[\d\s-]{6,})/;
const LABELED_CONTACT_REGEX = /(?:contact|phone|mobile|callback|tel|رقم التواصل|رقم الهاتف|هاتف|اتصال)\s*(?:number|#)?\s*[:\-\s]*([+]?\d[\d\s-]{6,})/i;
const SUBSCRIPTION_REGEX = /(?:subscription|service|اشتراك)\s*(?:number|id|#)?\s*[:#\-\s]*([A-Za-z0-9\-]+)/i;
const CALLBACK_HINT_REGEX = /(call|callback|phone|اتصال|هاتف|تواصل)/i;

interface EmailCopy {
  subject: string;
  body: string;
}

export interface EmailResult {
  en?: EmailCopy;
  ar?: EmailCopy;
  updatedAt: number;
}

interface GenerateEmailArgs {
  notes: string;
  outputMode: OutputMode;
  templateKey: TemplateValue;
  tone: ToneValue;
  customerData: CustomerData;
}

interface CustomerData {
  name?: string;
  accountId?: string;
  ticketId?: string;
  contactNumber?: string;
  subscriptionNumber?: string;
}

const toneClosings: Record<ToneValue, { en: string; ar: string }> = {
  veryFormal: {
    en: "Best regards,",
    ar: "مع خالص التحيات،",
  },
  professional: {
    en: "Best regards,",
    ar: "أطيب التحيات،",
  },
  direct: {
    en: "BR,",
    ar: "شكرًا،",
  },
};

const buildDetailsBlock = (data: CustomerData, lang: "en" | "ar"): string => {
  const lines: string[] = [];
  if (data.contactNumber) {
    lines.push(lang === "en" ? `Contact number: ${data.contactNumber}` : `رقم التواصل: ${data.contactNumber}`);
  }
  if (data.subscriptionNumber) {
    lines.push(lang === "en" ? `Subscription #: ${data.subscriptionNumber}` : `رقم الاشتراك: ${data.subscriptionNumber}`);
  }
  return lines.length ? `\n\n${lines.join("\n")}` : "";
};

const templateLibrary = {
  escalation: (data: CustomerData, tone: ToneValue): EmailResult => {
    const customerRef = data.name || "the customer";
    const caseRef = data.ticketId || data.accountId || data.subscriptionNumber || "their case";
    return {
      updatedAt: Date.now(),
      en: {
        subject: `Escalation | ${caseRef}`,
        body: `Hi Team,\n\nPlease assist ${customerRef} by reviewing ${caseRef}. The agent requires technical insights to proceed.\n\n${toneClosings[tone].en}${buildDetailsBlock(
          data,
          "en"
        )}`,
      },
      ar: {
        subject: `تصعيد | ${caseRef}`,
        body: `مرحبًا فريق الدعم،\n\nنرجو مراجعة حالة ${caseRef} الخاصة بالعميل ${customerRef} لتزويدنا برأي فني يمكّن الفريق من المتابعة.\n\n${toneClosings[tone].ar}${buildDetailsBlock(
          data,
          "ar"
        )}`,
      },
    };
  },
  request: (data: CustomerData, tone: ToneValue): EmailResult => {
    const customerRef = data.name || "the customer";
    const caseId = data.ticketId ?? data.subscriptionNumber ?? "Pending";
    return {
      updatedAt: Date.now(),
      en: {
        subject: `Info Request | ${caseId}`,
        body: `Hi Team,\n\nKindly share the missing details to continue working on ${customerRef}'s request.\n\n${toneClosings[tone].en}${buildDetailsBlock(
          data,
          "en"
        )}`,
      },
      ar: {
        subject: `طلب معلومات | ${caseId}`,
        body: `مرحبًا فريق الدعم،\n\nنرجو تزويدنا بالمعلومات الناقصة لاستكمال معالجة طلب العميل ${customerRef}.\n\n${toneClosings[tone].ar}${buildDetailsBlock(
          data,
          "ar"
        )}`,
      },
    };
  },
  followUp: (data: CustomerData, tone: ToneValue): EmailResult => {
    const caseRef = data.ticketId || data.subscriptionNumber || "the previous case";
    return {
      updatedAt: Date.now(),
      en: {
        subject: `Follow-up | ${caseRef}`,
        body: `Dears,\n\nJust checking if there are updates on ${caseRef}. The customer is awaiting our feedback.\n\n${toneClosings[tone].en}${buildDetailsBlock(
          data,
          "en"
        )}`,
      },
      ar: {
        subject: `متابعة | ${caseRef}`,
        body: `أعزائي،\n\nنود التأكد من وجود أي تحديثات بخصوص ${caseRef}. العميل بانتظار ردّنا الداخلي.\n\n${toneClosings[tone].ar}${buildDetailsBlock(
          data,
          "ar"
        )}`,
      },
    };
  },
  refund: (data: CustomerData, tone: ToneValue): EmailResult => {
    const caseRef = data.ticketId || data.subscriptionNumber || "the refund case";
    return {
      updatedAt: Date.now(),
      en: {
        subject: `Refund Review | ${caseRef}`,
        body: `Hi Finance Team,\n\nPlease review the compensation request tied to ${caseRef}. Customer reference: ${data.name ?? "N/A"}.\n\n${toneClosings[tone].en}${buildDetailsBlock(
          data,
          "en"
        )}`,
      },
      ar: {
        subject: `مراجعة استرداد | ${caseRef}`,
        body: `مرحبًا فريق المالية،\n\nنرجو مراجعة طلب التعويض المرتبط بالحالة ${caseRef}. اسم العميل: ${data.name ?? "غير متوفر"}.\n\n${toneClosings[tone].ar}${buildDetailsBlock(
          data,
          "ar"
        )}`,
      },
    };
  },
};

type TemplateBuilder = (data: CustomerData, tone: ToneValue) => EmailResult;

const getTemplateBuilder = (key: TemplateValue): TemplateBuilder => {
  return templateLibrary[key] ?? templateLibrary.request;
};

const detectLanguage = (value: string): DetectedLanguage => {
  if (!value.trim()) return "unknown";
  const hasArabic = ARABIC_REGEX.test(value);
  const hasLatin = LATIN_REGEX.test(value);
  if (hasArabic && hasLatin) return "mixed";
  if (hasArabic) return "ar";
  return "en";
};

const stripArabicCharacters = (value: string): string => value.replace(ARABIC_CHARACTERS_GLOBAL, "");

const sanitizeEnglishMultiline = (value: string): string => {
  if (!value) return "";
  return stripArabicCharacters(value)
    .split("\n")
    .map((line) => line.replace(/\s{2,}/g, " ").trimEnd())
    .join("\n")
    .trim();
};

const extractContactNumber = (value: string): string | undefined => {
  const labeledMatch = value.match(LABELED_CONTACT_REGEX);
  if (labeledMatch) return labeledMatch[1]?.trim();
  const match = value.match(CONTACT_REGEX);
  return match ? match[0].trim() : undefined;
};

const extractSubscriptionNumber = (value: string): string | undefined => {
  const match = value.match(SUBSCRIPTION_REGEX);
  return match ? match[1]?.trim() : undefined;
};

const parseCustomerData = (value: string): CustomerData => {
  const nameMatch = value.match(/(?:customer|عميل)[:\-\s]+([A-Za-z\u0600-\u06FF\s]+)/i);
  const ticketMatch = value.match(/(?:ticket|case|ملف|طلب)[#:\-\s]+([A-Za-z0-9\-]+)/i);
  const accountMatch = value.match(/(?:account|رقم الحساب)[:\-\s]+([A-Za-z0-9]+)/i);
  return {
    name: nameMatch?.[1]?.trim(),
    ticketId: ticketMatch?.[1]?.trim(),
    accountId: accountMatch?.[1]?.trim(),
    contactNumber: extractContactNumber(value),
    subscriptionNumber: extractSubscriptionNumber(value),
  };
};

const mockGenerateEmail = async ({ notes, outputMode, templateKey, tone, customerData }: GenerateEmailArgs): Promise<EmailResult> => {
  await new Promise((resolve) => setTimeout(resolve, 360));
  const baseTemplate = getTemplateBuilder(templateKey)(customerData, tone);
  const summarySentence = notes
    ? notes.split(/\.|\n/).filter(Boolean)[0]?.trim() ?? ""
    : "";

  const enhanceCopy = (copy: EmailCopy | undefined, lang: "en" | "ar"): EmailCopy | undefined => {
    if (!copy) return undefined;
    const preparedSummary = summarySentence
      ? lang === "en"
        ? sanitizeEnglishMultiline(summarySentence)
        : summarySentence
      : "";
    const summary = preparedSummary ? `\n\nContext: ${preparedSummary}` : "";
    const subject = lang === "en" ? stripArabicCharacters(copy.subject).trim() || copy.subject : copy.subject;
    const body = lang === "en" ? sanitizeEnglishMultiline(copy.body) || copy.body : copy.body;
    return {
      subject,
      body: `${body}${summary}`,
    };
  };

  const includeArabic = outputMode === "ar" || outputMode === "bi";
  const includeEnglish = outputMode === "en" || outputMode === "bi";

  return {
    updatedAt: Date.now(),
    en: includeEnglish ? enhanceCopy(baseTemplate.en, "en") : undefined,
    ar: includeArabic ? enhanceCopy(baseTemplate.ar, "ar") : undefined,
  };
};

export const useSmartEmailGenerator = () => {
  const [notes, setNotes] = React.useState("");
  const [outputMode, setOutputMode] = React.useState<OutputMode>("en");
  const [tone, setTone] = React.useState<ToneValue>(toneOptions[1].value);
  const [templateKey, setTemplateKey] = React.useState<TemplateValue>(templateOptions[0].value);
  const [result, setResult] = React.useState<EmailResult | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const detectedLanguage = React.useMemo(() => detectLanguage(notes), [notes]);
  const customerData = React.useMemo(() => parseCustomerData(notes), [notes]);
  const contactNumber = customerData.contactNumber;
  const needsContactNumber = React.useMemo(() => {
    if (!notes) return false;
    return CALLBACK_HINT_REGEX.test(notes) && !contactNumber;
  }, [notes, contactNumber]);

  const applyTemplatePreview = React.useCallback(
    (key: TemplateValue) => {
      setTemplateKey(key);
      const preview = getTemplateBuilder(key)(customerData, tone);
      setResult(preview);
    },
    [customerData, tone]
  );

  const generateEmail = React.useCallback(
    async (mode: OutputMode) => {
      if (!notes.trim()) return;
      setIsGenerating(true);
      try {
        const generated = await mockGenerateEmail({
          notes,
          outputMode: mode,
          templateKey,
          tone,
          customerData,
        });
        setResult(generated);
        setOutputMode(mode);
      } finally {
        setIsGenerating(false);
      }
    },
    [notes, templateKey, tone, customerData]
  );

  return {
    notes,
    setNotes,
    detectedLanguage,
    outputMode,
    setOutputMode,
    tone,
    setTone,
    templateKey,
    setTemplateKey,
    applyTemplatePreview,
    result,
    generateEmail,
    isGenerating,
    needsContactNumber,
    contactNumber,
    customerData,
  };
};
