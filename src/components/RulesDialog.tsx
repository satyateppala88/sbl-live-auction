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
                    Each team is led by one captain, who bids from their phone while the organizer
                    runs the block. Every sale updates all screens in real time.
                  </p>
                </Section>

                <Section title="Budget & the reserve rule">
                  <p>
                    Each team starts with a purse of <strong>100 points minus its captain's tier
                    base price</strong> — an Icon captain leaves 85, a Challenger 92, a Game Changer
                    98 — because the captain plays as one of the three men.
                  </p>
                  <p>
                    For every slot you'll still need to fill <em>after</em> the player on the block,
                    the app holds back the <strong>lowest base price in the auction</strong> (one
                    Game Changer). So if buying the current player would leave you two more slots to
                    fill, your max bid is your remaining purse minus two Game-Changer bases. This is
                    enforced automatically — you can never bid so high that you couldn't still sign
                    your remaining players at their base price.
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
                  <p>
                    Every team fields <strong>five players</strong>: the captain plus four bought at
                    auction. The on-court squad is:
                  </p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>3 × Male (16+) — includes the captain</li>
                    <li>1 × Female (16+)</li>
                    <li>1 × Child (8–15)</li>
                  </ul>
                  <p>
                    So at auction each team buys <strong>2 Male, 1 Female and 1 Child</strong> — the
                    captain is your third male.
                  </p>
                  <p className="text-muted-foreground">
                    Category caps are shown to the organizer as a soft warning; the organizer has
                    final say via the lottery tool.
                  </p>
                </Section>

                <Section title="Game formats">
                  <p>Every tie is decided across five matches:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>Men's Doubles</li>
                    <li>Men's Doubles</li>
                    <li>Mixed Doubles (Man + Woman)</li>
                    <li>Man + Child</li>
                    <li>Woman + Child</li>
                  </ul>
                  <p>
                    <strong>No player may play more than two matches.</strong> With three men, one
                    woman and one child, every player features in exactly two.
                  </p>
                </Section>

                <Section title="How a player is called">
                  <p>
                    Players come up on the block in <strong>random order</strong> — no fixed
                    sequence.
                  </p>
                  <p>
                    Each player gets a <strong>2-minute free-bidding window</strong>: bid whenever
                    you like and take your time — no auctioneer count, no pressure. Bidding opens at
                    the base price and each raise grows as it heats up:
                  </p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>First 5 raises: +1 point each</li>
                    <li>Next 5 raises: +2 points each</li>
                    <li>Next 5 raises: +3 points each</li>
                    <li>After that: +5 points each</li>
                  </ul>
                  <p>
                    Once the 2 minutes are up, bidding stays open but the auctioneer takes over with
                    a <strong>&ldquo;going once, going twice&rdquo;</strong> call on each new bid. The
                    highest bid when the block closes wins.
                  </p>
                </Section>

                <Section title="Sold">
                  <p>
                    <strong>Sold:</strong> the player joins the winning team and the points are
                    deducted from that team's purse. There are exactly enough players for every
                    squad, so every player is sold — there is no unsold round.
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
