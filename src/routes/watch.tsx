import { createFileRoute, Link } from "@tanstack/react-router";
import { HoloCard } from "@/components/HoloCard";
import { CountUp } from "@/components/CountUp";
import { TeamCrest } from "@/components/TeamCrest";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ChatRoom } from "@/components/ChatRoom";
import { ViewerCount } from "@/components/ViewerCount";
import { StarEmblem } from "@/components/StarEmblem";
import { LiveFeed } from "@/components/LiveFeed";
import { Tv } from "lucide-react";
import { RulesButton } from "@/components/RulesDialog";
import { AuctionMomentOverlay, useAuctionMoment } from "@/components/AuctionMoment";
import {
  useAuctionData,
  usePresence,
  topBid,
  rosterOf,
  categoryCounts,
  getChatDisplayName,
  CATEGORY_LABEL,
} from "@/lib/auction-data";

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
  const { count, banned } = usePresence("watcher", getChatDisplayName());
  const player = players.find((p) => p.id === state?.current_player_id) ?? null;
  const leading = topBid(bids, player?.id);
  const leadingTeam = teams.find((t) => t.id === leading?.team_id);
  const moment = useAuctionMoment(players, teams);
  const amount = leading ? Number(leading.amount) : Number(player?.base_price ?? 0);

  return (
    <main className="arena-bg court-lines flex min-h-[100dvh] flex-col px-3 py-3 lg:h-[100dvh] lg:overflow-hidden lg:px-5">
      <div className="court-lines-layer" aria-hidden />
      <AuctionMomentOverlay moment={moment} />

      <header className="flex shrink-0 items-center gap-3">
        <StarEmblem className="text-star h-6 w-6" glow />
        <h1 className="font-display text-xl uppercase tracking-tight sm:text-2xl">
          <span className="text-gold">SBL</span> Live Auction
        </h1>
        <span className="border-smash/60 text-smash flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest">
          <span className="animate-energy-pulse h-1.5 w-1.5 rounded-full bg-smash" />
          Live
        </span>
        <span className="text-gold-solid hidden text-[11px] font-bold uppercase tracking-[0.28em] lg:block">
          One Community · One Court · One Roar
        </span>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <RulesButton />
          <ViewerCount count={count} />
          <Link to="/" className="text-xs text-muted-foreground underline">
            Home
          </Link>
        </div>
      </header>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2 lg:grid-rows-2">
        {/* top-left: player info */}
        <section
          className={`flex min-h-[15rem] flex-col rounded-2xl border bg-card/90 p-4 backdrop-blur lg:min-h-0 ${
            player && state?.bidding_open ? "smash-card border-accent/40" : "glow-card border-border"
          }`}
        >
          {player ? (
            <div key={player.id} className="animate-block-in flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <p className="text-smash text-xs font-bold uppercase tracking-widest">
                  {state?.round_type === "unsold" ? "Second round" : "On the block"}
                </p>
                <CountdownTimer state={state} size="sm" />
              </div>

              <div className="mt-3 flex items-center gap-4">
                <HoloCard
                  name={player.name}
                  photoUrl={player.photo_url}
                  className="h-20 w-20 shrink-0 text-2xl sm:h-24 sm:w-24"
                />
                <div className="min-w-0">
                  <h2 className="font-display truncate text-3xl uppercase leading-none sm:text-4xl">
                    {player.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CATEGORY_LABEL[player.category]} ·{" "}
                    {tiers.find((t) => t.id === player.tier_id)?.label ?? "No tier"}
                  </p>
                  <p className="text-xs text-muted-foreground">base {Number(player.base_price)} pts</p>
                </div>
              </div>

              <div key={leading?.id ?? "none"} className="animate-bid-pop mt-auto origin-left">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Current bid</p>
                <p className="text-gold font-display text-5xl leading-none tabular-nums sm:text-6xl">
                  <CountUp value={amount} />
                </p>
                <p
                  className="mt-1 flex items-center gap-2 text-base font-bold"
                  style={leadingTeam ? { color: leadingTeam.color } : undefined}
                >
                  {leadingTeam && <TeamCrest team={leadingTeam} size={20} />}
                  {leadingTeam ? `${leadingTeam.name} leading` : "No bids yet"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
              {loading ? "Connecting…" : "Waiting for the next player…"}
            </div>
          )}
        </section>

        {/* top-right: live stream */}
        <section className="flex min-h-[15rem] items-center justify-center overflow-hidden rounded-2xl border border-border bg-black/50 lg:min-h-0">
          {state?.live_stream_url ? (
            <LiveFeed url={state.live_stream_url} />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
              <Tv className="h-8 w-8 opacity-50" />
              <p className="text-sm">Live camera</p>
              <p className="text-xs">The organizer's room feed will appear here once it's on air.</p>
            </div>
          )}
        </section>

        {/* bottom-left: chat room */}
        <ChatRoom banned={banned} className="min-h-[18rem] lg:min-h-0" />

        {/* bottom-right: team details -- all teams fit, no scroll */}
        <section className="flex min-h-[15rem] flex-col overflow-hidden rounded-2xl border border-border bg-card/40 p-2 lg:min-h-0">
          <div className="mb-1.5 flex shrink-0 items-center gap-2 px-1">
            <span className="font-display text-xs uppercase tracking-wide text-muted-foreground">
              Teams & budgets
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground">{teams.length} squads</span>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 lg:auto-rows-fr">
            {teams.map((t) => {
              const roster = rosterOf(players, t.id);
              const c = categoryCounts(roster);
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card/85 px-2 py-1"
                >
                  <TeamCrest team={t} size={26} />
                  <div className="min-w-0 flex-1">
                    <span className="font-display block truncate text-[11px] uppercase leading-tight">
                      {t.name}
                    </span>
                    <span className="block text-[9px] leading-tight text-muted-foreground">
                      {roster.length}/{t.max_roster_size} · {c.male}M {c.female}F {c.kid}K
                    </span>
                  </div>
                  <span className="text-gold font-display shrink-0 text-sm tabular-nums leading-none">
                    <CountUp value={Number(t.remaining_budget)} />
                  </span>
                </div>
              );
            })}
            {teams.length === 0 && (
              <p className="col-span-2 text-sm text-muted-foreground">No teams registered yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
