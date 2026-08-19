import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Users, Tv } from "lucide-react";
import { useAuctionData, rosterOf } from "@/lib/auction-data";
import { ShuttleIcon } from "@/components/ShuttleIcon";
import { CountUp } from "@/components/CountUp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SBL Live Auction — SMR Badminton League Player Auction" },
      {
        name: "description",
        content:
          "Run the SMR Badminton League player auction live: captains bid from their phones, the organizer controls the block in real time.",
      },
      { property: "og:title", content: "SBL Live Auction" },
      {
        property: "og:description",
        content: "Live IPL-style player auction for the SMR Badminton League.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { teams, players } = useAuctionData();
  const sold = players.filter((p) => p.status === "sold").length;

  return (
    <main className="arena-bg court-lines min-h-screen overflow-hidden px-4 py-12">
      <div className="court-lines-layer" aria-hidden />

      <div className="mx-auto max-w-3xl text-center">
        <div className="animate-shuttle-arc mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 backdrop-blur">
          <ShuttleIcon className="text-shuttle h-4 w-4" />
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-muted-foreground">
            SMR Badminton League
          </p>
        </div>

        <div className="relative mt-6">
          <ShuttleIcon className="animate-shuttle-float text-shuttle/15 pointer-events-none absolute -right-2 -top-10 hidden h-40 w-40 sm:block" />
          <h1 className="font-display animate-rise-in text-6xl font-extrabold uppercase leading-[0.85] tracking-tight sm:text-8xl">
            <span className="text-gold">SBL Live</span>
            <br />
            Auction
          </h1>
        </div>

        <div className="animate-rise-in stagger-1 mt-7 grid grid-cols-3 gap-3">
          <HeroStat icon={<Users className="h-4 w-4" />} value={teams.length} label="Teams" />
          <HeroStat
            icon={<ShuttleIcon className="h-4 w-4" />}
            value={players.length}
            label="Players"
          />
          <HeroStat icon={<Gavel className="h-4 w-4" />} value={sold} label="Sold" gold />
        </div>

        <div className="court-divider mx-auto mt-10 max-w-md" aria-hidden />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/captain"
            className="lift-card animate-rise-in stagger-1 group rounded-2xl border border-border bg-card/80 p-6 text-left backdrop-blur hover:border-primary hover:[transform:translateY(-4px)] hover:[box-shadow:var(--shadow-glow)]"
          >
            <Users className="h-7 w-7 text-primary transition-transform duration-200 group-hover:scale-110" />
            <h2 className="font-display mt-3 text-2xl uppercase">I'm a Captain</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick your team, enter your PIN and bid live from your phone.
            </p>
          </Link>
          <Link
            to="/admin"
            className="lift-card animate-rise-in stagger-2 group rounded-2xl border border-border bg-card/80 p-6 text-left backdrop-blur hover:border-accent hover:[transform:translateY(-4px)] hover:[box-shadow:var(--shadow-smash)]"
          >
            <Gavel className="h-7 w-7 text-accent transition-transform duration-200 group-hover:scale-110" />
            <h2 className="font-display mt-3 text-2xl uppercase">Organizer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up teams and players, run the block, mark sold or unsold.
            </p>
          </Link>
          <Link
            to="/watch"
            className="lift-card animate-rise-in stagger-3 group rounded-2xl border border-border bg-card/80 p-6 text-left backdrop-blur hover:border-primary hover:[transform:translateY(-4px)] hover:[box-shadow:var(--shadow-glow)] sm:col-span-2"
          >
            <div className="flex items-center gap-3">
              <Tv className="text-gold-solid h-7 w-7 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-smash animate-live-pulse text-[11px] font-bold uppercase tracking-widest">
                ● Live
              </span>
            </div>
            <h2 className="font-display mt-3 text-2xl uppercase">Watch live</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Spectator broadcast — current player, live bids and every squad filling up. No login.
            </p>
          </Link>
        </div>

        {teams.length > 0 && (
          <div className="animate-rise-in stagger-4 mt-10 grid gap-2 text-left">
            {teams.map((t) => {
              const roster = rosterOf(players, t.id);
              return (
                <div
                  key={t.id}
                  className="lift-card flex items-center gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 hover:[transform:translateY(-2px)]"
                >
                  <span
                    className="h-8 w-1.5 rounded-full"
                    style={{ backgroundColor: t.color }}
                    aria-hidden
                  />
                  <span className="flex-1 font-semibold">{t.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {roster.length}/{t.max_roster_size} players
                  </span>
                  <span className="text-gold-solid font-mono font-bold">
                    {Number(t.remaining_budget)} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function HeroStat({
  icon,
  value,
  label,
  gold,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  gold?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/70 px-2 py-3 backdrop-blur">
      <span className="flex items-center justify-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </span>
      <p
        className={`font-display mt-1 text-3xl tabular-nums ${gold ? "text-gold-solid" : "text-foreground"}`}
      >
        <CountUp value={value} duration={600} />
      </p>
    </div>
  );
}
