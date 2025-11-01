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
  Trash2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
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
    clearConversation,
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
              "flex flex-col gap-2",
              isUser ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap break-words rounded-3xl px-4 py-3 text-[13px] leading-relaxed shadow-sm sm:max-w-[75%] sm:text-sm",
                isUser
                  ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                  : "border border-orange-100/70 bg-white text-slate-900"
              )}
            >
              {m.content}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-orange-700/70 sm:text-xs">
              {experimentsEnabled && isUser && (
                <button
                  type="button"
                  onClick={() => setEditTarget({ index: i, text: m.content })}
                  className="inline-flex items-center gap-1 rounded-full border border-orange-100/80 bg-white/80 px-2.5 py-1 font-medium text-orange-700 transition hover:bg-orange-50 disabled:opacity-60"
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
                      className="inline-flex items-center gap-1 rounded-full border border-orange-100/80 bg-white/80 px-2.5 py-1 font-medium text-orange-700 transition hover:bg-orange-50 disabled:opacity-60"
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
                          "inline-flex h-6 w-6 items-center justify-center rounded-full border transition",
                          rated === 1
                            ? "border-green-500 bg-green-100 text-green-700"
                            : "border-orange-100 hover:border-green-400 hover:bg-green-100/70"
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
                          "inline-flex h-6 w-6 items-center justify-center rounded-full border transition",
                          rated === 0
                            ? "border-red-500 bg-red-100 text-red-700"
                            : "border-orange-100 hover:border-red-400 hover:bg-red-100/70"
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
        <div className="text-xs font-medium text-orange-600">Typing…</div>
      )}
    </>
  );

  return (
    <div className="fixed bottom-3 right-3 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          className="flex w-[min(92vw,22rem)] flex-col overflow-hidden rounded-[28px] border border-orange-100/70 bg-white/95 shadow-[0_18px_40px_rgba(255,122,0,0.22)] backdrop-blur sm:w-[min(26rem,92vw)]"
          style={{ height: "clamp(420px, 70vh, 560px)" }}
        >
          <div className="flex flex-col gap-3 border-b border-orange-100/70 bg-gradient-to-br from-orange-50/60 via-white to-orange-50/30 px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF8A1E] to-[#FF6600] text-white shadow-[0_8px_18px_rgba(255,122,0,0.35)]">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-orange-900 sm:text-base">Orange Assistant</span>
                  {usageLabel && (
                    <span className="text-xs text-orange-700/80 sm:text-[13px]">{usageLabel}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {isStreaming && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={stop}
                    className="hidden h-8 rounded-full px-3 text-[12px] font-medium text-red-600 transition hover:bg-red-50 sm:inline-flex sm:h-9 sm:text-sm"
                  >
                    <StopCircle className="mr-1 h-4 w-4" /> Stop
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="h-9 w-9 rounded-full border border-orange-100/70 text-orange-700 transition hover:bg-orange-50 sm:h-10 sm:w-10"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {experimentsEnabled && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-orange-700/80 sm:text-xs">
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
                {usageLabel && <span className="font-medium">{usageLabel}</span>}
              </div>
            )}
          </div>
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5"
          >
            {experimentsContent}
          </div>
          <div className="space-y-3 border-t border-orange-100/70 bg-white/90 px-4 py-3 sm:px-5 sm:py-4">
            {experimentsEnabled && contextSmartAction && (
              <div className="rounded-2xl border border-orange-100/80 bg-orange-50/70 px-3.5 py-3 shadow-inner">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1 text-left">
                    <p className="text-sm font-semibold text-orange-900 sm:text-[15px]">
                      {contextSmartAction.title}
                    </p>
                    <p className="text-[12px] text-orange-700/80 sm:text-[13px]">
                      {contextSmartAction.description}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={contextSmartAction.onAction}
                    className="h-8 self-start rounded-full bg-gradient-to-r from-[#FF8A1E] to-[#FF6600] px-4 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 sm:h-9 sm:text-sm"
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
                className="-mr-2 pr-2"
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
                className="flex-1 rounded-full border border-orange-100 bg-white/85 px-4 py-2 text-[13px] text-slate-900 shadow-inner transition focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200 sm:py-2.5 sm:text-sm"
                placeholder="Type a message"
                disabled={busy && !isStreaming}
              />
              {isStreaming && experimentsEnabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={stop}
                  className="inline-flex h-10 w-10 rounded-full border border-red-200 text-red-600 transition hover:bg-red-50 sm:hidden"
                  aria-label="Stop response"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              )}
              <Button
                type="button"
                onClick={onSend}
                disabled={disableSend || !input.trim()}
                className="h-10 rounded-full bg-gradient-to-br from-[#FF8A1E] to-[#FF6600] px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(255,122,0,0.3)] transition hover:scale-[1.03] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
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
        className="group flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full bg-gradient-to-br from-[#FF8A1E] to-[#FF6600] text-[12px] font-semibold text-white shadow-[0_16px_38px_rgba(255,122,0,0.35)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 sm:h-16 sm:w-16"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <span className="text-base leading-none">×</span>
        ) : (
          <>
            <MessageCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="leading-none">Chat</span>
          </>
        )}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your chat history on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                clearConversation();
                setInput("");
                setDeleteDialogOpen(false);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
