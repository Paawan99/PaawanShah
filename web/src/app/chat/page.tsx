"use client";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const r = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, chart: null }),
        signal: ctrl.signal,
      });
      if (!r.body) throw new Error("no stream");
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          const delta = data.replace(/\\n/g, "\n");
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              role: "assistant",
              content: copy[copy.length - 1].content + delta,
            };
            return copy;
          });
        }
      }
    } catch (e) {
      // Stream aborted or failed.
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl mb-2">Ask the AI Astrologer</h1>
        <p className="text-cosmic-muted">
          A general astrology chat. For chart-grounded answers, cast a chart
          first and use the interpretation tabs there.
        </p>
      </div>

      <div className="card min-h-[300px] space-y-4">
        {messages.length === 0 && (
          <p className="text-cosmic-muted text-sm">
            Try asking: "What does Saturn's transit through Pisces tend to highlight?"
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "p-3 rounded-md bg-cosmic-mid/60"
                : "p-3 rounded-md border border-cosmic-accent/20"
            }
          >
            <p className="text-xs text-cosmic-muted mb-1">
              {m.role === "user" ? "You" : "Stardust"}
            </p>
            <div className="prose prose-invert max-w-none prose-sm">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about astrology…"
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button onClick={send} className="btn-primary" disabled={streaming}>
          {streaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
