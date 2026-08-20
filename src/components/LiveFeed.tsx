/**
 * Converts common YouTube URL shapes (watch, youtu.be, /live/, /embed/, /shorts/,
 * channel /live) into an embeddable URL. Returns null if we can't recognise it.
 */
export function toYouTubeEmbed(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") {
        const v = u.searchParams.get("v");
        return v ? `https://www.youtube.com/embed/${v}` : null;
      }
      const m = u.pathname.match(/^\/(live|embed|shorts)\/([^/?]+)/);
      if (m) return `https://www.youtube.com/embed/${m[2]}`;
      const ch = u.pathname.match(/^\/channel\/([^/]+)\/live/);
      if (ch) return `https://www.youtube.com/embed/live_stream?channel=${ch[1]}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * The live camera feed shown to spectators. Renders the organizer's YouTube Live stream
 * (autoplaying, muted so browsers allow it — viewers can unmute). Falls back to a note
 * if the URL can't be turned into an embed.
 */
export function LiveFeed({ url }: { url: string }) {
  const embed = toYouTubeEmbed(url);
  const src = embed
    ? `${embed}${embed.includes("?") ? "&" : "?"}autoplay=1&mute=1&playsinline=1`
    : null;

  return (
    <div className="relative aspect-video max-h-[42vh] w-full shrink-0 overflow-hidden rounded-2xl border border-border bg-black">
      <span className="border-smash/60 text-smash absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-full border bg-background/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur">
        <span className="animate-energy-pulse h-1.5 w-1.5 rounded-full bg-smash" />
        Live from the room
      </span>
      {src ? (
        <iframe
          src={src}
          title="Live camera feed"
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
          Couldn't load the live feed link. Paste a YouTube Live URL (youtube.com/live/… or
          youtube.com/watch?v=…).
        </div>
      )}
    </div>
  );
}
