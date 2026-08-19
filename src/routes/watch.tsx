import { createFileRoute, Link } from "@tanstack/react-router";
import { HoloCard } from "@/components/HoloCard";
import { CountUp } from "@/components/CountUp";
import { TeamCrest } from "@/components/TeamCrest";
import { CountdownTimer } from "@/components/CountdownTimer";
import { ChatPopup } from "@/components/ChatPopup";
import { ViewerCount } from "@/components/ViewerCount";
import { StarEmblem } from "@/components/StarEmblem";
import { AuctionMomentOverlay, useAuctionMoment } from "@/components/AuctionMoment";
import {
  useAuctionData,
  usePresence,
  topBid,
  rosterOf,
  categoryCounts,
  getChatDisplayName,
  CATEGORY_LABEL,
  type Player,
  type Team,
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

function RosterPips({ team, players }: { team: Team; players: Player[] }) {
  const roster = rosterOf(players, team.id);
  const filled = roster.length;
  const empty = Math.max(0, team.max_roster_size - filled);
  return (
    <div className="flex items-center gap-1">
      <span
        className="h-2.5 w-2.5 rounded-full ring-1 ring-white/20"
        style={{ backgroundColor: team.color }}
        title="Captain"
      />
      {Array.from({ length: filled }).map((_, i) => (
        <span key={`f${i}`} className="bg-gold-solid h-2.5 w-2.5 rounded-full" />
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} className="h-2.5 w-2.5 rounded-full border border-border" />
      ))}
    </div>
  );
}

function WatchPage() {
  const { teams, players, tiers, bids, state, loading } = useAuctionData();
  const { count, banned } = usePresence("watcher", getChatDisplayName());
  const player = players.find((p) => p.id === state?.current_player_id) ?? null;
  const leading = topBid(bids, player?.id);
  const leadingTeam = teams.find((t) => t.id === leading?.team_id);
  const moment = useAuctionMoment(players, teams);
  const amount = leading ? Number(leading.amount) : Number(player?.base_price ?? 0);

  return (
    <main className="arena-bg court-lines flex h-[100dvh] flex-col overflow-hidden px-3 py-3 lg:px-5">
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
        <div className="ml-auto flex items-center gap-3">
          <ViewerCount count={count} />
          <Link to="/" className="text-xs text-muted-foreground underline">
            Home
          </Link>
        </div>
      </header>

      <div className="mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ---------- on the block ---------- */}
        <section
          className={`flex min-h-0 flex-col rounded-2xl border bg-card/90 p-4 backdrop-blur lg:p-5 ${
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
                  className="h-24 w-24 shrink-0 text-3xl sm:h-32 sm:w-32"
                />
                <div className="min-w-0">
                  <h2 className="font-display truncate text-4xl uppercase leading-none sm:text-5xl">
                    {player.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {CATEGORY_LABEL[player.category]} ·{" "}
                    {tiers.find((t) => t.id === player.tier_id)?.label ?? "No tier"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    base {Number(player.base_price)} pts
                  </p>
                </div>
              </div>

              <div key={leading?.id ?? "none"} className="animate-bid-pop mt-auto origin-left">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Current bid
                </p>
                <p className="text-gold font-display text-7xl leading-none tabular-nums sm:text-8xl">
                  <CountUp value={amount} />
                </p>
                <p
                  className="mt-1 flex items-center gap-2 text-lg font-bold"
                  style={leadingTeam ? { color: leadingTeam.color } : undefined}
                >
                  {leadingTeam && <TeamCrest team={leadingTeam} size={22} />}
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

        {/* ---------- teams board ---------- */}
        <section className="grid min-h-0 grid-cols-1 gap-2 overflow-hidden sm:grid-cols-2 sm:grid-rows-5">
          {teams.map((t) => {
            const c = categoryCounts(rosterOf(players, t.id));
            return (
              <div
                key={t.id}
                className="lift-card flex items-center gap-2.5 rounded-xl border border-border bg-card/85 px-3 py-2 backdrop-blur"
              >
                <TeamCrest team={t} size={38} />
                <div className="min-w-0 flex-1">
                  <span className="font-display block truncate text-sm uppercase leading-tight">
                    {t.name}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <RosterPips team={t} players={players} />
                    <span className="text-[10px] text-muted-foreground">
                      {c.male}M {c.female}F {c.kid}K
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gold font-display block text-xl leading-none tabular-nums">
                    <CountUp value={Number(t.remaining_budget)} />
                  </span>
                  <span className="text-[10px] text-muted-foreground">pts left</span>
                </div>
              </div>
            );
          })}
          {teams.length === 0 && (
            <p className="text-sm text-muted-foreground">No teams registered yet.</p>
          )}
        </section>
      </div>

      <ChatPopup banned={banned} />
    </main>
  );
}
