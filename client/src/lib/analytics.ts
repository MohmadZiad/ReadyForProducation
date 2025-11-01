import * as React from "react";

type ChatEventType =
  | "chat_open"
  | "send"
  | "first_token"
  | "complete"
  | "stop"
  | "error"
  | "csat_given";

type ChatEventPayload = Record<string, unknown> | undefined;

type ChatEvent = {
  type: ChatEventType;
  timestamp: number;
  data?: ChatEventPayload;
};

export type AnalyticsSession = {
  id: string;
  source: string;
  startedAt: number;
  lastActiveAt: number;
  events: ChatEvent[];
  metrics: {
    turns: number;
    tokens: number;
    firstTokenMs?: number;
    sessionLengthMs?: number;
    rating?: number;
    errorCount: number;
  };
};

export type AnalyticsState = {
  sessions: AnalyticsSession[];
};

const STORAGE_KEY = "chat-analytics-state";
const MAX_SESSIONS = 50;

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return Date.now();
}

class AnalyticsStore {
  private state: AnalyticsState;
  private listeners = new Set<() => void>();

  constructor() {
    this.state = { sessions: [] };
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AnalyticsState;
          if (Array.isArray(parsed.sessions)) {
            this.state = {
              sessions: parsed.sessions.map((session) => ({
                ...session,
                events: Array.isArray(session.events) ? session.events : [],
                metrics: {
                  turns: session.metrics?.turns ?? 0,
                  tokens: session.metrics?.tokens ?? 0,
                  firstTokenMs: session.metrics?.firstTokenMs,
                  sessionLengthMs: session.metrics?.sessionLengthMs,
                  rating: session.metrics?.rating,
                  errorCount: session.metrics?.errorCount ?? 0,
                },
              })),
            };
          }
        }
      } catch (error) {
        console.warn("analytics storage parse error", error);
      }
    }
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn("analytics storage write error", error);
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = () => this.state;

  createSession(source: string) {
    const session: AnalyticsSession = {
      id: createId(),
      source,
      startedAt: now(),
      lastActiveAt: now(),
      events: [],
      metrics: {
        turns: 0,
        tokens: 0,
        errorCount: 0,
      },
    };
    this.state = {
      sessions: [...this.state.sessions.slice(-MAX_SESSIONS + 1), session],
    };
    this.persist();
    this.notify();
    return session.id;
  }

  private updateSession(sessionId: string, updater: (session: AnalyticsSession) => void) {
    const idx = this.state.sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return;
    const session = this.state.sessions[idx];
    updater(session);
    session.lastActiveAt = now();
    this.state = {
      sessions: [
        ...this.state.sessions.slice(0, idx),
        session,
        ...this.state.sessions.slice(idx + 1),
      ],
    };
    this.persist();
    this.notify();
  }

  logEvent(sessionId: string, type: ChatEventType, data?: ChatEventPayload) {
    this.updateSession(sessionId, (session) => {
      session.events = [
        ...session.events,
        { type, timestamp: now(), data },
      ].slice(-200);

      switch (type) {
        case "send":
          session.metrics.turns += 1;
          break;
        case "first_token": {
          const delay = typeof data?.delayMs === "number" ? data.delayMs : undefined;
          if (typeof delay === "number") session.metrics.firstTokenMs = delay;
          break;
        }
        case "complete": {
          const tokens = typeof data?.tokens === "number" ? data.tokens : 0;
          session.metrics.tokens += tokens;
          if (typeof data?.sessionLengthMs === "number") {
            session.metrics.sessionLengthMs = data.sessionLengthMs;
          } else {
            session.metrics.sessionLengthMs = now() - session.startedAt;
          }
          break;
        }
        case "stop": {
          session.metrics.sessionLengthMs = now() - session.startedAt;
          break;
        }
        case "error":
          session.metrics.errorCount += 1;
          break;
        case "csat_given": {
          const rating = typeof data?.rating === "number" ? data.rating : undefined;
          if (typeof rating === "number") session.metrics.rating = rating;
          break;
        }
      }
    });
  }
}

export const analyticsStore = new AnalyticsStore();

export function createAnalyticsSession(source: string) {
  return analyticsStore.createSession(source);
}

export function useAnalyticsStore() {
  return React.useSyncExternalStore(
    analyticsStore.subscribe,
    analyticsStore.getState,
    analyticsStore.getState
  );
}

export type { ChatEventType };

export function logAnalyticsEvent(
  sessionId: string | null | undefined,
  type: ChatEventType,
  data?: ChatEventPayload
) {
  if (!sessionId) return;
  analyticsStore.logEvent(sessionId, type, data);
}
