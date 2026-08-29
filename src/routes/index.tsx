import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Users, Tv, ArrowRight } from "lucide-react";
import { useAuctionData } from "@/lib/auction-data";
import { ShuttleIcon } from "@/components/ShuttleIcon";
import { PlayerSilhouette } from "@/components/PlayerSilhouette";
import { StarEmblem } from "@/components/StarEmblem";
import { RulesButton } from "@/components/RulesDialog";
import { CountUp } from "@/components/CountUp";
import { Tilt } from "@/components/Tilt";
import { TeamCrest } from "@/components/TeamCrest";
import { EventCountdown } from "@/components/EventCountdown";
import type { Team } from "@/lib/auction-data";

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
    <main className="arena-bg star-field relative min-h-screen overflow-hidden px-4 pt-16 pb-6 lg:flex lg:min-h-screen lg:items-center lg:pt-16 lg:pb-0">
      <div className="star-field-layer" aria-hidden />
      <div className="grain-overlay" aria-hidden />
      {/* top bar: brand left, countdown + rules right */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 px-4 py-3">
        <div className="hidden items-center gap-2 rounded-full border border-star/40 bg-card/60 px-3 py-1.5 backdrop-blur sm:flex">
          <StarEmblem className="text-star h-3.5 w-3.5" glow />
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-gold-solid">
            SMR Vinay Galaxy
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <EventCountdown compact className="animate-rise-in" />
          <RulesButton />
        </div>
      </header>
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

      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8">
        {/* ---------- left: identity + CTAs ---------- */}
        <div className="text-center lg:text-left">
          <p className="font-display animate-rise-in stagger-1 mt-2 text-xl italic text-muted-foreground sm:text-2xl">
            "Where Stars Come to Live"
          </p>

          <h1 className="font-display animate-rise-in stagger-1 mt-2 text-6xl font-extrabold uppercase leading-[0.85] tracking-tight sm:text-7xl lg:text-8xl">
            <span className="text-sweep">SBL Live</span>
            <br />
            Auction
          </h1>

          <p className="animate-rise-in stagger-2 mx-auto mt-3 max-w-md text-sm text-muted-foreground lg:mx-0">
            Ten teams. One captain each. One block. Watch the SMR Badminton
            League squads take shape as captains bid live for every player.
          </p>

          <p className="animate-rise-in stagger-2 text-gold-solid mt-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.28em] lg:justify-start">
            <StarEmblem className="text-star h-3 w-3" />
            Chase the Shuttle · Reach the Stars
            <StarEmblem className="text-star h-3 w-3" />
          </p>

          <div className="animate-rise-in stagger-2 mx-auto mt-4 grid max-w-md grid-cols-3 gap-3 lg:mx-0">
            <HeroStat icon={<Users className="h-4 w-4" />} value={teams.length} label="Teams" />
            <HeroStat
              icon={<ShuttleIcon className="h-4 w-4" />}
              value={players.length}
              label="Players"
            />
            <HeroStat icon={<Gavel className="h-4 w-4" />} value={sold} label="Sold" gold />
          </div>

          <div className="court-divider mx-auto mt-6 max-w-md lg:mx-0" aria-hidden />

          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <RoleCard
              to="/captain"
              icon={<Users className="h-5 w-5" />}
              tone="primary"
              stagger="stagger-1"
              title="Captain"
              blurb="Bid live from your phone."
            />
            <RoleCard
              to="/admin"
              icon={<Gavel className="h-5 w-5" />}
              tone="accent"
              stagger="stagger-2"
              title="Organizer"
              blurb="Run the auction block."
            />
            <RoleCard
              to="/watch"
              icon={<Tv className="h-5 w-5" />}
              tone="gold"
              stagger="stagger-3"
              title="Watch"
              blurb="Live broadcast, no login."
              live
            />
          </div>
        </div>

        {/* ---------- right: the "player planet" ---------- */}
        <Tilt max={7} className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
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
         </Tilt>
       </div>

      {/* team crest marquee -- the league rolling by, broadcast-style */}
      {teams.length > 0 && <CrestMarquee teams={teams} />}
    </main>
  );
}

function CrestMarquee({ teams }: { teams: Team[] }) {
  const strip = (keyPrefix: string) => (
    <div className="flex shrink-0 items-center" key={keyPrefix}>
      {teams.map((t) => (
        <span
          key={`${keyPrefix}-${t.id}`}
          className="flex items-center gap-2 whitespace-nowrap px-6"
        >
          <TeamCrest team={t} size={30} />
          <span className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t.name}
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee-mask fixed inset-x-0 bottom-0 z-10 hidden border-t border-border/60 bg-background/70 py-2.5 backdrop-blur sm:block">
      <div className="animate-marquee flex w-max">
        {strip("a")}
        {strip("b")}
      </div>
    </div>
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
    <Tilt max={9} className={`animate-rise-in ${stagger}`}>
    <Link
      to={to}
      className={`lift-card glass-panel group relative block h-full overflow-hidden rounded-[1.25rem] border border-border bg-card/80 p-3 text-left backdrop-blur hover:[transform:translateY(-4px)] ${t.border} ${t.glow}`}
    >
      <ShuttleIcon className="pointer-events-none absolute -bottom-3 -right-3 h-12 w-12 rotate-12 text-foreground/[0.04] transition-transform duration-300 group-hover:rotate-45" />
      <div className="relative flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 group-hover:-rotate-12 ${t.badge}`}
        >
          {icon}
        </span>
        {live ? (
          <span className="text-smash flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
            <span className="animate-energy-pulse h-1.5 w-1.5 rounded-full bg-smash" />
            Live
          </span>
        ) : (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground" />
        )}
      </div>
      <h2 className="font-display relative mt-2 text-base uppercase sm:text-xl">{title}</h2>
      <p className="relative mt-0.5 hidden text-xs text-muted-foreground sm:block sm:text-sm">{blurb}</p>
    </Link>
    </Tilt>
  );
}
