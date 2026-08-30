import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuctionData, type Cat, type Player } from "@/lib/auction-data";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { TeamCrest } from "@/components/TeamCrest";
import { StarEmblem } from "@/components/StarEmblem";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Auction Results — SBL Live Auction" },
      { name: "description", content: "Final results, biggest buys and top spenders from the SMR Badminton League auction." },
    ],
  }),
  ssr: false,
  component: ResultsPage,
});

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 px-3 py-4 text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-gold-solid font-display text-3xl tabular-nums sm:text-4xl">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 flex items-center gap-3">
      <h2 className="font-display text-gold text-xl uppercase tracking-widest">{children}</h2>
      <span className="h-px flex-1 bg-gold-solid/30" />
    </div>
  );
}

function ResultsPage() {
  const { teams, players } = useAuctionData();
  const sold = players.filter(
    (p) => p.status === "sold" && p.sold_to_team_id && p.sold_price !== null,
  );
  const auctionSpend = sold.reduce((s, p) => s + Number(p.sold_price), 0);
  const teamOf = (id: string | null) => teams.find((t) => t.id === id);
  const priceDesc = (a: Player, b: Player) => Number(b.sold_price) - Number(a.sold_price);
  const topBuys = [...sold].sort(priceDesc);
  const catTop = (c: Cat) => [...sold].filter((p) => p.category === c).sort(priceDesc)[0];
  const board = teams
    .map((t) => ({ t, total: Number(t.base_budget) - Number(t.remaining_budget) }))
    .sort((a, b) => b.total - a.total);
  const rosterOf = (tid: string) => sold.filter((p) => p.sold_to_team_id === tid).sort(priceDesc);

  const cats: { c: Cat; label: string }[] = [
    { c: "male", label: "Top Man" },
    { c: "female", label: "Top Woman" },
    { c: "kid", label: "Top Kid" },
  ];

  return (
    <main className="arena-bg star-field min-h-screen px-4 py-8">
      <div className="star-field-layer" aria-hidden />
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <StarEmblem className="text-star mx-auto h-14 w-14" glow />
          <p className="text-smash mt-2 text-xs font-bold uppercase tracking-[0.4em]">That's a wrap</p>
          <h1 className="font-display text-4xl uppercase leading-none sm:text-5xl">Auction Results</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            SMR Vinay Galaxy · SBL Live Auction · 30 Aug
          </p>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Points bid" value={auctionSpend} sub="across the block" />
          <Stat label="Players sold" value={sold.length} />
          <Stat label="Squads filled" value={teams.length} sub="all complete" />
          <Stat label="Avg price" value={sold.length ? Math.round(auctionSpend / sold.length) : 0} sub="per player" />
        </div>

        <SectionTitle>Biggest Buys</SectionTitle>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {topBuys.slice(0, 3).map((p, i) => {
            const tm = teamOf(p.sold_to_team_id);
            return (
              <div
                key={p.id}
                className="rounded-2xl border bg-card/70 p-4 text-center"
                style={{ borderColor: `${tm?.color ?? "#888"}66` }}
              >
                <p className="text-gold-solid font-display text-2xl">#{i + 1}</p>
                <PlayerAvatar name={p.name} photoUrl={p.photo_url} className="mx-auto mt-1 h-24 w-24 rounded-xl text-2xl" />
                <p className="mt-2 font-semibold">{p.name}</p>
                <p className="text-xs" style={{ color: tm?.color }}>{tm?.name}</p>
                <p className="text-gold font-display mt-1 text-3xl tabular-nums">{Number(p.sold_price)}</p>
              </div>
            );
          })}
        </div>

        <SectionTitle>Category Top Bids</SectionTitle>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cats.map(({ c, label }) => {
            const p = catTop(c);
            if (!p) return null;
            const tm = teamOf(p.sold_to_team_id);
            return (
              <div key={c} className="rounded-2xl border border-border bg-card/70 p-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                <PlayerAvatar name={p.name} photoUrl={p.photo_url} className="mx-auto mt-2 h-24 w-24 rounded-xl text-2xl" />
                <p className="mt-2 font-semibold">{p.name}</p>
                <p className="text-xs" style={{ color: tm?.color }}>{tm?.name}</p>
                <p className="text-gold font-display mt-1 text-3xl tabular-nums">{Number(p.sold_price)}</p>
              </div>
            );
          })}
        </div>

        <SectionTitle>Spend Leaderboard</SectionTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          Each team's 100 points used — auction spend plus the captain's value.
        </p>
        <div className="mt-3 space-y-2">
          {board.map(({ t, total }, i) => (
            <div key={t.id} className="rounded-xl border border-border bg-card/60 p-2">
              <div className="flex items-center gap-2">
                <span className="w-5 text-center text-sm text-muted-foreground">{i + 1}</span>
                <TeamCrest team={t} size={26} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{t.name}</span>
                <span className="text-gold-solid font-display tabular-nums">
                  {total}
                  <span className="text-xs text-muted-foreground">/100</span>
                </span>
              </div>
              <div className="mt-1.5 ml-7 h-1.5 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full" style={{ width: `${total}%`, backgroundColor: t.color }} />
              </div>
            </div>
          ))}
        </div>

        <SectionTitle>Complete Squads</SectionTitle>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {teams.map((t) => {
            const roster = rosterOf(t.id);
            const spent = Number(t.base_budget) - Number(t.remaining_budget);
            return (
              <div
                key={t.id}
                className="rounded-2xl border bg-card/70 p-4"
                style={{ borderColor: `${t.color}55` }}
              >
                <div className="flex items-center gap-3">
                  <TeamCrest team={t} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate uppercase">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Captain: {t.captain_name} · {spent}/100 spent
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <PlayerAvatar
                      name={t.captain_name || "Captain"}
                      photoUrl={t.captain_photo_url}
                      className="mx-auto aspect-square w-full rounded-lg text-sm"
                      accent={t.color}
                    />
                    <p className="mt-1 truncate text-[10px] font-semibold">{t.captain_name}</p>
                    <p className="text-[9px] font-bold uppercase" style={{ color: t.color }}>Capt</p>
                  </div>
                  {roster.map((p) => (
                    <div key={p.id} className="text-center">
                      <PlayerAvatar name={p.name} photoUrl={p.photo_url} className="mx-auto aspect-square w-full rounded-lg text-sm" />
                      <p className="mt-1 truncate text-[10px] font-semibold">{p.name}</p>
                      <p className="text-gold font-display text-xs tabular-nums">{Number(p.sold_price)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-gold-solid mt-8 text-center text-xs font-bold uppercase tracking-[0.3em]">
          ★ Chase the Shuttle · Reach the Stars ★
        </p>
      </div>
    </main>
  );
}
