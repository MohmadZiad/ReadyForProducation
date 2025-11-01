import * as React from "react";
import { useAssistant } from "@/lib/useAssistant";

export default function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const { messages, send, busy } = useAssistant();

  const onSend = () => {
    if (!input.trim()) return;
    const txt = input;
    setInput("");
    send(txt);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 h-96 rounded-2xl border bg-white shadow-xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b font-semibold">Chat</div>
          <div className="flex-1 p-3 space-y-2 overflow-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm p-2 rounded-xl whitespace-pre-wrap ${
                  m.role === "user" ? "bg-orange-100 ml-auto" : "bg-gray-100"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && <div className="text-xs text-gray-500">…</div>}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              className="flex-1 rounded-xl border px-3 py-2 text-sm"
              placeholder="Type a message"
              disabled={busy}
            />
            <button
              onClick={onSend}
              disabled={busy}
              className="rounded-xl bg-orange-500 text-white px-4 py-2 text-sm disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-orange-500 text-white px-5 py-3 shadow-lg"
      >
        {open ? "×" : "Chat"}
      </button>
    </div>
  );
}
