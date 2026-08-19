import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Shuffle, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  verifyAdmin,
  saveTeam,
  deleteTeam,
  savePlayer,
  deletePlayer,
  saveTier,
  setOnBlock,
  setBidding,
  setIncrement,
  markSold,
  markUnsold,
  relistPlayer,
  lotteryAssign,
  resetAuction,
} from "@/lib/auction.functions";
import { RosterBoard } from "@/components/RosterBoard";
import { TeamCrest } from "@/components/TeamCrest";
import { BulkPhotoUpload, SinglePhotoButton } from "@/components/admin/PhotoTools";
import {
  useAuctionData,
  rosterOf,
  categoryCounts,
  topBid,
  CATEGORY_LABEL,
  REQUIREMENT,
  type Cat,
  type Player,
  type Team,
} from "@/lib/auction-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Organizer Control Room — SBL Live Auction" },
      {
        name: "description",
        content:
          "Set up teams and players, put players on the block, take live bids and mark them sold or unsold in the SBL auction.",
      },
      { property: "og:title", content: "Organizer Control Room — SBL Live Auction" },
      {
        property: "og:description",
        content: "Run the SMR Badminton League player auction from one screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  ssr: false,
  component: AdminPage,
});

const KEY = "sbl_admin";

function AdminPage() {
  const data = useAuctionData();
  const [passcode, setPasscode] = useState<string | null>(null);
  const [entry, setEntry] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) setPasscode(raw);
  }, []);

  async function login() {
    setBusy(true);
    try {
      await verifyAdmin({ data: { passcode: entry } });
      localStorage.setItem(KEY, entry);
      setPasscode(entry);
    } catch {
      toast.error("Wrong passcode");
    } finally {
      setBusy(false);
    }
  }

  if (!passcode) {
    return (
      <main className="arena-bg flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="mt-3 text-2xl font-black uppercase">Organizer access</h1>
          <div className="mt-4 flex gap-2">
            <Input
              type="password"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Admin passcode"
              onKeyDown={(e) => e.key === "Enter" && void login()}
            />
            <Button onClick={() => void login()} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return <AdminConsole data={data} passcode={passcode} />;
}

function AdminConsole({
  data,
  passcode,
}: {
  data: ReturnType<typeof useAuctionData>;
  passcode: string;
}) {
  const { teams, players, tiers, bids, state } = data;
  const player = players.find((p) => p.id === state?.current_player_id) ?? null;
  const ranked = bids
    .filter((b) => b.player_id === player?.id)
    .sort((a, b) => Number(b.amount) - Number(a.amount));
  const leading = topBid(bids, player?.id);
  const leadingTeam = teams.find((t) => t.id === leading?.team_id);

  const run = async (fn: () => Promise<unknown>, msg?: string) => {
    try {
      await fn();
      if (msg) toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const softWarning = (() => {
    if (!player || !leadingTeam) return null;
    const counts = categoryCounts(rosterOf(players, leadingTeam.id));
    if (counts[player.category] >= 2)
      return `${leadingTeam.name} already has 2 ${CATEGORY_LABEL[player.category]} players`;
    return null;
  })();

  return (
    <main className="arena-bg min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center gap-3">
          <Link to="/" className="text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-black uppercase">
            <span className="text-gold">SBL</span> Control Room
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Increment</Label>
            <Input
              type="number"
              className="w-20"
              defaultValue={Number(state?.bid_increment ?? 1)}
              onBlur={(e) =>
                void run(() =>
                  setIncrement({ data: { passcode, increment: Number(e.target.value) || 1 } }),
                )
              }
            />
          </div>
        </header>

        <Tabs defaultValue="auction" className="mt-6">
          <TabsList>
            <TabsTrigger value="auction">Auction</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="board">Roster Board</TabsTrigger>
            <TabsTrigger value="tools">Unsold &amp; Lottery</TabsTrigger>
          </TabsList>

          <TabsContent value="auction" className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="glow-card rounded-2xl border border-border bg-card p-5">
              {player ? (
                <div key={player.id} className="animate-block-in">
                  <p className="text-smash text-xs font-bold uppercase tracking-widest">
                    On the block {state?.round_type === "unsold" && "· second round"}
                  </p>
                  <h2 className="font-display text-5xl uppercase leading-none">{player.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {CATEGORY_LABEL[player.category]} ·{" "}
                    {tiers.find((t) => t.id === player.tier_id)?.label ?? "No tier"} · base{" "}
                    {Number(player.base_price)}
                  </p>
                  <p
                    key={leading?.id ?? "none"}
                    className="text-gold font-display animate-bid-pop mt-4 origin-left text-7xl tabular-nums"
                  >
                    {leading ? Number(leading.amount) : Number(player.base_price)}
                  </p>

                  <p className="font-semibold" style={{ color: leadingTeam?.color }}>
                    {leadingTeam ? `${leadingTeam.name} leading` : "No bids yet"}
                  </p>
                  {softWarning && (
                    <p className="mt-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                      Heads up: {softWarning}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        void run(() =>
                          setBidding({ data: { passcode, open: !state?.bidding_open } }),
                        )
                      }
                    >
                      {state?.bidding_open ? (
                        <>
                          <Pause className="mr-1 h-4 w-4" /> Pause bidding
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-4 w-4" /> Resume bidding
                        </>
                      )}
                    </Button>
                    <Button onClick={() => void run(() => markSold({ data: { passcode } }), "Sold!")}>
                      Mark SOLD
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        void run(() => markUnsold({ data: { passcode } }), "Moved to unsold pool")
                      }
                    >
                      Mark UNSOLD
                    </Button>
                  </div>
                  <div className="mt-5">
                    <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                      Live bids
                    </h3>
                    <div className="mt-2 grid gap-1.5">
                      {ranked.map((b, i) => {
                        const t = teams.find((x) => x.id === b.team_id);
                        return (
                          <div
                            key={b.id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
                          >
                            <span className="w-5 text-muted-foreground">{i + 1}</span>
                            <span
                              className="h-4 w-1 rounded-full"
                              style={{ backgroundColor: t?.color }}
                            />
                            <span className="flex-1">{t?.name}</span>
                            <span className="font-mono font-bold">{Number(b.amount)} pts</span>
                          </div>
                        );
                      })}
                      {ranked.length === 0 && (
                        <p className="text-sm text-muted-foreground">Waiting for bids…</p>
                      )}
                    </div>
                  </div>
                </div>

              ) : (
                <p className="py-16 text-center text-muted-foreground">
                  No player on the block. Pick one from the list →
                </p>
              )}
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                  Next up (available)
                </h3>
                <div className="mt-2 max-h-80 space-y-1.5 overflow-auto">
                  {players
                    .filter((p) => p.status === "available")
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <span className="flex-1">{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {CATEGORY_LABEL[p.category]}
                        </span>
                        <Button
                          size="sm"
                          onClick={() =>
                            void run(
                              () => setOnBlock({ data: { passcode, playerId: p.id } }),
                              `${p.name} is on the block`,
                            )
                          }
                        >
                          Block
                        </Button>
                      </div>
                    ))}
                  {players.filter((p) => p.status === "available").length === 0 && (
                    <p className="text-sm text-muted-foreground">No available players.</p>
                  )}
                </div>
              </div>
              <Dashboard teams={teams} players={players} />
            </div>
          </TabsContent>

          <TabsContent value="teams" className="mt-4">
            <TeamsTab teams={teams} players={players} passcode={passcode} />
          </TabsContent>

          <TabsContent value="players" className="mt-4">
            <PlayersTab data={data} passcode={passcode} />
          </TabsContent>

          <TabsContent value="board" className="mt-4">
            <RosterBoard players={players} teams={teams} tiers={tiers} />
          </TabsContent>

          <TabsContent value="tools" className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="font-bold">Unsold pool</h3>
              <p className="text-xs text-muted-foreground">
                Re-list at half the original base price.
              </p>
              <div className="mt-3 grid gap-1.5">
                {players
                  .filter((p) => p.status === "in_unsold_pool" || p.status === "unsold")
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="flex-1">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        base {Number(p.original_base_price)} →{" "}
                        {Math.max(1, Number(p.original_base_price) / 2)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() =>
                          void run(
                            () => relistPlayer({ data: { passcode, playerId: p.id } }),
                            `${p.name} re-listed`,
                          )
                        }
                      >
                        Re-list
                      </Button>
                    </div>
                  ))}
                {players.filter((p) => p.status === "in_unsold_pool" || p.status === "unsold")
                  .length === 0 && (
                  <p className="text-sm text-muted-foreground">Pool is empty.</p>
                )}
              </div>
            </div>
            <LotteryTool teams={teams} players={players} passcode={passcode} run={run} />
            <div className="rounded-2xl border border-destructive/40 bg-card p-4 lg:col-span-2">
              <h3 className="font-bold">Danger zone</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Clears all bids, resets budgets and un-sells every player.
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Reset the entire auction?"))
                    void run(() => resetAuction({ data: { passcode } }), "Auction reset");
                }}
              >
                Reset auction
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function Dashboard({ teams, players }: { teams: Team[]; players: Player[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Live dashboard</h3>
      <div className="mt-2 grid gap-1.5 lg:grid-cols-2">
        {teams.map((t) => {
          const roster = rosterOf(players, t.id);
          const c = categoryCounts(roster);
          return (
            <div key={t.id} className="rounded-lg border border-border px-3 py-2">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2">
                <TeamCrest team={t} size={28} />
                <span className="min-w-0 truncate font-semibold">{t.name}</span>

                <span className="text-sm text-muted-foreground">
                  {roster.length}/{t.max_roster_size}
                </span>
                <span className="font-mono font-bold text-primary">
                  {Number(t.remaining_budget)} pts
                </span>
              </div>
              <div className="mt-1 flex gap-2 text-[11px]">
                {(["male", "female", "kid"] as const).map((cat) => (
                  <span
                    key={cat}
                    className={
                      c[cat] >= REQUIREMENT[cat] ? "text-success" : "text-muted-foreground"
                    }
                  >
                    {CATEGORY_LABEL[cat]} {c[cat]}/{REQUIREMENT[cat]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamsTab({
  teams,
  players,
  passcode,
}: {
  teams: Team[];
  players: Player[];
  passcode: string;
}) {
  const empty = {
    name: "",
    captain_name: "",
    color: "#e11d48",
    starting_budget: 100,
    max_roster_size: 5,
    pin: "",
  };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);

  async function submit() {
    try {
      await saveTeam({ data: { passcode, ...form } });
      toast.success("Team saved");
      setForm(empty);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-bold">{form.id ? "Edit team" : "Add team"}</h3>
        <div className="mt-3 grid gap-3">
          <Field label="Team name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Captain name">
            <Input
              value={form.captain_name}
              onChange={(e) => setForm({ ...form, captain_name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starting budget">
              <Input
                type="number"
                value={form.starting_budget}
                onChange={(e) => setForm({ ...form, starting_budget: Number(e.target.value) })}
              />
            </Field>
            <Field label="Max roster">
              <Input
                type="number"
                value={form.max_roster_size}
                onChange={(e) => setForm({ ...form, max_roster_size: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="PIN">
              <Input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} />
            </Field>
            <Field label="Colour">
              <Input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void submit()} disabled={!form.name}>
              Save team
            </Button>
            {form.id && (
              <Button variant="secondary" onClick={() => setForm(empty)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        {teams.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <TeamCrest team={t} size={40} />
              <SinglePhotoButton
                kind="team"
                id={t.id}
                name={t.captain_name || t.name}
                photoUrl={t.captain_photo_url}
                passcode={passcode}
              />
              <div className="flex-1">
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.captain_name} · {rosterOf(players, t.id).length}/{t.max_roster_size} ·{" "}
                  {Number(t.remaining_budget)}/{Number(t.starting_budget)} pts
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setForm({
                    id: t.id,
                    name: t.name,
                    captain_name: t.captain_name,
                    color: t.color,
                    starting_budget: Number(t.starting_budget),
                    max_roster_size: t.max_roster_size,
                    pin: "",
                  })
                }
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Delete ${t.name}?`))
                    void deleteTeam({ data: { passcode, id: t.id } });
                }}
              >
                Del
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersTab({
  data,
  passcode,
}: {
  data: ReturnType<typeof useAuctionData>;
  passcode: string;
}) {
  const { players, tiers, teams } = data;
  const empty = {
    name: "",
    category: "male" as Cat,
    tier_id: tiers[0]?.id ?? null,
    base_price: Number(tiers[0]?.base_price ?? 2),
  };
  const [form, setForm] = useState<typeof empty & { id?: string }>(empty);
  const [tierForm, setTierForm] = useState({ label: "", base_price: 5 });

  async function submit() {
    try {
      await savePlayer({ data: { passcode, ...form } });
      toast.success("Player saved");
      setForm({ ...empty, tier_id: form.tier_id, base_price: form.base_price });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="grid gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-bold">{form.id ? "Edit player" : "Add player"}</h3>
          <div className="mt-3 grid gap-3">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Category">
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as Cat })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["male", "female", "kid"] as const).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tier">
                <Select
                  value={form.tier_id ?? ""}
                  onValueChange={(v) => {
                    const tier = tiers.find((t) => t.id === v);
                    setForm({
                      ...form,
                      tier_id: v,
                      base_price: Number(tier?.base_price ?? form.base_price),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Base price">
                <Input
                  type="number"
                  value={form.base_price}
                  onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => void submit()} disabled={!form.name}>
                Save player
              </Button>
              {form.id && (
                <Button variant="secondary" onClick={() => setForm(empty)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        <BulkPhotoUpload players={players} teams={teams} passcode={passcode} />

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-bold">Tiers</h3>
          <div className="mt-2 grid gap-1.5">
            {tiers.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <Input
                  className="flex-1"
                  defaultValue={t.label}
                  onBlur={(e) =>
                    void saveTier({
                      data: {
                        passcode,
                        id: t.id,
                        label: e.target.value,
                        base_price: Number(t.base_price),
                      },
                    })
                  }
                />
                <Input
                  className="w-24"
                  type="number"
                  defaultValue={Number(t.base_price)}
                  onBlur={(e) =>
                    void saveTier({
                      data: {
                        passcode,
                        id: t.id,
                        label: t.label,
                        base_price: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="New tier"
              value={tierForm.label}
              onChange={(e) => setTierForm({ ...tierForm, label: e.target.value })}
            />
            <Input
              className="w-24"
              type="number"
              value={tierForm.base_price}
              onChange={(e) => setTierForm({ ...tierForm, base_price: Number(e.target.value) })}
            />
            <Button
              variant="secondary"
              disabled={!tierForm.label}
              onClick={() => {
                void saveTier({ data: { passcode, ...tierForm } });
                setTierForm({ label: "", base_price: 5 });
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="grid max-h-[70vh] gap-1.5 overflow-auto">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <SinglePhotoButton
              kind="player"
              id={p.id}
              name={p.name}
              photoUrl={p.photo_url}
              passcode={passcode}
            />
            <span className="flex-1 font-medium">{p.name}</span>
            <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[p.category]}</span>
            <span className="text-xs text-muted-foreground">
              {tiers.find((t) => t.id === p.tier_id)?.label ?? "—"}
            </span>
            <span className="font-mono text-xs">{Number(p.base_price)}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                p.status === "sold"
                  ? "bg-success/15 text-success"
                  : p.status === "on_auction"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {p.status === "sold"
                ? `${teams.find((t) => t.id === p.sold_to_team_id)?.name} · ${Number(p.sold_price)}`
                : p.status.replace(/_/g, " ")}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setForm({
                  id: p.id,
                  name: p.name,
                  category: p.category,
                  tier_id: p.tier_id,
                  base_price: Number(p.base_price),
                })
              }
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm(`Delete ${p.name}?`)) void deletePlayer({ data: { passcode, id: p.id } });
              }}
            >
              Del
            </Button>
          </div>
        ))}
        {players.length === 0 && <p className="text-sm text-muted-foreground">No players yet.</p>}
      </div>
    </div>
  );
}

function LotteryTool({
  teams,
  players,
  passcode,
  run,
}: {
  teams: Team[];
  players: Player[];
  passcode: string;
  run: (fn: () => Promise<unknown>, msg?: string) => Promise<void>;
}) {
  const [teamId, setTeamId] = useState<string>("");
  const [category, setCategory] = useState<Cat>("male");
  const team = teams.find((t) => t.id === teamId);
  const counts = team ? categoryCounts(rosterOf(players, team.id)) : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-bold">Last-resort lottery</h3>
      <p className="text-xs text-muted-foreground">
        Randomly assign a remaining player in a category to a team for a flat 1 point.
      </p>
      <div className="mt-3 grid gap-3">
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose team" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => setCategory(v as Cat)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["male", "female", "kid"] as const).map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {counts && (
          <p className="text-xs text-muted-foreground">
            {team?.name}: {counts[category]}/{REQUIREMENT[category]} in {CATEGORY_LABEL[category]} ·{" "}
            {Number(team?.remaining_budget)} pts left
          </p>
        )}
        <Button
          disabled={!teamId}
          onClick={() =>
            void run(async () => {
              const r = await lotteryAssign({ data: { passcode, teamId, category } });
              toast.success(`${r.player} assigned for 1 pt`);
            })
          }
        >
          <Shuffle className="mr-2 h-4 w-4" /> Draw player
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
