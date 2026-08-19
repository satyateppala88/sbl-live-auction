import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Cat = "male" | "female" | "kid";

export type Team = {
  id: string;
  name: string;
  captain_name: string;
  color: string;
  starting_budget: number;
  remaining_budget: number;
  max_roster_size: number;
  captain_photo_url: string | null;
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
