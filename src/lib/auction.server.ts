import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertAdmin(passcode: string) {
  const { data } = await supabaseAdmin
    .from("app_config")
    .select("value")
    .eq("key", "admin_passcode")
    .maybeSingle();
  if (!data || data.value !== passcode) throw new Error("Invalid admin passcode");
}

export async function assertCaptain(teamId: string, pin: string) {
  const { data } = await supabaseAdmin
    .from("team_secrets")
    .select("pin")
    .eq("team_id", teamId)
    .maybeSingle();
  if (!data || data.pin !== pin) throw new Error("Invalid team PIN");
}

export async function rosterCount(teamId: string) {
  const { count } = await supabaseAdmin
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("sold_to_team_id", teamId)
    .eq("status", "sold");
  return count ?? 0;
}

export function maxAllowedBid(remaining: number, maxRoster: number, filled: number) {
  const emptyAfterThisBuy = Math.max(0, maxRoster - filled - 1);
  return remaining - emptyAfterThisBuy;
}

export async function placeBidServer(teamId: string, pin: string) {
  await assertCaptain(teamId, pin);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");

  const { data: state } = await db.from("auction_state").select("*").eq("id", 1).maybeSingle();
  if (!state?.current_player_id) throw new Error("No player on the block");
  if (!state.bidding_open) throw new Error("Bidding is closed");

  const [{ data: player }, { data: team }] = await Promise.all([
    db.from("players").select("*").eq("id", state.current_player_id).maybeSingle(),
    db.from("teams").select("*").eq("id", teamId).maybeSingle(),
  ]);
  if (!player || !team) throw new Error("Auction data unavailable");

  const filled = await rosterCount(teamId);
  if (filled >= team.max_roster_size) throw new Error("Your roster is already full");

  const { data: top } = await db
    .from("bids")
    .select("amount, team_id")
    .eq("player_id", player.id)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  const increment = Number(state.bid_increment);
  const amount = top ? Number(top.amount) + increment : Number(player.base_price);
  if (top && top.team_id === teamId) throw new Error("You are already the highest bidder");

  const cap = maxAllowedBid(Number(team.remaining_budget), team.max_roster_size, filled);
  if (amount > Number(team.remaining_budget)) throw new Error("Bid exceeds your remaining budget");
  if (amount > cap)
    throw new Error(
      `You must keep 1 point reserved per empty slot. Max bid right now: ${cap} pts`,
    );

  const { error } = await db.from("bids").insert({ player_id: player.id, team_id: teamId, amount });
  if (error) throw new Error(error.message);
  return { amount };
}

export async function sellServer(passcode: string) {
  await assertAdmin(passcode);
  const db = supabaseAdmin;
  const { data: state } = await db.from("auction_state").select("*").eq("id", 1).maybeSingle();
  if (!state?.current_player_id) throw new Error("No player on the block");

  const { data: top } = await db
    .from("bids")
    .select("amount, team_id")
    .eq("player_id", state.current_player_id)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!top) throw new Error("No bids placed on this player");

  const { data: team } = await db.from("teams").select("*").eq("id", top.team_id).maybeSingle();
  if (!team) throw new Error("Team not found");

  await db
    .from("players")
    .update({ status: "sold", sold_to_team_id: top.team_id, sold_price: top.amount })
    .eq("id", state.current_player_id);
  await db
    .from("teams")
    .update({ remaining_budget: Number(team.remaining_budget) - Number(top.amount) })
    .eq("id", top.team_id);
  await db
    .from("auction_state")
    .update({ current_player_id: null, bidding_open: false, updated_at: new Date().toISOString() })
    .eq("id", 1);

  return { teamId: top.team_id, amount: Number(top.amount) };
}
