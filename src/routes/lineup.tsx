import { createFileRoute } from "@tanstack/react-router";
import { useAuctionData, type Cat } from "@/lib/auction-data";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { TierRating } from "@/components/TierRating";
import { StarEmblem } from "@/components/StarEmblem";

export const Route = createFileRoute("/lineup")({
  head: () => ({
    meta: [
      { title: "The Line-up — SBL Live Auction" },
      { name: "description", content: "Team captains and all 40 players up for auction in the SMR Badminton League." },
    ],
  }),
  ssr: false,
  component: LineupPage,
});

const CATS: { c: Cat; label: string }[] = [
  { c: "male", label: "Men" },
  { c: "female", label: "Women" },
  { c: "kid", label: "Kids" },
];

function LineupPage() {
  const { teams, players, tiers } = useAuctionData();
  const tierLabel = (id: string | null) => tiers.find((t) => t.id === id)?.label;

  return (
    <main className="arena-bg star-field min-h-screen px-4 py-8">
      <div className="star-field-layer" aria-hidden />
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <StarEmblem className="text-star mx-auto h-14 w-14" glow />
          <h1 className="font-display mt-2 text-4xl uppercase leading-none sm:text-5xl">
            <span className="text-gold">SBL</span> Live Auction
          </h1>
          <p className="text-gold-solid mt-3 text-xl font-bold">Sunday 30 Aug · 4:30 PM IST</p>
          <p className="mt-1 text-sm text-muted-foreground">
            SMR Vinay Galaxy · tonight's line-up
          </p>
        </header>

        <section className="mt-9">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-gold text-xl uppercase tracking-widest">Team Captains</h2>
            <span className="h-px flex-1 bg-gold-solid/30" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {teams.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border bg-card/70 p-3 text-center"
                style={{ borderColor: `${t.color}55` }}
              >
                <PlayerAvatar
                  name={t.captain_name || "Captain"}
                  photoUrl={t.captain_photo_url}
                  className="mx-auto aspect-square w-full rounded-xl text-2xl"
                />
                <p className="mt-2 truncate text-sm font-semibold">{t.captain_name}</p>
                <p className="truncate text-[11px] font-bold uppercase" style={{ color: t.color }}>
                  {t.name}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-9">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-gold text-xl uppercase tracking-widest">
              Up for Auction · {players.length} Players
            </h2>
            <span className="h-px flex-1 bg-gold-solid/30" />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Rating: 3 shuttles Icon · 2 Challenger · 1 Game Changer
          </p>
          {CATS.map(({ c, label }) => {
            const list = players.filter((p) => p.category === c);
            if (list.length === 0) return null;
            return (
              <div key={c} className="mt-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {label} · {list.length}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {list.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-border bg-card/70 p-3 text-center">
                      <PlayerAvatar
                        name={p.name}
                        photoUrl={p.photo_url}
                        className="mx-auto aspect-square w-full rounded-xl text-2xl"
                      />
                      <p className="mt-2 truncate text-sm font-semibold">{p.name}</p>
                      <div className="mt-1 flex justify-center">
                        <TierRating tier={tierLabel(p.tier_id)} size="h-3 w-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-9 rounded-2xl border border-gold-solid/40 bg-card/70 p-5 text-center">
          <p className="text-lg font-bold">
            Come cheer them on — <span className="text-gold-solid">LIVE at the Clubhouse</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Today · 4:30 PM IST · SMR Vinay Galaxy</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Can't make it? Watch at <span className="text-gold-solid">sblauctionhub.live/watch</span>
          </p>
        </section>

        <p className="text-gold-solid mt-6 text-center text-xs font-bold uppercase tracking-[0.3em]">
          ★ Chase the Shuttle · Reach the Stars ★
        </p>
      </div>
    </main>
  );
}
