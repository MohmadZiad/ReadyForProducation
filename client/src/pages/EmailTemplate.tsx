import * as React from "react";
import { motion } from "framer-motion";
import { Copy, Check, Sparkles, Mail, ExternalLink, Loader2 } from "lucide-react";

import Header from "@/components/Header";
import GlassCard from "@/components/GlassCard";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import { buildEmailTemplate, type EmailTemplateLang } from "@/lib/emailTemplate";
import { resolveApiUrl } from "@/lib/apiBase";

const fadeIn = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function EmailTemplatePage() {
  const { language, t } = useLanguage();
  const defaultLang: EmailTemplateLang = language === "ar" ? "ar" : "en";
  const [emailLang, setEmailLang] = React.useState<EmailTemplateLang>(defaultLang);
  const [notes, setNotes] = React.useState("");
  const [aiSubject, setAiSubject] = React.useState<string | null>(null);
  const [aiBody, setAiBody] = React.useState<string | null>(null);
  const [copiedField, setCopiedField] = React.useState<"subject" | "body" | null>(null);
  const [isPolishing, setIsPolishing] = React.useState(false);
  const { toast } = useToast();
  const resetTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    setEmailLang(language === "ar" ? "ar" : "en");
  }, [language]);

  React.useEffect(() => {
    setAiSubject(null);
    setAiBody(null);
  }, [notes, emailLang]);

  React.useEffect(() => {
    return () => {
      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const baseTemplate = React.useMemo(
    () => buildEmailTemplate(notes, emailLang),
    [notes, emailLang]
  );

  const subject = aiSubject ?? baseTemplate.subject;
  const body = aiBody ?? baseTemplate.body;
  const metadata = baseTemplate;

  const previewDir = emailLang === "ar" ? "rtl" : "ltr";
  const previewAlign = emailLang === "ar" ? "text-right" : "text-left";

  const handleCopy = React.useCallback(
    async (text: string, field: "subject" | "body") => {
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast({
          title: t("emailTemplate.copySuccess"),
        });
        if (resetTimer.current) {
          window.clearTimeout(resetTimer.current);
        }
        resetTimer.current = window.setTimeout(() => {
          setCopiedField(null);
        }, 1600);
      } catch {
        toast({
          title: t("emailTemplate.copyError"),
          variant: "destructive",
        });
      }
    },
    [toast, t]
  );

  const handlePolish = React.useCallback(async () => {
    if (!notes.trim()) return;
    setIsPolishing(true);
    try {
      const response = await fetch(resolveApiUrl("/api/polish"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: emailLang,
          notes,
          subject,
          body,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "polish_failed");
      }

      if (typeof data.subject === "string") {
        setAiSubject(data.subject);
      }
      if (typeof data.body === "string") {
        setAiBody(data.body);
      }

      toast({ title: t("emailTemplate.polishSuccess") });

      void fetch(resolveApiUrl("/api/metrics"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "email_polish",
          lang: emailLang,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch {
      toast({
        title: t("emailTemplate.polishError"),
        variant: "destructive",
      });
    } finally {
      setIsPolishing(false);
    }
  }, [notes, emailLang, subject, body, toast, t]);

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodedSubject}&body=${encodedBody}`;
  const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/10">
      <Header />
      <div className="container mx-auto px-6 pt-28 pb-16 max-w-6xl">
        <motion.div {...fadeIn} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 mb-5 shadow-xl">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            {t("emailTemplate.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("emailTemplate.subtitle")}
          </p>
        </motion.div>

        <GlassCard className="backdrop-blur-lg">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-orange-600">
                  {t("emailTemplate.notesLabel")}
                </span>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  dir={emailLang === "ar" ? "rtl" : "ltr"}
                  className="min-h-[220px] rounded-3xl border-2 border-orange-100/80 bg-white/80 dark:bg-neutral-900/40 focus-visible:ring-orange-500 focus-visible:border-orange-500 text-base"
                  placeholder={t("emailTemplate.notesPlaceholder")}
                />
              </label>

              <div className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-orange-600">
                  {t("emailTemplate.languageLabel")}
                </span>
                <Select value={emailLang} onValueChange={(value) => setEmailLang(value as EmailTemplateLang)}>
                  <SelectTrigger className="h-12 rounded-3xl border-2 border-orange-100/80 bg-white/80 dark:bg-neutral-900/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleCopy(subject, "subject")}
                  variant="outline"
                  className="rounded-2xl border-orange-200 px-4 py-2 text-sm flex items-center gap-2"
                >
                  {copiedField === "subject" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {t("emailTemplate.copySubject")}
                </Button>
                <Button
                  onClick={() => handleCopy(body, "body")}
                  variant="outline"
                  className="rounded-2xl border-orange-200 px-4 py-2 text-sm flex items-center gap-2"
                >
                  {copiedField === "body" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {t("emailTemplate.copyBody")}
                </Button>
                <Button
                  onClick={handlePolish}
                  disabled={isPolishing || !notes.trim()}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white flex items-center gap-2 px-4 py-2 shadow hover:-translate-y-0.5 transition"
                >
                  {isPolishing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isPolishing
                    ? t("emailTemplate.polishing")
                    : t("emailTemplate.polishWithAI")}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground bg-white/60 dark:bg-neutral-900/40 rounded-2xl px-4 py-3 border">
                {t("emailTemplate.privacyNote")}
              </p>
            </div>

            <div className="space-y-4">
              <motion.div
                {...fadeIn}
                transition={{ duration: 0.45 }}
                className="rounded-3xl border bg-white/80 dark:bg-neutral-900/40 px-6 py-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-orange-500 font-semibold">
                      {t("emailTemplate.previewTitle")}
                    </span>
                    {metadata.company && (
                      <span className="text-xs text-muted-foreground">
                        {metadata.company}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.open(gmailUrl, "_blank")}
                      className="rounded-2xl border-orange-200 px-3 py-2 text-xs flex items-center gap-2"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {t("emailTemplate.openGmail")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(mailtoUrl, "_blank")}
                      className="rounded-2xl border-orange-200 px-3 py-2 text-xs flex items-center gap-2"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("emailTemplate.openEmailApp")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-3" dir={previewDir}>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("emailTemplate.subjectLabel")}
                    </span>
                    <div
                      className={`mt-1 rounded-2xl border border-orange-100/60 bg-orange-50/70 dark:bg-orange-900/10 px-4 py-3 text-sm font-medium ${previewAlign}`}
                    >
                      {subject}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("emailTemplate.bodyLabel")}
                    </span>
                    <div
                      className={`mt-1 rounded-2xl border border-orange-100/60 bg-white/90 dark:bg-neutral-900/60 px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap ${previewAlign}`}
                    >
                      {body}
                    </div>
                  </div>
                </div>

                {metadata.numbers.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2" dir="ltr">
                    {metadata.numbers.map((num) => (
                      <span
                        key={num}
                        className="inline-flex items-center gap-1 rounded-full bg-orange-100/70 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200 px-3 py-1 text-xs"
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
