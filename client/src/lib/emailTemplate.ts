import { translations } from "./i18n";
import type { Lang } from "./proRata";

export type EmailTemplateLang = Lang;

export interface EmailTemplateMetadata {
  company?: string;
  numbers: string[];
}

export interface EmailTemplateResult extends EmailTemplateMetadata {
  subject: string;
  body: string;
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/{{\s*([^}]+)\s*}}/g, (match, key) => {
    const resolved = values[key.trim()];
    return resolved ?? match;
  });
}

function normalizeTopic(raw: string, fallback: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (!cleaned) return fallback;
  return cleaned.length > 90 ? `${cleaned.slice(0, 87)}…` : cleaned;
}

function extractTopic(notes: string, fallback: string): string {
  const trimmed = notes.trim();
  if (!trimmed) return fallback;
  const firstSentence = trimmed
    .split(/[\n\r]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .flatMap((segment) => segment.split(/(?<=[.!؟?])/))
    .map((segment) => segment.trim())
    .find(Boolean);
  if (firstSentence) {
    return normalizeTopic(firstSentence, fallback);
  }
  const words = trimmed.split(/\s+/).filter(Boolean).slice(0, 8).join(" ");
  return normalizeTopic(words, fallback);
}

function extractCompany(notes: string, lang: EmailTemplateLang): string | undefined {
  const companyRegex = /(أورنج|اورنج|Orange|Zain|زين|Umniah|أمنية|Ooredoo|اتصالات|Etisalat)/i;
  const match = notes.match(companyRegex);
  if (!match) return undefined;
  const core = match[1].toLowerCase();
  switch (core) {
    case "orange":
    case "أورنج":
    case "اورنج":
      return lang === "ar" ? "أورنج" : "Orange Support Team";
    case "zain":
    case "زين":
      return lang === "ar" ? "زين" : "Zain Support Team";
    case "umniah":
    case "أمنية":
      return lang === "ar" ? "أمنية" : "Umniah Support Team";
    case "ooredoo":
      return lang === "ar" ? "أوريدو" : "Ooredoo Support Team";
    case "etisalat":
    case "اتصالات":
      return lang === "ar" ? "اتصالات" : "Etisalat Support Team";
    default:
      return match[1];
  }
}

function extractNumbers(notes: string): string[] {
  const numberRegex = /(?:\+?\d[\d\s-]{2,}\d)/g;
  const matches = notes.match(numberRegex) ?? [];
  const normalized = matches
    .map((num) => num.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function extractDetailPoints(notes: string): string[] {
  const segments = notes
    .split(/[\n\r]+/)
    .flatMap((segment) => segment.split(/(?<=[.!؟?])/))
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments;
}

export function buildEmailTemplate(
  notes: string,
  lang: EmailTemplateLang
): EmailTemplateResult {
  const locale = translations[lang].emailTemplate;
  const template = locale.template;

  const topic = extractTopic(notes, template.defaultTopicFallback);
  const company = extractCompany(notes, lang);
  const numbers = extractNumbers(notes);
  const detailPoints = extractDetailPoints(notes);

  const greeting = company
    ? interpolate(template.greetingCompany, { company })
    : template.greetingGeneric;

  const bulletItems = (detailPoints.length ? detailPoints : [template.noDetailsFallback]).map(
    (point) => `${template.bulletPrefix}${point}`
  );

  const bodySections = [
    greeting,
    "",
    template.intro,
    "",
    template.detailsHeading,
    ...bulletItems,
    "",
    template.closing,
  ];

  const body = bodySections.join("\n").trim();
  const subject = interpolate(template.defaultSubject, { topic });

  return { subject, body, company, numbers };
}
