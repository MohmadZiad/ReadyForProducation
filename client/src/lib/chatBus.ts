import * as React from "react";

const PREFILL_EVENT = "chat-prefill";

type PrefillDetail = {
  text: string;
  focus?: boolean;
  open?: boolean;
};

type PrefillListener = (detail: PrefillDetail) => void;

export function emitChatPrefill(detail: PrefillDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PrefillDetail>(PREFILL_EVENT, { detail }));
}

export function useChatPrefill(listener: PrefillListener) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const custom = event as CustomEvent<PrefillDetail>;
      listener(custom.detail);
    };
    window.addEventListener(PREFILL_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(PREFILL_EVENT, handler as EventListener);
    };
  }, [listener]);
}
