import { useState } from "react";
import { BookOpen, X } from "lucide-react";
import { StarEmblem } from "./StarEmblem";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5">
      <h3 className="font-display text-gold-solid text-lg uppercase tracking-wide">{title}</h3>
      <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

/**
 * "Rules & Regulations" call-to-action + full-screen overlay explaining how the SBL
 * auction is run. Self-contained (own open state) so it can be dropped into any header.
 */
export function RulesButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-full border border-gold-solid/40 bg-background/50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold-solid transition hover:bg-gold-solid/10 ${className}`}
      >
        <BookOpen className="h-3.5 w-3.5" /> Rules
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-background/95 backdrop-blur">
          <div className="arena-bg star-field min-h-full px-4 py-8">
            <div className="star-field-layer" aria-hidden />
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center gap-3">
                <StarEmblem className="text-star h-7 w-7" glow />
                <div className="flex-1">
                  <h1 className="font-display text-3xl uppercase leading-none sm:text-4xl">
                    Rules &amp; Regulations
                  </h1>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    SMR Vinay Galaxy · SBL Live Auction
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Close rules"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <Section title="The format">
                  <p>
                    Ten franchise teams build their squads by bidding live for registered players.
                    Each team is led by two captains — one male and one female adult — who bid from
                    their phones while the organizer runs the block. Every sale updates all screens
                    in real time.
                  </p>
                </Section>

                <Section title="Budget & the reserve rule">
                  <p>Each team starts with a fixed purse of points (default 100).</p>
                  <p>
                    A team must always keep at least <strong>1 point in reserve for every empty
                    slot</strong> it still needs to fill. Example: with 3 of 5 players bought, you
                    can bid at most your remaining budget minus 2. This is enforced automatically —
                    you can never bid yourself into a corner where a mandatory slot can't be filled.
                  </p>
                </Section>

                <Section title="Player tiers">
                  <p>Players are graded into three tiers, each with a base (starting) price:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li><strong>Icon</strong> — top tier, highest base price.</li>
                    <li><strong>Challenger</strong> — mid tier.</li>
                    <li><strong>Game Changer</strong> — entry tier, lowest base price.</li>
                  </ul>
                  <p>Bidding on a player opens at that player's base price.</p>
                </Section>

                <Section title="Squad composition">
                  <p>Every team must field a balanced squad. Mandatory minimums per team:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>2 × Male (16+)</li>
                    <li>2 × Female (16+)</li>
                    <li>1 × Kid (8–16)</li>
                  </ul>
                  <p className="text-muted-foreground">
                    Category caps are shown to the organizer as a soft warning; the organizer has
                    final say via the lottery tool.
                  </p>
                </Section>

                <Section title="How a player is called">
                  <p>Players come up on the block in a set order:</p>
                  <p className="font-mono text-xs">
                    Male → Female → Kid, and within each: Icon → Challenger → Game Changer.
                  </p>
                  <p>
                    Each player has a <strong>2-minute countdown</strong>. Bids raise the price by 1
                    point at a time. The highest bid when the organizer closes the block wins.
                  </p>
                </Section>

                <Section title="Sold, unsold & second round">
                  <p>
                    <strong>Sold:</strong> the player joins the winning team and the points are
                    deducted from that team's purse.
                  </p>
                  <p>
                    <strong>Unsold:</strong> a player with no bids moves to the unsold pool and can
                    be re-listed later in a second round at half their original base price.
                  </p>
                </Section>

                <Section title="Last-resort lottery">
                  <p>
                    If a team still has an unfilled mandatory slot and not enough budget to bid, the
                    organizer can randomly assign a remaining player in that category to the team for
                    a flat 1 point, so every squad is completed fairly.
                  </p>
                </Section>

                <Section title="Fair play & chat">
                  <p>
                    Keep the live chat friendly — enter your name to join. Abusive or derogatory
                    messages can be removed and the sender kicked from chat by the organizer. The
                    organizer's decisions on the block are final.
                  </p>
                </Section>
              </div>

              <div className="mt-6 flex justify-center pb-4">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-accent px-6 py-2 text-sm font-bold text-accent-foreground transition active:scale-95"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
