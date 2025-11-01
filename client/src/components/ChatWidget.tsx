import * as React from "react";
import { useLocation } from "wouter";
import {
  Edit3,
  Loader2,
  MessageCircle,
  RefreshCcw,
  StopCircle,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { useAssistant } from "@/lib/useAssistant";
import { SuggestionChips } from "@/components/SuggestionChips";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useChatPrefill } from "@/lib/chatBus";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { resolveApiUrl } from "@/lib/apiBase";

const experimentsEnabled = import.meta.env.VITE_CHAT_EXPERIMENTS !== "0";
const CSAT_STORAGE_KEY = "chat-csat-ratings";
const CSAT_PENDING_KEY = "chat-csat-pending";

type PageKey = "home" | "calculator" | "prorata" | "docs" | "assistant";

function getPageFromPath(path: string | undefined): PageKey {
  switch (path) {
    case "/":
      return "home";
    case "/calculator":
      return "calculator";
    case "/pro-rata":
      return "prorata";
    case "/docs":
      return "docs";
    case "/assistant":
      return "assistant";
    default:
      return "assistant";
  }
}

function loadStoredRatings() {
  if (typeof window === "undefined") return {} as Record<number, number>;
  try {
    const raw = window.localStorage.getItem(CSAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, number>;
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [Number(key), value])
      );
    }
  } catch {
    // ignore
  }
  return {} as Record<number, number>;
}

function storeRatings(ratings: Record<number, number>) {
  if (typeof window === "undefined") return;
  try {
    const serialisable = Object.fromEntries(
      Object.entries(ratings).map(([key, value]) => [String(key), value])
    );
    window.localStorage.setItem(CSAT_STORAGE_KEY, JSON.stringify(serialisable));
  } catch {
    // ignore
  }
}

function persistPendingFeedback(payload: unknown) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(CSAT_PENDING_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push(payload);
    window.localStorage.setItem(CSAT_PENDING_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export default function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [autoScrollPaused, setAutoScrollPaused] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [editTarget, setEditTarget] = React.useState<{ index: number; text: string } | null>(
    null
  );
  const [csatRatings, setCsatRatings] = React.useState<Record<number, number>>(
    () => loadStoredRatings()
  );

  const { toast } = useToast();
  const [path, setLocation] = useLocation();
  const page = getPageFromPath(path);

  const {
    messages,
    send,
    editAndResend,
    regenerate,
    stop,
    busy,
    isStreaming,
    usage,
    rateLimit,
    lastError,
    clearError,
    registerCsat,
  } = useAssistant({ source: "widget" });

  const lastUserMessage = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "user") {
        return messages[i].content;
      }
    }
    return null;
  }, [messages]);

  const contextSmartAction = React.useMemo(() => {
    if (!experimentsEnabled || !lastUserMessage) return null;
    const lower = lastUserMessage.toLowerCase();
    const truncate = (text: string, max = 64) =>
      text.length > max ? `${text.slice(0, max - 1)}…` : text;

    if (/(salary|adjust|increase|calculator|pay|compensation)/.test(lower)) {
      return {
        title: "Take it to the salary calculator",
        description: "Open the calculator to fine-tune the numbers you just shared.",
        cta: "Go to Calculator",
        onAction: () => setLocation("/calculator"),
      };
    }

    if (/(pro[-\s]?rata|leave|vacation|time off)/.test(lower)) {
      return {
        title: "Need the pro-rata tool?",
        description: "Jump over to the pro-rata helper for a guided calculation.",
        cta: "Open Pro-Rata",
        onAction: () => setLocation("/pro-rata"),
      };
    }

    if (/(policy|policies|hr|document|guideline|docs)/.test(lower)) {
      return {
        title: "Check the HR docs for confirmation",
        description: "Browse the documentation or ask me to summarise the highlights.",
        cta: "View Docs",
        onAction: () => setLocation("/docs"),
      };
    }

    return {
      title: "Continue your last question",
      description: `Prefill “${truncate(lastUserMessage)}” and keep the flow going.`,
      cta: "Prefill",
      onAction: () => {
        setOpen(true);
        setInput(lastUserMessage);
        requestAnimationFrame(() => inputRef.current?.focus());
      },
    };
  }, [experimentsEnabled, lastUserMessage, setLocation, setOpen, setInput]);

  React.useEffect(() => {
    if (!lastError) return;
    const action = lastError.retry ? (
      <ToastAction altText="Retry" onClick={lastError.retry}>
        Retry
      </ToastAction>
    ) : undefined;
    toast({
      title: "We hit a snag",
      description: lastError.message,
      action,
    });
    clearError();
  }, [lastError, toast, clearError]);

  const checkAtBottom = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 32;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setIsAtBottom(atBottom);
  }, []);

  React.useEffect(() => {
    checkAtBottom();
  }, [checkAtBottom]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      checkAtBottom();
      if (!autoScrollPaused) {
        const threshold = 32;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
        setIsAtBottom(atBottom);
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [autoScrollPaused, checkAtBottom]);

  React.useEffect(() => {
    if (autoScrollPaused) return;
    if (!scrollRef.current) return;
    if (!isAtBottom) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming, autoScrollPaused, isAtBottom]);

  const handlePrefill = React.useCallback(
    ({ text, focus, open: shouldOpen }: { text: string; focus?: boolean; open?: boolean }) => {
      setInput(text);
      if (shouldOpen) setOpen(true);
      if (focus) {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    },
    []
  );

  useChatPrefill(handlePrefill);

  const onSend = React.useCallback(() => {
    if (!input.trim()) return;
    if (busy || isStreaming) return;
    send(input.trim());
    setInput("");
  }, [input, send, busy, isStreaming]);

  const showSuggestions =
    experimentsEnabled && messages.length === 0 && !input.trim() && !busy;

  const usageLabel = React.useMemo(() => {
    if (!experimentsEnabled) return "";
    const parts = [`Turns: ${usage.turns}`, `Tokens≈${usage.tokenEstimate}`];
    if (rateLimit?.remaining !== undefined && rateLimit?.limit !== undefined) {
      parts.push(`Limit ${rateLimit.remaining}/${rateLimit.limit}`);
    }
    return parts.join(" • ");
  }, [usage.turns, usage.tokenEstimate, rateLimit]);

  const handleEditConfirm = React.useCallback(() => {
    if (!editTarget) return;
    if (!editTarget.text.trim()) return;
    editAndResend(editTarget.index, editTarget.text.trim());
    setEditTarget(null);
  }, [editTarget, editAndResend]);

  const handleCsat = React.useCallback(
    async (index: number, rating: number) => {
      if (!experimentsEnabled) return;
      setCsatRatings((prev) => {
        const next = { ...prev, [index]: rating };
        storeRatings(next);
        return next;
      });
      registerCsat(rating);
      if (!experimentsEnabled) return;
      try {
        await fetch(resolveApiUrl("/api/feedback"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            messageIndex: index,
            timestamp: Date.now(),
          }),
        });
      } catch {
        persistPendingFeedback({ rating, index, timestamp: Date.now() });
      }
    },
    [registerCsat]
  );

  const disableSend = busy || isStreaming;

  const experimentsContent = (
    <>
      {messages.map((m, i) => {
        const isUser = m.role === "user";
        const rated = csatRatings[i];
        return (
          <div
            key={i}
            className={cn(
              "flex flex-col gap-1",
              isUser ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                isUser
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-900"
              )}
            >
              {m.content}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {experimentsEnabled && isUser && (
                <button
                  type="button"
                  onClick={() =>
                    setEditTarget({ index: i, text: m.content })
                  }
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-muted"
                  disabled={busy || isStreaming}
                >
                  <Edit3 className="h-3 w-3" /> Edit & Resend
                </button>
              )}
              {experimentsEnabled && !isUser && (
                <div className="flex items-center gap-2">
                  {i === messages.length - 1 && (
                    <button
                      type="button"
                      onClick={regenerate}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-muted"
                      disabled={busy || isStreaming}
                    >
                      <RefreshCcw className="h-3 w-3" /> Regenerate
                    </button>
                  )}
                  {experimentsEnabled && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCsat(i, 1)}
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full border",
                        rated === 1
                          ? "border-green-500 bg-green-100 text-green-700"
                          : "border-transparent hover:border-green-500 hover:bg-green-100"
                      )}
                      aria-label="Thumbs up"
                      disabled={rated === 1}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCsat(i, 0)}
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full border",
                        rated === 0
                          ? "border-red-500 bg-red-100 text-red-700"
                          : "border-transparent hover:border-red-500 hover:bg-red-100"
                      )}
                      aria-label="Thumbs down"
                      disabled={rated === 0}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {isStreaming && experimentsEnabled && (
        <div className="text-xs text-muted-foreground">Typing…</div>
      )}
    </>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-orange-50/80 to-white shadow-2xl shadow-orange-500/10">
          <div className="flex items-center justify-between border-b px-4 py-2 text-sm font-medium">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Chat
            </div>
            {usageLabel && (
              <div className="text-xs text-muted-foreground">{usageLabel}</div>
            )}
          </div>
          {experimentsEnabled && (
            <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Switch
                  id="chat-autoscroll"
                  checked={!autoScrollPaused}
                  onCheckedChange={(value) => setAutoScrollPaused(!value)}
                  className="data-[state=checked]:bg-orange-500"
                />
                <label htmlFor="chat-autoscroll" className="cursor-pointer select-none">
                  {autoScrollPaused ? "Auto-scroll paused" : "Auto-scroll active"}
                </label>
              </div>
              {isStreaming && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={stop}
                  className="text-red-600 hover:text-red-700"
                >
                  <StopCircle className="mr-1 h-4 w-4" /> Stop
                </Button>
              )}
            </div>
          )}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
            {messages.length === 0 && !isStreaming && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="max-w-xs rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-white px-5 py-6 text-sm text-orange-700 shadow-inner">
                  <p className="text-base font-semibold text-orange-600">
                    👋 Welcome to Orange Assistant!
                  </p>
                  <p className="mt-2 text-sm text-orange-700/90">
                    Ask me anything about salary calculations, benefits, or HR policies. I'm here to make your work easier.
                  </p>
                </div>
              </div>
            )}
            {experimentsContent}
          </div>
          <div className="border-t px-4 py-3 space-y-2">
            {experimentsEnabled && contextSmartAction && (
              <div className="rounded-xl border border-orange-100 bg-orange-50/80 px-3 py-3 shadow-inner">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-sm font-semibold text-orange-900">
                      {contextSmartAction.title}
                    </p>
                    <p className="text-xs text-orange-700/80">
                      {contextSmartAction.description}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={contextSmartAction.onAction}
                    className="self-start bg-orange-500 text-white hover:bg-orange-600"
                  >
                    {contextSmartAction.cta}
                  </Button>
                </div>
              </div>
            )}
            {showSuggestions && (
              <SuggestionChips
                page={page}
                onPick={(text) => {
                  setInput(text);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
              />
            )}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                className="flex-1 rounded-xl border px-3 py-2 text-sm"
                placeholder="Type a message"
                disabled={busy && !isStreaming}
              />
              {isStreaming && experimentsEnabled && (
                <Button type="button" variant="ghost" size="icon" onClick={stop}>
                  <StopCircle className="h-5 w-5 text-red-600" />
                </Button>
              )}
              <Button
                type="button"
                onClick={onSend}
                disabled={disableSend || !input.trim()}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                {busy || isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      <Button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-orange-500 px-5 py-3 text-white shadow-lg hover:bg-orange-600"
      >
        {open ? "Close" : "Chat"}
      </Button>

      <Dialog open={!!editTarget} onOpenChange={(value) => !value && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editTarget?.text ?? ""}
            onChange={(e) =>
              setEditTarget((current) =>
                current ? { ...current, text: e.target.value } : current
              )
            }
            rows={5}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditConfirm} disabled={!editTarget?.text.trim() || busy}>
              Resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
