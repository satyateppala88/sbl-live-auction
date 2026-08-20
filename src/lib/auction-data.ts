import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Cat = "male" | "female" | "kid";

export type Team = {
  id: string;
  name: string;
  captain_name: string;
  captain2_name: string;
  color: string;
  starting_budget: number;
  remaining_budget: number;
  max_roster_size: number;
  captain_photo_url: string | null;
  captain2_photo_url: string | null;
  logo_url: string | null;
};
export type Tier = { id: string; label: string; base_price: number; sort_order: number };
export type Player = {
  id: string;
  name: string;
  category: Cat;
  tier_id: string | null;
  base_price: number;
  original_base_price: number;
  status: "available" | "on_auction" | "sold" | "unsold" | "in_unsold_pool";
  sold_to_team_id: string | null;
  sold_price: number | null;
  photo_url: string | null;
};
export type Bid = {
  id: string;
  player_id: string;
  team_id: string;
  amount: number;
  created_at: string;
};
export type AuctionState = {
  id: number;
  current_player_id: string | null;
  bidding_open: boolean;
  bid_increment: number;
  round_type: string;
  block_started_at: string | null;
  block_seconds: number;
  live_stream_url: string | null;
};

export type ChatMessage = {
  id: string;
  display_name: string;
  message: string;
  device_id: string;
  created_at: string;
};

export type AuctionLogEvent = {
  id: string;
  event_type: "sold" | "unsold" | "relisted" | "lottery" | "reset" | string;
  player_id: string | null;
  team_id: string | null;
  amount: number | null;
  note: string | null;
  created_at: string;
};


export const CATEGORY_LABEL: Record<Cat, string> = {
  male: "Male >16",
  female: "Female >16",
  kid: "Kid 8-16",
};

export const REQUIREMENT: Record<Cat, number> = { male: 2, female: 2, kid: 1 };

export function useAuctionData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [state, setState] = useState<AuctionState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [t, p, ti, b, s] = await Promise.all([
      supabase.from("teams").select("*").order("created_at"),
      supabase.from("players").select("*").order("created_at"),
      supabase.from("tiers").select("*").order("sort_order"),
      supabase.from("bids").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("auction_state").select("*").eq("id", 1).maybeSingle(),
    ]);
    setTeams((t.data as Team[]) ?? []);
    setPlayers((p.data as Player[]) ?? []);
    setTiers((ti.data as Tier[]) ?? []);
    setBids((b.data as Bid[]) ?? []);
    setState((s.data as AuctionState) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("sbl-auction")
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () =>
        void refresh(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "bids" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "tiers" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "auction_state" }, () =>
        void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { teams, players, tiers, bids, state, loading, refresh };
}

export function rosterOf(players: Player[], teamId: string) {
  return players.filter((p) => p.status === "sold" && p.sold_to_team_id === teamId);
}

export function categoryCounts(roster: Player[]) {
  return {
    male: roster.filter((p) => p.category === "male").length,
    female: roster.filter((p) => p.category === "female").length,
    kid: roster.filter((p) => p.category === "kid").length,
  };
}

export function maxBidFor(team: Team, filled: number) {
  return Number(team.remaining_budget) - Math.max(0, team.max_roster_size - filled - 1);
}

export function topBid(bids: Bid[], playerId: string | null | undefined) {
  if (!playerId) return null;
  const forPlayer = bids
    .filter((b) => b.player_id === playerId)
    .sort((a, b) => Number(b.amount) - Number(a.amount));
  return forPlayer[0] ?? null;
}

/** Auction run order: Male before Female before Kid, and within each category,
 * Icon before Challenger before Game Changer (i.e. tier.sort_order). Players whose
 * tier isn't set yet sort last within their category. */
const AUCTION_CATEGORY_ORDER: Record<Cat, number> = { male: 0, female: 1, kid: 2 };

export function auctionSortKey(player: Player, tiers: Tier[]): number {
  const tier = tiers.find((t) => t.id === player.tier_id);
  const tierRank = tier ? tier.sort_order : 99;
  return AUCTION_CATEGORY_ORDER[player.category] * 100 + tierRank;
}

export function sortForAuction<T extends Player>(players: T[], tiers: Tier[]): T[] {
  return players.slice().sort((a, b) => auctionSortKey(a, tiers) - auctionSortKey(b, tiers));
}



/** Seconds remaining on the per-player countdown, floored at 0. Null when no timer is running. */
export function secondsLeft(state: AuctionState | null): number | null {
  if (!state || !state.block_started_at || !state.bidding_open) return null;
  const startedMs = new Date(state.block_started_at).getTime();
  const elapsed = (Date.now() - startedMs) / 1000;
  return Math.max(0, Math.round(state.block_seconds - elapsed));
}

const CHAT_DEVICE_KEY = "sbl_chat_device_id";
export function getChatDeviceId() {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(CHAT_DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(CHAT_DEVICE_KEY, id);
  }
  return id;
}

const CHAT_NAME_KEY = "sbl_chat_display_name";
export function getChatDisplayName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CHAT_NAME_KEY) ?? "";
}
export function setChatDisplayName(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAT_NAME_KEY, name);
}

/** Dedicated realtime hook for chat -- kept separate from useAuctionData so a burst of
 * chat messages doesn't trigger a full refetch of teams/players/bids/state. */
export function useChatMessages(limit = 100) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    setMessages(((data as ChatMessage[]) ?? []).slice().reverse());
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("sbl-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () =>
        void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { messages, loading, refresh };
}

/** Read-only hook for the dispute-proof audit log (sold/unsold/relisted/lottery/reset events). */
export function useAuctionLog() {
  const [events, setEvents] = useState<AuctionLogEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("auction_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setEvents((data as AuctionLogEvent[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("sbl-auction-log")
      .on("postgres_changes", { event: "*", schema: "public", table: "auction_log" }, () =>
        void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { events, loading, refresh };
}

// ---------- live presence (viewer count) + kick/ban ----------

export type Viewer = {
  device_id: string;
  name: string;
  role: "watcher" | "captain" | "admin";
  online_at: string;
};

/**
 * Tracks who's currently on the platform via Supabase Realtime presence and returns
 * the live viewer list + count (Hotstar-style). Re-tracks when name/role change.
 * If this device has been banned, it stops tracking (drops out of the count) and
 * `banned` flips true so chat UIs can lock themselves.
 */
export function usePresence(role: Viewer["role"], name: string) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [banned, setBanned] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const deviceId = getChatDeviceId();
    let cancelled = false;

    // watch the ban list for this device
    const banChannel = supabase
      .channel("sbl-bans")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "banned_devices" },
        async () => {
          const { data } = await supabase
            .from("banned_devices")
            .select("device_id")
            .eq("device_id", deviceId)
            .maybeSingle();
          if (!cancelled) setBanned(!!data);
        },
      )
      .subscribe();

    void supabase
      .from("banned_devices")
      .select("device_id")
      .eq("device_id", deviceId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setBanned(!!data);
      });

    const channel = supabase.channel("sbl-presence", {
      config: { presence: { key: deviceId } },
    });

    const sync = () => {
      const state = channel.presenceState() as unknown as Record<string, Viewer[]>;
      const list = Object.values(state)
        .map((metas) => metas[0])
        .filter(Boolean) as Viewer[];
      if (!cancelled) setViewers(list);
    };

    channel.on("presence", { event: "sync" }, sync).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          device_id: deviceId,
          name: name || "Guest",
          role,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      cancelled = true;
      void channel.untrack();
      void supabase.removeChannel(channel);
      void supabase.removeChannel(banChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, name]);

  // if banned, actively leave presence so the count reflects it
  useEffect(() => {
    if (!banned) return;
    // nothing else to do -- the cleanup above untracks on unmount / dep change
  }, [banned]);

  const count = viewers.length;
  return { viewers, count, banned };
}

/** Realtime set of currently-banned device ids (admin-facing + self-check fallback). */
export function useBannedDevices() {
  const [banned, setBanned] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("banned_devices").select("device_id");
    setBanned(new Set((data ?? []).map((r) => r.device_id as string)));
  }, []);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("sbl-bans-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "banned_devices" }, () =>
        void refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return banned;
}

// ---------- captain bidding advisor ----------

export type AdviceTone = "info" | "good" | "warn";
export type Advice = { tone: AdviceTone; text: string };

/** Contextual guidance shown to a captain while a player is on the block. */
export function biddingAdvice(opts: {
  team: Team;
  players: Player[];
  currentPlayer: Player | null;
  filled: number;
  cap: number; // max legal bid right now (reserve rule applied)
  nextAmount: number; // what pressing Bid would cost
  leadingIsMe: boolean;
}): Advice[] {
  const { team, players, currentPlayer, filled, cap, nextAmount, leadingIsMe } = opts;
  const out: Advice[] = [];
  const budget = Number(team.remaining_budget);
  const slotsLeft = Math.max(0, team.max_roster_size - filled);
  const counts = categoryCounts(rosterOf(players, team.id));

  const needs = (["male", "female", "kid"] as const)
    .map((c) => ({ c, gap: Math.max(0, REQUIREMENT[c] - counts[c]) }))
    .filter((n) => n.gap > 0);

  // cheapest still-available players per category (excludes the one on the block),
  // so the reserve reflects real base prices -- e.g. if the only males left are Icons,
  // you must keep more back for them.
  const cheapestAvailable = (cat: Cat) =>
    players
      .filter((p) => p.status === "available" && p.category === cat && p.id !== currentPlayer?.id)
      .map((p) => Number(p.base_price))
      .sort((a, b) => a - b);
  const reserveForNeeds = (list: { c: Cat; gap: number }[]) => {
    let total = 0;
    for (const n of list) {
      const prices = cheapestAvailable(n.c);
      for (let i = 0; i < n.gap; i++) total += prices[i] ?? 1;
    }
    return total;
  };
  const reserveNow = reserveForNeeds(needs);

  out.push({
    tone: "info",
    text: `${budget} pts left · ${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} to fill`,
  });

  if (currentPlayer) {
    const fillsNeed = REQUIREMENT[currentPlayer.category] - counts[currentPlayer.category] > 0;
    if (fillsNeed) {
      out.push({
        tone: "good",
        text: `Fills a required ${CATEGORY_LABEL[currentPlayer.category]} slot`,
      });
    } else {
      out.push({
        tone: "info",
        text: `Optional — your ${CATEGORY_LABEL[currentPlayer.category]} quota is already met`,
      });
    }
  }

  if (needs.length) {
    const label = needs.map((n) => `${n.gap} ${CATEGORY_LABEL[n.c].split(" ")[0]}`).join(", ");
    out.push({
      tone: "info",
      text: `Still need: ${label} — keep ~${reserveNow} pts back for them`,
    });
  }

  if (slotsLeft > 0 && !leadingIsMe) {
    out.push({ tone: "info", text: `Your max legal bid now: ${Math.max(0, cap)} pts` });
  }

  if (currentPlayer && !leadingIsMe && nextAmount > 0) {
    const fillsNeed = REQUIREMENT[currentPlayer.category] - counts[currentPlayer.category] > 0;
    // required slots still open AFTER buying this player, and what they'll cost at base
    const needsAfter = needs
      .map((n) => (n.c === currentPlayer.category && fillsNeed ? { c: n.c, gap: n.gap - 1 } : n))
      .filter((n) => n.gap > 0);
    const reserveAfter = reserveForNeeds(needsAfter);
    const budgetAfter = budget - nextAmount;
    if (budgetAfter < reserveAfter) {
      out.push({
        tone: "warn",
        text: `Careful — bidding ${nextAmount} leaves ${budgetAfter} pts, but your remaining required players cost ~${reserveAfter} at base. You'd fall short.`,
      });
    } else if (fillsNeed && nextAmount <= Math.max(2, Number(currentPlayer.base_price) * 1.5)) {
      out.push({ tone: "good", text: "Good value — fills a need without straining your reserve" });
    }
  }

  return out;
}
