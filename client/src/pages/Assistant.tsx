import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import GlassCard from "@/components/GlassCard";
import { useLanguage } from "@/lib/language-context";
import { MessageCircle, Send, Sparkles, Loader2 } from "lucide-react";
import { useAssistant } from "@/lib/useAssistant";
import { RichText } from "@/components/RichText";
import { SuggestionChips } from "@/components/SuggestionChips";

export default function Assistant() {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const { messages, send, busy, isStreaming } = useAssistant({
    source: "assistant-page",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!messages.length && !busy && (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-10 h-10 text-orange-400" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                      Start a conversation
                    </p>
                    <p className="text-muted-foreground">
                      Ask me anything about calculations or how to use the tools
                    </p>
                    {showWelcomeSuggestions && (
                      <div className="mt-6">
                        <SuggestionChips
                          page="assistant"
                          onPick={(text) => setInput(text)}
                        />
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
                          ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                          : "bg-card border border-card-border"
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
            <div className="p-6 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("typeMessage")}
                  className="flex-1 px-5 py-3 rounded-2xl bg-background border-2 border-border focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || busy}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
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
