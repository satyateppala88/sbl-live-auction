import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Users, Tv, ArrowRight } from "lucide-react";
import { useAuctionData } from "@/lib/auction-data";
import { ShuttleIcon } from "@/components/ShuttleIcon";
import { PlayerSilhouette } from "@/components/PlayerSilhouette";
import { StarEmblem } from "@/components/StarEmblem";
import { RulesButton } from "@/components/RulesDialog";
import { CountUp } from "@/components/CountUp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SBL Live Auction — SMR Vinay Galaxy Badminton League" },
      {
        name: "description",
        content:
          "SMR Vinay Galaxy presents the SBL player auction: captains bid live from their phones, the organizer runs the block in real time.",
      },
      { property: "og:title", content: "SBL Live Auction — SMR Vinay Galaxy" },
      {
        property: "og:description",
        content: "Where Stars Come to Live — the SMR Badminton League live player auction.",
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
    <main className="arena-bg star-field relative min-h-screen overflow-hidden px-4 py-10 lg:flex lg:min-h-screen lg:items-center lg:py-0">
      <div className="star-field-layer" aria-hidden />
      <div className="absolute right-4 top-4 z-10">
        <RulesButton />
      </div>
      <span
        className="shooting-star animate-shooting-star"
        style={{ top: "12%", left: "78%" }}
        aria-hidden
      />
      <span
        className="shooting-star animate-shooting-star"
        style={{ top: "34%", left: "58%", animationDelay: "3.4s" }}
        aria-hidden
      />
      {/* a shuttle streaking across at speed -- badminton velocity */}
      <ShuttleIcon
        className="animate-shuttle-zip text-shuttle/70 pointer-events-none absolute left-[8%] top-[46%] hidden h-10 w-10 lg:block"
      />

      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8">
        {/* ---------- left: identity + CTAs ---------- */}
        <div className="text-center lg:text-left">
          <div className="animate-shuttle-arc mx-auto flex w-fit items-center gap-2 rounded-full border border-star/40 bg-card/60 px-4 py-1.5 backdrop-blur lg:mx-0">
            <StarEmblem className="text-star h-3.5 w-3.5" glow />
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-gold-solid">
              SMR Vinay Galaxy
            </p>
          </div>

          <p className="font-display animate-rise-in stagger-1 mt-5 text-xl italic text-muted-foreground sm:text-2xl">
            "Where Stars Come to Live"
          </p>

          <h1 className="font-display animate-rise-in stagger-1 mt-2 text-6xl font-extrabold uppercase leading-[0.85] tracking-tight sm:text-7xl lg:text-8xl">
            <span className="text-sweep">SBL Live</span>
            <br />
            Auction
          </h1>

          <p className="animate-rise-in stagger-2 mx-auto mt-4 max-w-md text-sm text-muted-foreground lg:mx-0">
            Ten teams. Two captains each. One block. Watch the SMR Badminton
            League squads take shape as captains bid live for every player.
          </p>

          <p className="animate-rise-in stagger-2 text-gold-solid mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.28em] lg:justify-start">
            <StarEmblem className="text-star h-3 w-3" />
            Chase the Shuttle · Reach the Stars
            <StarEmblem className="text-star h-3 w-3" />
          </p>

          <div className="animate-rise-in stagger-2 mx-auto mt-7 grid max-w-md grid-cols-3 gap-3 lg:mx-0">
            <HeroStat icon={<Users className="h-4 w-4" />} value={teams.length} label="Teams" />
            <HeroStat
              icon={<ShuttleIcon className="h-4 w-4" />}
              value={players.length}
              label="Players"
            />
            <HeroStat icon={<Gavel className="h-4 w-4" />} value={sold} label="Sold" gold />
          </div>

          <div className="court-divider mx-auto mt-10 max-w-md lg:mx-0" aria-hidden />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <RoleCard
              to="/captain"
              icon={<Users className="h-6 w-6" />}
              tone="primary"
              stagger="stagger-1"
              title="I'm a Captain"
              blurb="Pick your team, enter your PIN and bid live."
            />
            <RoleCard
              to="/admin"
              icon={<Gavel className="h-6 w-6" />}
              tone="accent"
              stagger="stagger-2"
              title="Organizer"
              blurb="Run the block, mark sold or unsold."
            />
            <RoleCard
              to="/watch"
              icon={<Tv className="h-6 w-6" />}
              tone="gold"
              stagger="stagger-3"
              title="Watch Live"
              blurb="Spectator broadcast, no login needed."
              live
            />
          </div>
        </div>

        {/* ---------- right: the "player planet" ---------- */}
        <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
          <div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: "var(--shadow-glow)" }}
          />
          <div className="arena-bg court-lines absolute inset-4 overflow-hidden rounded-full border border-gold-solid/25">
            <div className="court-lines-layer" aria-hidden />
            <StarEmblem className="animate-spin-slow text-star/15 absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2" />
            <PlayerSilhouette className="text-gold-solid/90 absolute bottom-0 left-1/2 h-[85%] w-[85%] -translate-x-1/2" />
          </div>

          {/* orbiting stars -- teams, circling the league */}
          <span className="absolute left-1/2 top-1/2 h-0 w-0" aria-hidden>
            <span
              className="animate-orbit absolute -ml-1.5 -mt-1.5 h-3 w-3 rounded-full bg-gold-solid"
              style={
                {
                  "--orbit-r": "220px",
                  "--orbit-duration": "16s",
                  boxShadow: "0 0 10px 2px oklch(0.83 0.16 85 / 0.6)",
                } as React.CSSProperties
              }
            />
          </span>
          <span className="absolute left-1/2 top-1/2 h-0 w-0" aria-hidden>
            <span
              className="animate-orbit absolute -ml-1 -mt-1 h-2 w-2 rounded-full bg-shuttle"
              style={
                {
                  "--orbit-r": "175px",
                  "--orbit-duration": "11s",
                  animationDirection: "reverse",
                  boxShadow: "0 0 8px 2px oklch(0.97 0.015 95 / 0.5)",
                } as React.CSSProperties
              }
            />
          </span>
          <span className="absolute left-1/2 top-1/2 h-0 w-0" aria-hidden>
            <span
              className="animate-orbit absolute -ml-1 -mt-1 h-1.5 w-1.5 rounded-full bg-smash"
              style={
                { "--orbit-r": "255px", "--orbit-duration": "22s" } as React.CSSProperties
              }
            />
          </span>
        </div>
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
    <div className="rounded-2xl border border-border bg-card/70 px-2 py-3 backdrop-blur">
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

const TONE_CLASSES = {
  primary: {
    badge: "bg-primary/15 text-primary group-hover:bg-primary/25",
    border: "hover:border-primary",
    glow: "hover:[box-shadow:var(--shadow-glow)]",
  },
  accent: {
    badge: "bg-accent/15 text-accent group-hover:bg-accent/25",
    border: "hover:border-accent",
    glow: "hover:[box-shadow:var(--shadow-smash)]",
  },
  gold: {
    badge: "bg-gold-solid/15 text-gold-solid group-hover:bg-gold-solid/25",
    border: "hover:border-gold-solid",
    glow: "hover:[box-shadow:var(--shadow-glow)]",
  },
} as const;

function RoleCard({
  to,
  icon,
  tone,
  stagger,
  title,
  blurb,
  live,
}: {
  to: string;
  icon: React.ReactNode;
  tone: keyof typeof TONE_CLASSES;
  stagger: string;
  title: string;
  blurb: string;
  live?: boolean;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <Link
      to={to}
      className={`lift-card animate-rise-in ${stagger} group relative overflow-hidden rounded-[2rem] border border-border bg-card/80 p-6 text-left backdrop-blur hover:[transform:translateY(-4px)] ${t.border} ${t.glow}`}
    >
      <ShuttleIcon className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rotate-12 text-foreground/[0.04] transition-transform duration-300 group-hover:rotate-45" />
      <div className="relative flex items-center justify-between">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 group-hover:-rotate-12 ${t.badge}`}
        >
          {icon}
        </span>
        {live ? (
          <span className="text-smash flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest">
            <span className="animate-energy-pulse h-2 w-2 rounded-full bg-smash" />
            Live
          </span>
        ) : (
          <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
        )}
      </div>
      <h2 className="font-display relative mt-4 text-2xl uppercase">{title}</h2>
      <p className="relative mt-1 text-sm text-muted-foreground">{blurb}</p>
    </Link>
  );
}
