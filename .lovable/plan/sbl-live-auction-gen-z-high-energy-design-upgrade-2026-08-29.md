# SBL Live Auction — Gen Z / High-Energy Design Upgrade

Goal: push the app from "polished dark dashboard" to "live esports broadcast" — more 3D, more motion, more attitude — without touching schema, auth, or auction logic. Everything below is visual/presentation only.

## Direction: "Prime-Time Esports Broadcast"

Keep the navy + gold + smash-orange DNA, but crank the energy: bolder type, neon rim-lighting, 3D depth, screen-shake moments, and broadcast-style motion graphics. Think IPL broadcast meets Valorant lobby.

## Proposed upgrades (pick what you want)

### 1. Big moments, bigger reactions (highest impact)
- **SOLD moment v2**: full-screen takeover — radial flash in the winning team's color, giant slanted "SOLD" stamp slamming in with a screen-shake, team crest scaling up behind the player name, price counting up in huge gold type. Current overlay is polite; this should feel like a goal in a FIFA stream.
- **New record bid flash**: when a bid becomes the highest of the night, a "NEW RECORD" ribbon sweeps across all screens (watch, captain, admin).
- **Bidding war detector**: when 2+ teams trade bids within ~10 seconds, show a "BIDDING WAR 🔥" badge with animated flame/pulse on the block panel.
- **Unsold moment**: red scanline sweep + desaturated flash, quicker and harsher than today's shake.

### 2. 3D and depth (CSS-first, mobile-safe)
- **3D tilt cards**: player medallion and role cards tilt toward the cursor (pointer-tracked `rotateX/rotateY`, disabled on touch/reduced-motion). Pure CSS transforms — no WebGL cost.
- **Layered parallax on landing**: stars, court lines, and the player silhouette drift at different speeds on scroll/pointer move for real depth.
- **Glassmorphic panels with rim light**: cards get a 1px top highlight + inner glow so they read as glass under stadium lights, not flat boxes.
- **Crest drop-in**: team crests pop in with a springy scale when they appear in grids.

### 3. Typography & color energy
- **Display type upgrade**: swap/augment Barlow Condensed with a heavier condensed (e.g. "Archivo Black" or "Anton") for the giant numbers and SOLD stamps; keep Barlow for sub-heads.
- **Gradient animated headline text**: the "SBL Live Auction" title gets an animated gold-to-cream sheen sweep (stronger version of the current text-sweep).
- **Electric accents**: subtle neon underglow (team color) under the current-bid box; leading-team badge gets an animated color ring.

### 4. Broadcast motion graphics on /watch
- **Lower-third tickers**: a slim scrolling ticker at the bottom of /watch with recent sales ("Ravi → Smash Kings · 24 pts").
- **Animated transitions between players**: when the block changes, the player cell does a quick swipe/wipe transition instead of an instant swap.
- **Live bid bar race**: horizontal bars per team showing spend, animating as budgets change (replaces or augments static numbers on watch).
- **Viewer count + LIVE pill pulse** already exist — add a subtle audio-waveform-style equalizer animation next to LIVE for broadcast feel.

### 5. Micro-interactions everywhere
- **Bid button**: press = squash + haptic-style bounce + quick ring pulse; disabled states get a shake when tapped.
- **Number count-ups** on every budget/roster change (already on landing — extend to captain/admin/watch panels).
- **Hover**: magnetic lift on all cards (translate + glow follows pointer).
- **Page transitions**: quick fade/slide between tabs in admin and captain views.

### 6. Landing page as an event poster
- Animated countdown-to-auction module (if a start time is set in app config).
- Team crest marquee: all 10 crests scrolling in a slow infinite strip under the hero.
- Grain/noise overlay + vignette for a cinematic finish.

## Suggested phasing

1. **Phase 1 — Moments**: SOLD takeover v2, record-bid flash, bidding-war badge, unsold sweep.
2. **Phase 2 — Depth**: 3D tilt cards, parallax landing, glassmorphic rim-light panels.
3. **Phase 3 — Broadcast**: tickers, block-change transitions, spend bar-race, type upgrade.
4. **Phase 4 — Polish**: micro-interactions, count-ups everywhere, landing marquee + noise.

## Technical notes
- All CSS transform/opacity animations — GPU-friendly, no JS animation libraries, no WebGL. Safe for phones.
- Everything respects `prefers-reduced-motion`.
- No schema, auth, server-function, or realtime changes. Edits confined to `src/styles.css`, `src/components/*`, and the four route files.
- Fonts loaded via `<link>` in `__root.tsx` (not CSS @import).

## What I need from you
- Which phases (or individual items) to build — or say "all of it".
- Any direction you dislike (e.g. no screen-shake, no ticker, keep Barlow only).
