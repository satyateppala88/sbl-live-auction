import { createFileRoute, Link } from "@tanstack/react-router";
import { HoloCard } from "@/components/HoloCard";
import { RosterSlots } from "@/components/RosterSlots";
import { ShuttleIcon } from "@/components/ShuttleIcon";
import { CountUp } from "@/components/CountUp";
import { TeamCrest } from "@/components/TeamCrest";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ChatPanel } from "@/components/ChatPanel";
import { AuctionMomentOverlay, useAuctionMoment } from "@/components/AuctionMoment";
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
  const moment = useAuctionMoment(players, teams);
  const amount = leading ? Number(leading.amount) : Number(player?.base_price ?? 0);

  return (
    <main className="arena-bg court-lines min-h-screen px-4 py-6">
      <div className="court-lines-layer" aria-hidden />
      <AuctionMomentOverlay moment={moment} />

      <div className="mx-auto max-w-7xl">
        <header className="flex items-center gap-3">
          <ShuttleIcon className="text-shuttle h-6 w-6" />
          <h1 className="font-display text-2xl uppercase tracking-tight">
            <span className="text-gold">SBL</span> Live Auction
          </h1>
          <span className="border-smash/60 text-smash animate-live-pulse rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest">
            ● Live
          </span>
          <Link to="/" className="ml-auto text-xs text-muted-foreground underline">
            Home
          </Link>
        </header>

        <section
          className={`mt-5 rounded-2xl border bg-card/90 p-5 backdrop-blur ${
            player && state?.bidding_open ? "smash-card border-accent/40" : "glow-card border-border"
          }`}
        >
          {player ? (
            <div
              key={player.id}
              className="animate-block-in grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center"
            >
              <HoloCard
                name={player.name}
                photoUrl={player.photo_url}
                className="h-40 w-40 text-5xl sm:h-48 sm:w-48"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-smash text-xs font-bold uppercase tracking-widest">
                    {state?.round_type === "unsold" ? "Second round" : "On the block"}
                  </p>
                  <CountdownTimer state={state} size="sm" />
                </div>
                <h2 className="font-display text-5xl uppercase leading-none sm:text-7xl">
                  {player.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {CATEGORY_LABEL[player.category]} ·{" "}
                  {tiers.find((t) => t.id === player.tier_id)?.label ?? "No tier"} · base{" "}
                  {Number(player.base_price)} pts
                </p>
                <div key={leading?.id ?? "none"} className="animate-bid-pop mt-4 origin-left">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Current bid
                  </p>
                  <p className="text-gold font-display text-7xl tabular-nums sm:text-8xl">
                    <CountUp value={amount} />
                  </p>
                  <p
                    className="mt-1 flex items-center gap-2 text-lg font-bold"
                    style={leadingTeam ? { color: leadingTeam.color } : undefined}
                  >
                    {leadingTeam && <TeamCrest team={leadingTeam} size={24} />}
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

        <div className="court-divider mt-8" aria-hidden />

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {teams.map((t) => (
              <div
                key={t.id}
                className="lift-card rounded-2xl border border-border bg-card/85 p-4 backdrop-blur hover:[transform:translateY(-2px)]"
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                  <TeamCrest team={t} size={48} />
                  <span className="font-display min-w-0 truncate text-xl uppercase">{t.name}</span>
                  <span className="flex items-baseline gap-1">
                    <span className="text-gold font-display text-2xl tabular-nums">
                      <CountUp value={Number(t.remaining_budget)} />
                    </span>
                    <span className="text-xs text-muted-foreground">pts left</span>
                  </span>
                </div>

                <div className="mt-4">
                  <RosterSlots team={t} players={players} size="sm" />
                </div>
              </div>
            ))}
            {teams.length === 0 && (
              <p className="text-sm text-muted-foreground">No teams registered yet.</p>
            )}
          </div>
          <ChatPanel className="lg:sticky lg:top-4 lg:self-start" />
        </section>
      </div>
    </main>
  );
}
