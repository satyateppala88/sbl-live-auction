import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Gavel, ArrowLeft, LogOut, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { captainLogin, placeBid, getTargets, setTarget } from "@/lib/auction.functions";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { RosterSlots } from "@/components/RosterSlots";
import { ShuttleIcon } from "@/components/ShuttleIcon";
import { CountUp } from "@/components/CountUp";
import { AuctionMomentOverlay, useAuctionMoment } from "@/components/AuctionMoment";
import {
  RecordFlash,
  useRecordBreaker,
  BiddingWarBadge,
  useBiddingWar,
} from "@/components/BroadcastFX";
import { CountdownTimer } from "@/components/CountdownTimer";
import { TeamCrest } from "@/components/TeamCrest";
import { PlayerSilhouette } from "@/components/PlayerSilhouette";
import { ChatPopup } from "@/components/ChatPopup";
import { ViewerCount } from "@/components/ViewerCount";
import { RulesButton } from "@/components/RulesDialog";
import { TargetPlanner, type TargetMap } from "@/components/TargetPlanner";
import {
  useAuctionData,
  rosterOf,
  categoryCounts,
  maxBidFor,
  topBid,
  usePresence,
  biddingAdvice,
  CATEGORY_LABEL,
  REQUIREMENT,
  type Team,
  type Advice,
} from "@/lib/auction-data";


export const Route = createFileRoute("/captain")({
  head: () => ({
    meta: [
      { title: "Captain Bidding Room — SBL Live Auction" },
      {
        name: "description",
        content:
          "Team captains bid live on SBL players, track their budget, roster and category requirements in real time.",
      },
      { property: "og:title", content: "Captain Bidding Room — SBL Live Auction" },
      {
        property: "og:description",
        content: "Bid live from your phone in the SMR Badminton League auction.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: CaptainPage,
});

const KEY = "sbl_captain";

function CaptainPage() {
  const data = useAuctionData();
  const [session, setSession] = useState<{ teamId: string; pin: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setSession(JSON.parse(raw));
  }, []);

  const team = data.teams.find((t) => t.id === session?.teamId);

  if (!session || !team) {
    return <CaptainLogin teams={data.teams} onDone={(s) => {
      localStorage.setItem(KEY, JSON.stringify(s));
      setSession(s);
    }} />;
  }

  return (
    <BiddingRoom
      data={data}
      team={team}
      pin={session.pin}
      onLogout={() => {
        localStorage.removeItem(KEY);
        setSession(null);
      }}
    />
  );
}

function CaptainLogin({
  teams,
  onDone,
}: {
  teams: Team[];
  onDone: (s: { teamId: string; pin: string }) => void;
}) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  // deep link: /captain?team=<id> preselects the team (from the printed QR card)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = new URLSearchParams(window.location.search).get("team");
    if (t && teams.some((x) => x.id === t)) setTeamId(t);
  }, [teams]);

  async function submit() {
    if (!teamId) return;
    setBusy(true);
    try {
      await captainLogin({ data: { teamId, pin } });
      onDone({ teamId, pin });
    } catch {
      toast.error("Wrong PIN for that team");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="arena-bg star-field relative min-h-screen overflow-hidden px-4 py-10">
      <div className="star-field-layer" aria-hidden />
      <PlayerSilhouette className="text-foreground/[0.03] pointer-events-none absolute -right-16 -top-10 hidden h-96 w-96 rotate-6 lg:block" />
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="animate-rise-in mt-4 flex items-center gap-2">
          <ShuttleIcon className="text-shuttle h-7 w-7" />
          <h1 className="font-display text-4xl uppercase leading-none">Captain check-in</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Pick your team, then enter your PIN.</p>


        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamId(t.id)}
              className={`lift-card flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 text-left transition hover:[transform:translateY(-2px)] ${
                teamId === t.id ? "border-primary glow-card" : "border-border"
              }`}
            >
              <TeamCrest team={t} size={40} />

              <span className="flex-1 min-w-0">
                <span className="block truncate font-semibold">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[t.captain_name, t.captain2_name].filter(Boolean).join(" & ")}
                </span>
              </span>
            </button>
          ))}
          {teams.length === 0 && (
            <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              No teams yet — ask the organizer to add them.
            </p>
          )}
        </div>

        {teamId && (
          <div className="mt-6 flex max-w-sm gap-2">
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Team PIN"
              inputMode="numeric"
              onKeyDown={(e) => e.key === "Enter" && void submit()}
            />
            <Button onClick={() => void submit()} disabled={busy || !pin}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

function BiddingRoom({
  data,
  team,
  pin,
  onLogout,
}: {
  data: ReturnType<typeof useAuctionData>;
  team: Team;
  pin: string;
  onLogout: () => void;
}) {
  const { players, bids, state, teams, tiers } = data;
  const { count, banned } = usePresence("captain", team.name);
  const [busy, setBusy] = useState(false);
  const [targets, setTargets] = useState<TargetMap>({});

  useEffect(() => {
    let cancelled = false;
    void getTargets({ data: { teamId: team.id, pin } })
      .then((r) => {
        if (cancelled) return;
        const m: TargetMap = {};
        for (const t of r.targets) {
          m[t.player_id] = {
            min: t.min_price === null ? null : Number(t.min_price),
            max: t.max_price === null ? null : Number(t.max_price),
          };
        }
        setTargets(m);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [team.id, pin]);

  const saveTarget = (playerId: string, min: number | null, max: number | null) => {
    setTargets((prev) => ({ ...prev, [playerId]: { min, max } }));
    void setTarget({
      data: { teamId: team.id, pin, playerId, minPrice: min, maxPrice: max },
    }).catch(() => {});
  };


  const roster = rosterOf(players, team.id);
  const counts = categoryCounts(roster);
  const filled = roster.length;
  const floorBase = tiers.length ? Math.min(...tiers.map((t) => Number(t.base_price))) : 1;
  const cap = maxBidFor(team, filled, floorBase);
  const player = players.find((p) => p.id === state?.current_player_id) ?? null;
  const leading = topBid(bids, player?.id);
  const leadingTeam = teams.find((t) => t.id === leading?.team_id);
  const increment = Number(state?.bid_increment ?? 1);
  const nextAmount = leading ? Number(leading.amount) + increment : Number(player?.base_price ?? 0);

  let disabledReason: string | null = null;
  if (!player) disabledReason = "Waiting for the next player";
  else if (!state?.bidding_open) disabledReason = "Bidding is paused";
  else if (filled >= team.max_roster_size) disabledReason = "Your roster is full";
  else if (leading?.team_id === team.id) disabledReason = "You're the highest bidder";
  else if (nextAmount > Number(team.remaining_budget)) disabledReason = "Over your budget";
  else if (nextAmount > cap) disabledReason = `Reserve rule — your max bid is ${cap} pts`;

  const advice = biddingAdvice({
    team,
    players,
    currentPlayer: player,
    filled,
    cap,
    nextAmount,
    leadingIsMe: leading?.team_id === team.id,
    floorBase,
  });


  async function bid() {
    setBusy(true);
    try {
      const res = await placeBid({ data: { teamId: team.id, pin } });
      toast.success(`Bid placed: ${res.amount} pts`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bid failed");
    } finally {
      setBusy(false);
    }
  }

  const moment = useAuctionMoment(players, teams);
  const record = useRecordBreaker(bids, teams);
  const war = useBiddingWar(bids, player?.id);

  const wonIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    const mine = new Set(
      players.filter((p) => p.status === "sold" && p.sold_to_team_id === team.id).map((p) => p.id),
    );
    const before = wonIds.current;
    wonIds.current = mine;
    if (!before) return;
    for (const id of mine) {
      if (before.has(id)) continue;
      const p = players.find((x) => x.id === id);
      if (p) {
        toast.success(
          `🎉 You won ${p.name} for ${Number(p.sold_price)} pts! ${Number(
            team.remaining_budget,
          )} pts left — squad's shaping up. Great pick!`,
          { duration: 6000 },
        );
      }
    }
  }, [players, team.id, team.remaining_budget]);



  return (
    <main className="arena-bg court-lines min-h-screen px-4 pb-32 pt-6 lg:h-[100dvh] lg:overflow-hidden lg:pb-28">
      <div className="court-lines-layer" aria-hidden />
      <AuctionMomentOverlay moment={moment} />
      <RecordFlash hit={record} />
      <div className="mx-auto max-w-md lg:max-w-6xl">
        <header className="flex items-center gap-3">
          <TeamCrest team={team} size={48} />
          <div className="flex-1">
            <h1 className="font-display text-xl uppercase leading-tight">{team.name}</h1>
            <p className="text-xs text-muted-foreground">
              {[team.captain_name, team.captain2_name].filter(Boolean).join(" & ")}
            </p>
          </div>
          <ViewerCount count={count} />
          <Button variant="secondary" size="sm" onClick={onLogout}>
            <LogOut className="mr-1 h-4 w-4" /> Sign out
          </Button>
        </header>

        <div className="mt-3 flex items-center justify-center gap-3 lg:justify-start">
          <p className="text-gold-solid text-[11px] font-bold uppercase tracking-[0.3em]">
            Play as One · Rise as One
          </p>
          <TargetPlanner players={players} tiers={tiers} targets={targets} onSave={saveTarget} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Budget" value={Number(team.remaining_budget)} gold />
          <Stat label="Roster" value={filled} suffix={`/${team.max_roster_size}`} />
          <Stat label="Max bid" value={Math.max(0, cap)} />
        </div>

        <div className="mt-5 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-5 lg:items-start">
        <section
          className={`rounded-2xl border bg-card/90 p-5 text-center backdrop-blur ${
            player && state?.bidding_open ? "smash-card border-accent/40" : "glow-card border-border"
          }`}
        >
          {player ? (
            <div key={player.id} className="animate-block-in">
              <div className="flex items-center justify-center gap-2">
                <p className="text-smash text-xs font-bold uppercase tracking-widest">
                  {state?.round_type === "unsold" ? "Second round" : "On the block"}
                </p>
                <BiddingWarBadge active={war} />
                <CountdownTimer state={state} size="sm" />
              </div>
              <PlayerAvatar
                name={player.name}
                photoUrl={player.photo_url}
                className="mx-auto mt-3 h-28 w-28 text-3xl"
              />
              <h2 className="font-display mt-3 text-4xl uppercase leading-none">{player.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {CATEGORY_LABEL[player.category]} ·{" "}
                {tiers.find((t) => t.id === player.tier_id)?.label ?? "No tier"} · base{" "}
                {Number(player.base_price)}
              </p>
              <div key={leading?.id ?? "none"} className="animate-bid-pop mt-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Current bid
                </p>
                <p className="text-gold font-heavy text-6xl tabular-nums">
                  <CountUp value={leading ? Number(leading.amount) : Number(player.base_price)} />
                </p>
                <p
                  className="mt-1 flex items-center justify-center gap-2 text-sm font-semibold"
                  style={leadingTeam ? { color: leadingTeam.color } : undefined}
                >
                  {leadingTeam && <TeamCrest team={leadingTeam} size={22} />}
                  {leadingTeam ? `${leadingTeam.name} leading` : "No bids yet"}
                </p>
              </div>
              {(() => {
                const mt = targets[player.id];
                if (!mt || (mt.min === null && mt.max === null)) return null;
                const currentBid = leading ? Number(leading.amount) : Number(player.base_price);
                const over = mt.max !== null && currentBid > mt.max;
                return (
                  <div
                    className={`mt-4 rounded-xl border px-3 py-2 text-left text-sm ${
                      over ? "border-smash/50 text-smash" : "border-accent/40 text-accent"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Your plan
                    </span>{" "}
                    {mt.min ?? "—"}–{mt.max ?? "—"} pts ·{" "}
                    {over
                      ? `current ${currentBid} is ${currentBid - (mt.max ?? 0)} over your max`
                      : "within your plan"}
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="py-10 text-muted-foreground">Waiting for the organizer…</p>
          )}
        </section>


        <div className="mt-5 space-y-5 lg:mt-0">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Your squad · build it together
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["male", "female", "kid"] as const).map((c) => (
              <span
                key={c}
                className={`rounded-full border px-3 py-1 text-xs ${
                  counts[c] >= REQUIREMENT[c]
                    ? "border-success/50 text-success"
                    : "border-border text-muted-foreground"
                }`}
              >
                {CATEGORY_LABEL[c]}: {counts[c]}/{REQUIREMENT[c]}
              </span>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-border bg-card p-3">
            <RosterSlots team={team} players={players} size="sm" />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Other teams
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {teams
              .filter((t) => t.id !== team.id)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card/70 px-2 py-1.5 text-sm"
                >
                  <TeamCrest team={t} size={22} />
                  <span className="min-w-0 flex-1 truncate text-xs">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {rosterOf(players, t.id).length}/{t.max_roster_size}
                  </span>
                  <span className="font-mono text-xs text-primary">{Number(t.remaining_budget)}</span>
                </div>
              ))}
          </div>
        </section>
        </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          {player && <BidAdvisor advice={advice} />}
          <Button
            size="lg"
            className="btn-squash h-16 w-full text-lg font-black uppercase active:scale-[0.94] active:brightness-125"
            disabled={!!disabledReason || busy}
            onClick={() => void bid()}
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Gavel className="mr-2 h-5 w-5" /> Bid {nextAmount || ""} pts
              </>
            )}
          </Button>
          {disabledReason && (
            <p className="mt-2 text-center text-xs text-muted-foreground">{disabledReason}</p>
          )}
        </div>
      </div>
      <ChatPopup banned={banned} />
    </main>
  );
}

function BidAdvisor({ advice }: { advice: Advice[] }) {
  if (advice.length === 0) return null;
  const icon = {
    info: <Info className="h-3.5 w-3.5 text-muted-foreground" />,
    good: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
    warn: <AlertTriangle className="h-3.5 w-3.5 text-smash" />,
  };
  return (
    <div className="mb-2 rounded-xl border border-border bg-card/70 px-3 py-2">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gold-solid">
        <Gavel className="h-3 w-3" /> Bidding advisor
      </p>
      <ul className="grid gap-1">
        {advice.slice(0, 4).map((a, i) => (
          <li
            key={i}
            className={`flex items-start gap-1.5 text-xs ${
              a.tone === "warn"
                ? "text-smash"
                : a.tone === "good"
                  ? "text-success"
                  : "text-foreground/90"
            }`}
          >
            <span className="mt-px shrink-0">{icon[a.tone]}</span>
            {a.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  gold,
}: {
  label: string;
  value: number;
  suffix?: string;
  gold?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/80 px-2 py-3 backdrop-blur">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`font-display text-2xl tabular-nums ${gold ? "text-gold-solid" : "text-foreground"}`}
      >
        <CountUp value={value} duration={350} />
        {suffix}
      </p>
    </div>
  );

}
