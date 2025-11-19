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
const LATIN_REGEX = /[A-Za-z]/;
const CONTACT_REGEX = /(\+?\d[\d\s-]{6,})/;
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
}

interface CustomerData {
  name?: string;
  accountId?: string;
  ticketId?: string;
  contactNumber?: string;
}

const toneClosings: Record<ToneValue, { en: string; ar: string }> = {
  veryFormal: {
    en: "Kind regards,",
    ar: "مع خالص التحيات،",
  },
  professional: {
    en: "Best regards,",
    ar: "أطيب التحيات،",
  },
  direct: {
    en: "Thanks,",
    ar: "شكرًا،",
  },
};

const templateLibrary = {
  escalation: (data: CustomerData, tone: ToneValue): EmailResult => {
    const customerRef = data.name || "the customer";
    const caseRef = data.ticketId || data.accountId || "their case";
    return {
      updatedAt: Date.now(),
      en: {
        subject: `Escalation | ${caseRef}`,
        body: `Hi Team,\n\nPlease assist ${customerRef} by reviewing ${caseRef}. The agent requires technical insights to proceed. ${toneClosings[tone].en}\nOrange Support`,
      },
      ar: {
        subject: `تصعيد | ${caseRef}`,
        body: `مرحبًا فريق الدعم،\n\nنرجو مراجعة حالة ${caseRef} الخاصة بالعميل ${customerRef} لتزويدنا برأي فني يمكّن الفريق من المتابعة. ${toneClosings[tone].ar}\nفريق أورانج`,
      },
    };
  },
  request: (data: CustomerData, tone: ToneValue): EmailResult => {
    const customerRef = data.name || "the customer";
    return {
      updatedAt: Date.now(),
      en: {
        subject: `Info Request | ${data.ticketId ?? "Pending"}`,
        body: `Hi Team,\n\nKindly share the missing details to continue working on ${customerRef}'s request. ${toneClosings[tone].en}\nOrange Support`,
      },
      ar: {
        subject: `طلب معلومات | ${data.ticketId ?? "قيد المتابعة"}`,
        body: `مرحبًا فريق الدعم،\n\nنرجو تزويدنا بالمعلومات الناقصة لاستكمال معالجة طلب العميل ${customerRef}. ${toneClosings[tone].ar}\nفريق أورانج`,
      },
    };
  },
  followUp: (data: CustomerData, tone: ToneValue): EmailResult => {
    const caseRef = data.ticketId || "the previous case";
    return {
      updatedAt: Date.now(),
      en: {
        subject: `Follow-up | ${caseRef}`,
        body: `Dears,\n\nJust checking if there are updates on ${caseRef}. The customer is awaiting our feedback. ${toneClosings[tone].en}\nOrange Support`,
      },
      ar: {
        subject: `متابعة | ${caseRef}`,
        body: `أعزائي،\n\nنود التأكد من وجود أي تحديثات بخصوص ${caseRef}. العميل بانتظار ردّنا الداخلي. ${toneClosings[tone].ar}\nفريق أورانج`,
      },
    };
  },
  refund: (data: CustomerData, tone: ToneValue): EmailResult => {
    const caseRef = data.ticketId || "the refund case";
    return {
      updatedAt: Date.now(),
      en: {
        subject: `Refund Review | ${caseRef}`,
        body: `Hi Finance Team,\n\nPlease review the compensation request tied to ${caseRef}. Customer reference: ${data.name ?? "N/A"}. ${toneClosings[tone].en}\nOrange Support`,
      },
      ar: {
        subject: `مراجعة استرداد | ${caseRef}`,
        body: `مرحبًا فريق المالية،\n\nنرجو مراجعة طلب التعويض المرتبط بالحالة ${caseRef}. اسم العميل: ${data.name ?? "غير متوفر"}. ${toneClosings[tone].ar}\nفريق أورانج`,
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

const extractContactNumber = (value: string): string | undefined => {
  const match = value.match(CONTACT_REGEX);
  return match ? match[0].trim() : undefined;
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
  };
};

const mockGenerateEmail = async ({ notes, outputMode, templateKey, tone }: GenerateEmailArgs): Promise<EmailResult> => {
  await new Promise((resolve) => setTimeout(resolve, 360));
  const baseTemplate = getTemplateBuilder(templateKey)(parseCustomerData(notes), tone);
  const summarySentence = notes
    ? notes.split(/\.|\n/).filter(Boolean)[0]?.trim() ?? ""
    : "";

  const enhanceCopy = (copy?: EmailCopy): EmailCopy | undefined => {
    if (!copy) return undefined;
    const summary = summarySentence ? `\n\nContext: ${summarySentence}` : "";
    return {
      subject: copy.subject,
      body: `${copy.body}${summary}`,
    };
  };

  const includeArabic = outputMode === "ar" || outputMode === "bi";
  const includeEnglish = outputMode === "en" || outputMode === "bi";

  return {
    updatedAt: Date.now(),
    en: includeEnglish ? enhanceCopy(baseTemplate.en) : undefined,
    ar: includeArabic ? enhanceCopy(baseTemplate.ar) : undefined,
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
  const contactNumber = React.useMemo(() => extractContactNumber(notes), [notes]);
  const needsContactNumber = React.useMemo(() => {
    if (!notes) return false;
    return CALLBACK_HINT_REGEX.test(notes) && !contactNumber;
  }, [notes, contactNumber]);

  const applyTemplatePreview = React.useCallback(
    (key: TemplateValue) => {
      setTemplateKey(key);
      const preview = getTemplateBuilder(key)(parseCustomerData(notes), tone);
      setResult(preview);
    },
    [notes, tone]
  );

  const generateEmail = React.useCallback(
    async (mode: OutputMode) => {
      if (!notes.trim()) return;
      setIsGenerating(true);
      try {
        const generated = await mockGenerateEmail({ notes, outputMode: mode, templateKey, tone });
        setResult(generated);
        setOutputMode(mode);
      } finally {
        setIsGenerating(false);
      }
    },
    [notes, templateKey, tone]
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
  };
};
