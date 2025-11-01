import * as React from "react";

export type ChatMsg = {
  role: "user" | "assistant" | "system";
  content: string;
};

export function useAssistant() {
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [busy, setBusy] = React.useState(false);

  const send = async (content: string) => {
    const next: ChatMsg[] = [...messages, { role: "user", content }];

    // system nudge: مختصر + روابط Markdown
    const styleSystem: ChatMsg = {
      role: "system",
      content:
        "Answer in the user's language. Keep it to 1–3 lines. Use Markdown links [Label](URL). Be direct and actionable.",
    };

    setMessages(next);
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [styleSystem, ...next] }),
      });
      const data = await r.json();
      const text = data?.choices?.[0]?.message?.content ?? "…";
      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: e?.message || "Unable to reach chat service.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return { messages, send, busy };
}
