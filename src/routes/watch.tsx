import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { RosterSlots } from "@/components/RosterSlots";
import { useAuctionData, topBid, CATEGORY_LABEL } from "@/lib/auction-data";

export const Route = createFileRoute("/watch")({
  head: () => ({
    meta: [
      { title: "Live Auction Broadcast — SBL Live Auction" },
      {
        name: "description",
        content:
          "Watch the SMR Badminton League player auction live: current player on the block, top bid, and every team's squad filling up in real time.",
      },
      { property: "og:title", content: "Live Auction Broadcast — SBL Live Auction" },
      {
        property: "og:description",
        content: "Follow every bid of the SBL player auction live — no login needed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: WatchPage,
});

function WatchPage() {
  const { teams, players, tiers, bids, state, loading } = useAuctionData();
  const player = players.find((p) => p.id === state?.current_player_id) ?? null;
  const leading = topBid(bids, player?.id);
  const leadingTeam = teams.find((t) => t.id === leading?.team_id);

  return (
    <main className="arena-bg min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center gap-3">
          <h1 className="text-xl font-black uppercase tracking-tight">
            <span className="text-gold">SBL</span> Live Auction
          </h1>
          <span className="rounded-full border border-primary/50 px-2 py-0.5 text-[11px] uppercase tracking-widest text-primary">
            Spectator
          </span>
          <Link to="/" className="ml-auto text-xs text-muted-foreground underline">
            Home
          </Link>
        </header>

        <section className="glow-card mt-5 rounded-2xl border border-border bg-card p-5">
          {player ? (
            <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <PlayerAvatar
                name={player.name}
                photoUrl={player.photo_url}
                className="h-40 w-40 text-5xl sm:h-48 sm:w-48"
              />
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {state?.round_type === "unsold" ? "Second round" : "On the block"}
                </p>
                <h2 className="text-4xl font-black uppercase sm:text-6xl">{player.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {CATEGORY_LABEL[player.category]} ·{" "}
                  {tiers.find((t) => t.id === player.tier_id)?.label ?? "No tier"} · base{" "}
                  {Number(player.base_price)} pts
                </p>
                <div key={leading?.id ?? "none"} className="animate-bid-pop mt-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Current bid
                  </p>
                  <p className="text-gold text-7xl font-black tabular-nums sm:text-8xl">
                    {leading ? Number(leading.amount) : Number(player.base_price)}
                  </p>
                  <p
                    className="mt-1 text-lg font-bold"
                    style={leadingTeam ? { color: leadingTeam.color } : undefined}
                  >
                    {leadingTeam ? `${leadingTeam.name} leading` : "No bids yet"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-14 text-center text-muted-foreground">
              {loading ? "Connecting…" : "Waiting for the next player…"}
            </p>
          )}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {teams.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="h-6 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="flex-1 text-lg font-bold">{t.name}</span>
                <span className="text-gold font-mono text-xl font-black tabular-nums">
                  {Number(t.remaining_budget)}
                </span>
                <span className="text-xs text-muted-foreground">pts left</span>
              </div>
              <div className="mt-4">
                <RosterSlots team={t} players={players} size="sm" />
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <p className="text-sm text-muted-foreground">No teams registered yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
