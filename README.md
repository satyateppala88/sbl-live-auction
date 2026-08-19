# SBL Auction Hub

Build a real-time, mobile-friendly web app called "SBL Live Auction" for running a live IPL-style player auction for a community badminton tournament (SMR Badminton League / SBL). Multiple team captains join from their own phones and bid in real time; one organizer runs the auction from an admin view on a laptop/projector.

ROLES & ACCESS (no email/password auth needed — keep it lightweight for a one-day event):
- Admin enters an admin passcode to access the control panel.
- Captains pick their team name from a list (created by admin beforehand) and enter a simple PIN/code to "become" that captain on their device.

CORE DATA MODEL:
- Teams: name, captain_name, starting_budget (default 100 points), remaining_budget, PIN/code, max_roster_size (5 or 6)
- Players: name, category (Male >16 / Female >16 / Kid 8-16), tier (label + base_price, tiers are editable — default three tiers: "Icon" 15-20 base, "Challenger" 8-10 base, "Game Changer" 2-5 base), status (available, on_auction, sold, unsold, in_unsold_pool), sold_to_team_id, sold_price
- Bids: player_id, team_id, amount, timestamp — live bid history per player
- Auction session state: current player on the block, current highest bid + leading team, round type (main / unsold re-auction / last-resort lottery), bid increment (default 1 point, admin-editable)

ADMIN VIEW:
- Manage teams: add/edit team name, captain name, starting budget, PIN, max roster size
- Manage players: simple add/edit form (name, category, tier, base price) — roster isn't finalized yet, so no bulk import needed, just ad-hoc entry before and during the auction
- Auction control: choose which player goes "on the block" next, start/stop bidding on that player, see live incoming bids from all captains ranked by amount in real time, mark player SOLD (assigns to highest bidder, deducts budget, adds to that team's roster) or UNSOLD (sends to unsold pool)
- Unsold pool / second round: view unsold players, re-list a specific one at half its original base price for a quick re-auction round
- Last-resort lottery tool: for a team with an empty mandatory slot (needs 2 Male >16, 2 Female >16, 1-2 Kids 8-16) and insufficient remaining budget, let admin randomly assign one of the remaining unsold players in that category to that team for a flat 1 point
- Live dashboard: all teams' remaining budget and roster fill (e.g. 3/5, with category breakdown vs the mandatory 2 Male / 2 Female / 1-2 Kids requirement), sortable/scannable at a glance

CAPTAIN VIEW (mobile-first):
- Current player on the block: name, category, tier, base price, current highest bid and which team is leading
- A "Bid" button that raises the team's bid by the configured increment — disabled with a clear reason if bidding would exceed remaining budget, if the team's roster is already at max size, or if bidding would violate the mandatory reserve rule (a team must always keep at least 1 point reserved for every empty roster slot it still needs to fill — e.g. if a team has bought 3 of 5 players, it can only bid up to remaining_budget minus 2)
- Own team's live status: remaining budget, roster so far, category breakdown vs requirement, slots remaining
- A lightweight live view of other teams for context: budgets and roster counts only (not full roster detail), to keep it fair and add suspense

BACKEND RULES TO ENFORCE (not just UI validation):
- When admin marks a player "sold," record the winning bid, deduct that amount from the winning team's remaining_budget, and add the player to that team's roster
- A team cannot bid more than its remaining_budget
- A team must keep at least 1 point reserved per remaining empty roster slot (see formula above) — enforce this server-side when a bid is placed
- A team cannot bid once its roster is at max size
- Unsold players move to an "unsold pool" state, re-enterable into a second round at half their original base price
- Category caps (max 2 Male, 2 Female, 2 Kids per team) should be enforced as a soft warning shown to admin, not a hard block, since admin has final say via the lottery tool

DESIGN: energetic, IPL-auction-style visual feel — bold team colors, a big prominent "current bid" number, a sense of live tension — but keep it simple and clean; this is for a community event, not enterprise software. Real-time sync: when a bid comes in or the admin marks a player sold, every connected captain's screen should update within a second or two without a manual refresh (use realtime subscriptions, not polling).

Please prioritize in this order: 1) team setup and player setup screens, 2) the live auction flow (put a player on the block → captains bid live → admin marks sold/unsold, with realtime budget/roster updates propagating to every device), 3) the unsold pool second round and last-resort lottery tool as secondary admin tools layered on top.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sbl-live-auction.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/60a1a5ee-5ecc-49f7-a921-8e6f90affdbe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
