import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import GlassCard from "@/components/GlassCard";
import { useLanguage } from "@/lib/language-context";
import { ArrowRight, Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useAssistant } from "@/lib/useAssistant";
import { RichText } from "@/components/RichText";
import { SuggestionChips } from "@/components/SuggestionChips";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Assistant() {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const { messages, send, busy, isStreaming } = useAssistant({
    source: "assistant-page",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, isStreaming]);

  const handleSend = () => {
    if (!input.trim() || busy) return;
    const txt = input;
    setInput("");
    send(txt);
  };

  const isThinking = busy || isStreaming;
  const experimentsEnabled = import.meta.env.VITE_CHAT_EXPERIMENTS !== "0";
  const showWelcomeSuggestions =
    experimentsEnabled && messages.length === 0 && !isThinking;

  const quickActions = useMemo(
    () =>
      [
        {
          emoji: "💰",
          title: "Calculate my salary adjustment",
          description: "Open the calculator to explore salary scenarios instantly.",
          onAction: () => navigate("/calculator"),
        },
        {
          emoji: "📅",
          title: "Check pro-rata leave days",
          description: "Jump into the pro-rata tool for accurate leave entitlements.",
          onAction: () => navigate("/pro-rata"),
        },
        {
          emoji: "🧾",
          title: "Generate a salary breakdown",
          description: "Let the assistant draft a clear salary breakdown to share.",
          onAction: () =>
            setInput(
              "Generate a detailed salary breakdown including allowances and deductions."
            ),
        },
        {
          emoji: "💬",
          title: "Ask about HR policies",
          description: "Review the docs or ask me to summarise any HR policy update.",
          onAction: () =>
            setInput("What are the latest HR policies on remote work and benefits?"),
        },
      ],
    [navigate, setInput]
  );

  const lastUserMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "user") {
        return messages[i].content;
      }
    }
    return null;
  }, [messages]);

  const contextSmartAction = useMemo(() => {
    if (!experimentsEnabled || !lastUserMessage) return null;
    const lower = lastUserMessage.toLowerCase();
    const truncate = (text: string, max = 72) =>
      text.length > max ? `${text.slice(0, max - 1)}…` : text;

    if (/(salary|adjust|increase|calculator|pay|compensation)/.test(lower)) {
      return {
        title: "Continue with the salary tools",
        description:
          "Revisit the calculator and keep refining your compensation scenario.",
        cta: "Open Calculator",
        onAction: () => navigate("/calculator"),
      };
    }

    if (/(pro[-\s]?rata|leave|vacation|time off)/.test(lower)) {
      return {
        title: "Need pro-rata support?",
        description:
          "Jump straight into the pro-rata calculator or ask for a quick recap.",
        cta: "Open Pro-Rata",
        onAction: () => navigate("/pro-rata"),
      };
    }

    if (/(policy|policies|hr|document|guideline|docs)/.test(lower)) {
      return {
        title: "Browse the HR knowledge base",
        description:
          "Open the docs to confirm the details or let me summarise the highlights.",
        cta: "View Docs",
        onAction: () => navigate("/docs"),
      };
    }

    return {
      title: "Pick up where you left off",
      description: `Continue your last question: “${truncate(lastUserMessage)}”`,
      cta: "Prefill",
      onAction: () => setInput(lastUserMessage),
    };
  }, [experimentsEnabled, lastUserMessage, navigate, setInput]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/10">
      <Header />

      <div className="container mx-auto px-6 pt-32 pb-24 max-w-5xl">
        {/* Page header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 mb-6 shadow-xl">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            {t("assistantTitle")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("assistantSubtitle")}
          </p>
        </motion.div>

        {/* Chat container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard className="h-[600px] flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 space-y-3">
              {!messages.length && !busy && (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 flex items-center justify-center mx-auto">
                      <Sparkles className="w-10 h-10 text-orange-400" />
                    </div>
                    {showWelcomeSuggestions && (
                      <div className="space-y-5">
                        <SuggestionChips
                          page="assistant"
                          onPick={(text) => setInput(text)}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          {quickActions.map((card) => (
                            <button
                              key={card.title}
                              type="button"
                              onClick={card.onAction}
                              className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-orange-50/80 to-orange-100/60 p-4 sm:p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                            >
                              <div className="flex items-start justify-between">
                                <span className="text-2xl" aria-hidden>
                                  {card.emoji}
                                </span>
                                <ArrowRight className="h-4 w-4 text-orange-400 transition-transform group-hover:translate-x-1" />
                              </div>
                              <h3 className="mt-3 text-base font-semibold text-orange-900">
                                {card.title}
                              </h3>
                              <p className="mt-2 text-sm text-orange-700/80">
                                {card.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-3xl px-5 py-3 ${
                        m.role === "user"
                          ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/20"
                          : "bg-gradient-to-br from-white to-orange-50/40 border border-orange-100 text-gray-900 shadow-sm"
                      }`}
                    >
                      <RichText text={m.content} className="text-sm" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div ref={messagesEndRef} />

              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-card border border-card-border rounded-3xl px-5 py-3">
                    <div className="flex gap-2">
                      <motion.div
                        className="w-2 h-2 bg-orange-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-orange-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-orange-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="px-4 py-5 md:px-6 md:py-6 border-t border-border">
              {experimentsEnabled && contextSmartAction && (
                <div className="mb-4 rounded-2xl border border-orange-200/70 bg-orange-50/80 px-5 py-4 shadow-inner">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-orange-900">
                        {contextSmartAction.title}
                      </p>
                      <p className="mt-1 text-sm text-orange-700/80">
                        {contextSmartAction.description}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={contextSmartAction.onAction}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      {contextSmartAction.cta}
                    </Button>
                  </div>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2 sm:gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("typeMessage")}
                  className="flex-1 px-4 py-3 rounded-2xl bg-background border-2 border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
                >
                  {busy ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">
                    {busy ? "Sending..." : t("send")}
                  </span>
                </button>
              </form>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
