import { useEffect, useRef, useState } from "react";
import {
  getChatDeviceId,
  getChatDisplayName,
  setChatDisplayName,
  useChatMessages,
} from "@/lib/auction-data";
import { sendChat, deleteChat } from "@/lib/auction.functions";
import { cn } from "@/lib/utils";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Live chat, scoped to its own realtime channel (see useChatMessages) so a burst of
 * messages doesn't force a refetch of the whole auction state. Guardrails: display
 * name required once (kept in localStorage), 200 char cap, basic blocklist + 2s
 * per-device rate limit enforced server-side, admin-only delete when adminPasscode
 * is supplied.
 */
export function ChatPanel({
  className,
  adminPasscode,
}: {
  className?: string;
  adminPasscode?: string;
}) {
  const { messages, loading } = useChatMessages();
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const deviceId = useRef<string>("");

  useEffect(() => {
    setName(getChatDisplayName());
    deviceId.current = getChatDeviceId();
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedMsg = draft.trim();
    if (!trimmedName) {
      setError("Pick a display name first");
      return;
    }
    if (!trimmedMsg) return;
    setSending(true);
    try {
      setChatDisplayName(trimmedName);
      await sendChat({
        data: { displayName: trimmedName, message: trimmedMsg, deviceId: deviceId.current },
      });
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!adminPasscode) return;
    try {
      await deleteChat({ data: { passcode: adminPasscode, id } });
    } catch {
      // silent -- admin can retry
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card/85 backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="font-display text-sm uppercase tracking-wide text-muted-foreground">
          Live chat
        </span>
        <span
          className="animate-live-pulse ml-auto h-1.5 w-1.5 rounded-full bg-accent"
          aria-hidden
        />
      </div>

      <div
        ref={listRef}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
        style={{ maxHeight: 260 }}
      >
        {loading && <p className="text-xs text-muted-foreground">Loading chat…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-xs text-muted-foreground">No messages yet. Say hi 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="group flex items-start gap-1.5 text-sm">
            <div className="min-w-0 flex-1">
              <span className="font-bold text-gold-solid">{m.display_name}</span>{" "}
              <span className="text-[10px] text-muted-foreground">{timeLabel(m.created_at)}</span>
              <p className="break-words text-foreground/90">{m.message}</p>
            </div>
            {adminPasscode && (
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                className="hidden shrink-0 text-[10px] text-muted-foreground underline group-hover:block"
              >
                delete
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="border-t border-border p-3">
        {!getChatDisplayName() && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        )}
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Say something…"
            maxLength={200}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-smash">{error}</p>}
      </form>
    </div>
  );
}
