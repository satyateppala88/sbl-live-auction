import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, ShieldOff } from "lucide-react";
import {
  getChatDeviceId,
  getChatDisplayName,
  setChatDisplayName,
  useChatMessages,
} from "@/lib/auction-data";
import { sendChat, deleteChat } from "@/lib/auction.functions";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Floating chat launcher (bottom-right). Opening it requires a display name first
 * (mandatory) before any messages can be read/sent. Admin passes adminPasscode to get
 * per-message delete. `banned` locks the composer for kicked devices.
 */
export function ChatPopup({
  adminPasscode,
  banned = false,
}: {
  adminPasscode?: string;
  banned?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [hasName, setHasName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { messages, loading } = useChatMessages();
  const listRef = useRef<HTMLDivElement>(null);
  const deviceId = useRef("");

  useEffect(() => {
    deviceId.current = getChatDeviceId();
    const saved = getChatDisplayName();
    if (saved) {
      setName(saved);
      setNameDraft(saved);
      setHasName(true);
    }
  }, []);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, open, hasName]);

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    const n = nameDraft.trim();
    if (n.length < 2) {
      setError("Please enter your name (2+ characters)");
      return;
    }
    setChatDisplayName(n);
    setName(n);
    setHasName(true);
    setError(null);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const msg = draft.trim();
    if (!msg) return;
    setSending(true);
    setError(null);
    try {
      await sendChat({ data: { displayName: name, message: msg, deviceId: deviceId.current } });
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!adminPasscode) return;
    try {
      await deleteChat({ data: { passcode: adminPasscode, id } });
    } catch {
      /* admin can retry */
    }
  }

  const unread = messages.length;

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      {open && (
        <div className="mb-2 flex h-[26rem] w-[min(92vw,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-2 border-b border-border bg-gradient-to-r from-accent/20 to-transparent px-4 py-2.5">
            <span className="animate-energy-pulse h-2 w-2 rounded-full bg-accent" />
            <span className="font-display text-sm uppercase tracking-wide">Live chat</span>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-muted-foreground hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!hasName ? (
            <form onSubmit={saveName} className="flex flex-1 flex-col justify-center gap-3 p-6">
              <p className="text-center text-sm text-muted-foreground">
                Enter your name to join the conversation.
              </p>
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Your name"
                maxLength={40}
                className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
              />
              {error && <p className="text-center text-xs text-smash">{error}</p>}
              <button
                type="submit"
                className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition active:scale-95"
              >
                Join chat
              </button>
            </form>
          ) : (
            <>
              <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {loading && <p className="text-xs text-muted-foreground">Loading…</p>}
                {!loading && messages.length === 0 && (
                  <p className="text-xs text-muted-foreground">No messages yet. Say hi 👋</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className="group flex items-start gap-1.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-gold-solid">{m.display_name}</span>{" "}
                      <span className="text-[10px] text-muted-foreground">
                        {timeLabel(m.created_at)}
                      </span>
                      <p className="break-words text-foreground/90">{m.message}</p>
                    </div>
                    {adminPasscode && (
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        className="hidden shrink-0 text-[10px] text-muted-foreground underline group-hover:block"
                      >
                        delete
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {banned ? (
                <div className="flex items-center gap-2 border-t border-border bg-smash/10 px-4 py-3 text-xs text-smash">
                  <ShieldOff className="h-4 w-4 shrink-0" />
                  You were removed from the chat by the organizer.
                </div>
              ) : (
                <form onSubmit={send} className="border-t border-border p-3">
                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={`Message as ${name}…`}
                      maxLength={200}
                      className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition active:scale-95 disabled:opacity-50"
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  {error && <p className="mt-1.5 text-xs text-smash">{error}</p>}
                </form>
              )}
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="lift-card flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition hover:[transform:translateY(-2px)] active:scale-95"
        aria-label="Open live chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-smash px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
