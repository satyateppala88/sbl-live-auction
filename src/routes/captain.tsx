import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Gavel, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { captainLogin, placeBid } from "@/lib/auction.functions";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { RosterSlots } from "@/components/RosterSlots";
import {
  useAuctionData,
  rosterOf,
  categoryCounts,
  maxBidFor,
  topBid,
  CATEGORY_LABEL,
  REQUIREMENT,
  type Team,
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
    <main className="arena-bg min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <h1 className="mt-4 text-3xl font-black uppercase">Captain check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick your team, then enter your PIN.</p>

        <div className="mt-6 grid gap-2">
          {teams.map((t) => (
            <button
              key={t.id}
              onClick={() => setTeamId(t.id)}
              className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-left transition ${
                teamId === t.id ? "border-primary glow-card" : "border-border"
              }`}
            >
              <span
                className="h-8 w-1.5 rounded-full"
                style={{ backgroundColor: t.color }}
                aria-hidden
              />
              <span className="flex-1">
                <span className="block font-semibold">{t.name}</span>
                <span className="block text-xs text-muted-foreground">{t.captain_name}</span>
              </span>
            </button>
          ))}
          {teams.length === 0 && (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              No teams yet — ask the organizer to add them.
            </p>
          )}
        </div>

        {teamId && (
          <div className="mt-6 flex gap-2">
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
  const [busy, setBusy] = useState(false);

  const roster = rosterOf(players, team.id);
  const counts = categoryCounts(roster);
  const filled = roster.length;
  const cap = maxBidFor(team, filled);
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

  return (
    <main className="arena-bg min-h-screen px-4 pb-32 pt-6">
      <div className="mx-auto max-w-md">
        <header className="flex items-center gap-3">
          <span className="h-9 w-1.5 rounded-full" style={{ backgroundColor: team.color }} />
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-tight">{team.name}</h1>
            <p className="text-xs text-muted-foreground">{team.captain_name}</p>
          </div>
          <button onClick={onLogout} className="text-xs text-muted-foreground underline">
            switch
          </button>
        </header>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Budget" value={`${Number(team.remaining_budget)}`} />
          <Stat label="Roster" value={`${filled}/${team.max_roster_size}`} />
          <Stat label="Max bid" value={`${Math.max(0, cap)}`} />
        </div>

        <section className="glow-card mt-5 rounded-2xl border border-border bg-card p-5 text-center">
          {player ? (
            <>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {state?.round_type === "unsold" ? "Second round" : "On the block"}
              </p>
              <PlayerAvatar
                name={player.name}
                photoUrl={player.photo_url}
                className="mx-auto mt-3 h-28 w-28 text-3xl"
              />
              <h2 className="mt-3 text-3xl font-black uppercase">{player.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {CATEGORY_LABEL[player.category]} ·{" "}
                {tiers.find((t) => t.id === player.tier_id)?.label ?? "No tier"} · base{" "}
                {Number(player.base_price)}
              </p>
              <div key={leading?.id ?? "none"} className="animate-bid-pop mt-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Current bid
                </p>
                <p className="text-gold text-6xl font-black tabular-nums">
                  {leading ? Number(leading.amount) : Number(player.base_price)}
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: leadingTeam?.color }}>
                  {leadingTeam ? `${leadingTeam.name} leading` : "No bids yet"}
                </p>
              </div>
            </>
          ) : (
            <p className="py-10 text-muted-foreground">Waiting for the organizer…</p>
          )}
        </section>

        <section className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Your squad
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

        <section className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Other teams
          </h3>
          <div className="mt-2 grid gap-1.5">
            {teams
              .filter((t) => t.id !== team.id)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card/70 px-3 py-2 text-sm"
                >
                  <span className="h-4 w-1 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="flex-1">{t.name}</span>
                  <span className="text-muted-foreground">
                    {rosterOf(players, t.id).length}/{t.max_roster_size}
                  </span>
                  <span className="font-mono text-primary">{Number(t.remaining_budget)}</span>
                </div>
              ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <Button
            size="lg"
            className="h-16 w-full text-lg font-black uppercase"
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
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-2 py-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
