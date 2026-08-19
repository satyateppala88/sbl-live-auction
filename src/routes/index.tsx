import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Users } from "lucide-react";
import { useAuctionData, rosterOf } from "@/lib/auction-data";

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
    <main className="arena-bg min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
          SMR Badminton League
        </p>
        <h1 className="mt-3 text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">
          <span className="text-gold">SBL Live</span>
          <br />
          Auction
        </h1>
        <p className="mt-4 text-muted-foreground">
          {teams.length} teams · {players.length} players · {sold} sold
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            to="/captain"
            className="glow-card group rounded-2xl border border-border bg-card p-6 text-left transition-transform hover:-translate-y-1"
          >
            <Users className="h-7 w-7 text-primary" />
            <h2 className="mt-3 text-xl font-bold">I'm a Captain</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick your team, enter your PIN and bid live from your phone.
            </p>
          </Link>
          <Link
            to="/admin"
            className="group rounded-2xl border border-border bg-card p-6 text-left transition-transform hover:-translate-y-1"
          >
            <Gavel className="h-7 w-7 text-accent" />
            <h2 className="mt-3 text-xl font-bold">Organizer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up teams and players, run the block, mark sold or unsold.
            </p>
          </Link>
        </div>

        {teams.length > 0 && (
          <div className="mt-10 grid gap-2 text-left">
            {teams.map((t) => {
              const roster = rosterOf(players, t.id);
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/70 px-4 py-3"
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
                  <span className="font-mono font-bold text-primary">
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
