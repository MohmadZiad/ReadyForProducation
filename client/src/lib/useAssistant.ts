import * as React from "react";
import { resolveApiUrl } from "./apiBase";
import {
  createAnalyticsSession,
  logAnalyticsEvent,
} from "./analytics";

export type ChatMsg = {
  role: "user" | "assistant" | "system";
  content: string;
};

type RateLimitInfo = {
  remaining?: number;
  limit?: number;
  reset?: number;
};

type ChatError = {
  message: string;
  timestamp: number;
  retry?: () => void;
};

type ChatUsage = {
  turns: number;
  tokenEstimate: number;
};

type ChatRequestMode = "send" | "edit" | "regenerate";

type ChatRequest = {
  history: ChatMsg[];
  mode: ChatRequestMode;
};

type UseAssistantOptions = {
  source?: string;
};

const experimentsEnabled = import.meta.env.VITE_CHAT_EXPERIMENTS !== "0";

const styleSystem: ChatMsg = {
  role: "system",
  content:
    "Answer in the user's language. Keep it to 1–3 lines. Use Markdown links [Label](URL). Be direct and actionable.",
};

const SSE_PREFIX = "data:";

function extractRateLimits(headers: Headers): RateLimitInfo | null {
  const remaining = headers.get("x-ratelimit-remaining");
  const limit = headers.get("x-ratelimit-limit");
  const reset = headers.get("x-ratelimit-reset");
  if (!remaining && !limit && !reset) return null;
  return {
    remaining: remaining ? Number(remaining) : undefined,
    limit: limit ? Number(limit) : undefined,
    reset: reset ? Number(reset) : undefined,
  };
}

async function postMetrics(payload: Record<string, unknown>) {
  if (!experimentsEnabled) return;
  try {
    await fetch(resolveApiUrl("/api/metrics"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore client metrics failure
  }
}

export function useAssistant(options: UseAssistantOptions = {}) {
  const source = options.source ?? "widget";
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [usage, setUsage] = React.useState<ChatUsage>({ turns: 0, tokenEstimate: 0 });
  const [rateLimit, setRateLimit] = React.useState<RateLimitInfo | null>(null);
  const [lastError, setLastError] = React.useState<ChatError | null>(null);

  const messagesRef = React.useRef(messages);
  const busyRef = React.useRef(busy);
  const abortRef = React.useRef<AbortController | null>(null);
  const lastFailedRequestRef = React.useRef<ChatRequest | null>(null);

  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  React.useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const [sessionId] = React.useState(() =>
    experimentsEnabled ? createAnalyticsSession(source) : null
  );

  React.useEffect(() => {
    if (sessionId) {
      logAnalyticsEvent(sessionId, "chat_open");
    }
  }, [sessionId]);

  const clearError = React.useCallback(() => setLastError(null), []);

  const updateAssistantContent = React.useCallback((index: number, content: string) => {
    setMessages((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = { ...next[index], content };
      messagesRef.current = next;
      return next;
    });
  }, []);

  const startRequest = React.useCallback(
    (request: ChatRequest) => {
      if (busyRef.current) return;

      const baseHistory = request.history.map((msg) => ({ ...msg }));
      const assistantIndex = baseHistory.length;
      const nextMessages = [...baseHistory, { role: "assistant", content: "" }];

      messagesRef.current = nextMessages;
      setMessages(nextMessages);
      setBusy(true);
      busyRef.current = true;
      setIsStreaming(true);
      setLastError(null);
      setUsage((prev) => ({ ...prev, turns: prev.turns + 1 }));

      if (sessionId) {
        logAnalyticsEvent(sessionId, "send", { mode: request.mode });
      }

      const controller = new AbortController();
      abortRef.current = controller;
      const startedAt = Date.now();
      let firstTokenLogged = false;
      let firstTokenDelay: number | undefined;
      let collectedTokens = 0;

      const run = async () => {
        try {
          const response = await fetch(resolveApiUrl("/api/chat"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [styleSystem, ...baseHistory] }),
            signal: controller.signal,
          });

          const limits = extractRateLimits(response.headers);
          if (limits) {
            setRateLimit(limits);
          }

          if (!response.ok) {
            throw new Error(`Chat error (${response.status})`);
          }

          const contentType = response.headers.get("content-type") ?? "";
          if (response.body && contentType.includes("text/event-stream")) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const events = buffer.split("\n\n");
              buffer = events.pop() ?? "";
              for (const event of events) {
                if (!event.startsWith(SSE_PREFIX)) continue;
                const payload = event.slice(SSE_PREFIX.length).trim();
                if (!payload || payload === "[DONE]") continue;
                let delta = "";
                try {
                  const json = JSON.parse(payload);
                  delta = json?.choices?.[0]?.delta?.content ?? "";
                } catch {
                  continue;
                }
                if (!delta) continue;
                if (!firstTokenLogged) {
                  firstTokenLogged = true;
                  firstTokenDelay = Date.now() - startedAt;
                  logAnalyticsEvent(sessionId, "first_token", { delayMs: firstTokenDelay });
                }
                collectedTokens += delta.length;
                updateAssistantContent(assistantIndex, (
                  messagesRef.current[assistantIndex]?.content ?? ""
                ) + delta);
                setUsage((prev) => ({
                  ...prev,
                  tokenEstimate: prev.tokenEstimate + delta.length,
                }));
              }
            }
          } else {
            const raw = await response.text();
            let text = "";
            if (raw) {
              try {
                const data = JSON.parse(raw);
                text = data?.choices?.[0]?.message?.content ?? "";
              } catch {
                text = raw;
              }
            }
            collectedTokens += text.length;
            if (text) {
              if (!firstTokenLogged) {
                firstTokenLogged = true;
                firstTokenDelay = Date.now() - startedAt;
                logAnalyticsEvent(sessionId, "first_token", { delayMs: firstTokenDelay });
              }
              updateAssistantContent(assistantIndex, text);
              setUsage((prev) => ({
                ...prev,
                tokenEstimate: prev.tokenEstimate + text.length,
              }));
            }
          }

          logAnalyticsEvent(sessionId, "complete", {
            tokens: collectedTokens,
            sessionLengthMs: Date.now() - startedAt,
          });
          await postMetrics({
            mode: request.mode,
            tokens: collectedTokens,
            delayMs: firstTokenDelay,
            durationMs: Date.now() - startedAt,
          });
          lastFailedRequestRef.current = null;
        } catch (error) {
          if (controller.signal.aborted) {
            logAnalyticsEvent(sessionId, "stop");
          } else {
            lastFailedRequestRef.current = request;
            const message =
              (error as Error)?.message || "Unable to reach chat service.";
            setLastError({
              message,
              timestamp: Date.now(),
              retry: () => startRequest(request),
            });
            logAnalyticsEvent(sessionId, "error", { message });
          }
        } finally {
          abortRef.current = null;
          setBusy(false);
          busyRef.current = false;
          setIsStreaming(false);
        }
      };

      void run();
    },
    [sessionId, updateAssistantContent]
  );

  const send = React.useCallback(
    (content: string) => {
      if (!content.trim()) return;
      const history = [...messagesRef.current, { role: "user", content }];
      startRequest({ history, mode: "send" });
    },
    [startRequest]
  );

  const editAndResend = React.useCallback(
    (userIndex: number, newText: string) => {
      const target = messagesRef.current[userIndex];
      if (!target || target.role !== "user") return;
      const history = [
        ...messagesRef.current.slice(0, userIndex),
        { role: "user", content: newText },
      ];
      startRequest({ history, mode: "edit" });
    },
    [startRequest]
  );

  const regenerate = React.useCallback(() => {
    const current = messagesRef.current;
    for (let i = current.length - 1; i >= 0; i--) {
      if (current[i].role === "user") {
        const history = current.slice(0, i + 1);
        startRequest({ history, mode: "regenerate" });
        return;
      }
    }
  }, [startRequest]);

  const stop = React.useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const retry = React.useCallback(() => {
    const last = lastFailedRequestRef.current;
    if (last) {
      startRequest(last);
    }
  }, [startRequest]);

  const registerCsat = React.useCallback(
    (rating: number) => {
      logAnalyticsEvent(sessionId, "csat_given", { rating });
      void postMetrics({ type: "csat", rating });
    },
    [sessionId]
  );

  const clearConversation = React.useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    messagesRef.current = [];
    setMessages([]);
    setBusy(false);
    busyRef.current = false;
    setIsStreaming(false);
    setUsage({ turns: 0, tokenEstimate: 0 });
    setRateLimit(null);
    setLastError(null);
    lastFailedRequestRef.current = null;
    if (sessionId) {
      logAnalyticsEvent(sessionId, "reset");
    }
  }, [sessionId]);

  return {
    messages,
    send,
    editAndResend,
    regenerate,
    stop,
    retry,
    busy,
    isStreaming,
    usage,
    rateLimit,
    lastError,
    clearError,
    registerCsat,
    clearConversation,
  } as const;
}
