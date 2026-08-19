import { createServerFn } from "@tanstack/react-start";

type Cat = "male" | "female" | "kid";

export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    return { ok: true };
  });

export const captainLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { teamId: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const { assertCaptain } = await import("./auction.server");
    await assertCaptain(data.teamId, data.pin);
    return { ok: true };
  });

export const placeBid = createServerFn({ method: "POST" })
  .inputValidator((d: { teamId: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const { placeBidServer } = await import("./auction.server");
    return placeBidServer(data.teamId, data.pin);
  });

export const saveTeam = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      passcode: string;
      id?: string;
      name: string;
      captain_name: string;
      color: string;
      starting_budget: number;
      max_roster_size: number;
      pin: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const base = {
      name: data.name,
      captain_name: data.captain_name,
      color: data.color,
      starting_budget: data.starting_budget,
      max_roster_size: data.max_roster_size,
    };
    let teamId = data.id;
    if (teamId) {
      const { error } = await db.from("teams").update(base).eq("id", teamId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await db
        .from("teams")
        .insert({ ...base, remaining_budget: data.starting_budget })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      teamId = row.id;
    }
    if (data.pin) {
      await db.from("team_secrets").upsert({ team_id: teamId, pin: data.pin });
    }
    return { id: teamId };
  });

export const deleteTeam = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; id: string }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    await db.from("teams").delete().eq("id", data.id);
    return { ok: true };
  });

export const savePlayer = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      passcode: string;
      id?: string;
      name: string;
      category: Cat;
      tier_id: string | null;
      base_price: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const base = {
      name: data.name,
      category: data.category,
      tier_id: data.tier_id,
      base_price: data.base_price,
    };
    if (data.id) {
      const { error } = await db.from("players").update(base).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await db
        .from("players")
        .insert({ ...base, original_base_price: data.base_price });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deletePlayer = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; id: string }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    await db.from("players").delete().eq("id", data.id);
    return { ok: true };
  });

export const saveTier = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; id?: string; label: string; base_price: number }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      await db
        .from("tiers")
        .update({ label: data.label, base_price: data.base_price })
        .eq("id", data.id);
    } else {
      await db.from("tiers").insert({ label: data.label, base_price: data.base_price });
    }
    return { ok: true };
  });

export const setOnBlock = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; playerId: string }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: state } = await db.from("auction_state").select("*").eq("id", 1).maybeSingle();
    if (state?.current_player_id && state.current_player_id !== data.playerId) {
      await db
        .from("players")
        .update({ status: "available" })
        .eq("id", state.current_player_id)
        .eq("status", "on_auction");
    }
    await db.from("bids").delete().eq("player_id", data.playerId);
    await db.from("players").update({ status: "on_auction" }).eq("id", data.playerId);
    await db
      .from("auction_state")
      .update({
        current_player_id: data.playerId,
        bidding_open: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    return { ok: true };
  });

export const setBidding = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; open: boolean }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    await db
      .from("auction_state")
      .update({ bidding_open: data.open, updated_at: new Date().toISOString() })
      .eq("id", 1);
    return { ok: true };
  });

export const setIncrement = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; increment: number }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    await db.from("auction_state").update({ bid_increment: data.increment }).eq("id", 1);
    return { ok: true };
  });

export const markSold = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string }) => d)
  .handler(async ({ data }) => {
    const { sellServer } = await import("./auction.server");
    return sellServer(data.passcode);
  });

export const markUnsold = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: state } = await db.from("auction_state").select("*").eq("id", 1).maybeSingle();
    if (!state?.current_player_id) throw new Error("No player on the block");
    await db
      .from("players")
      .update({ status: "in_unsold_pool" })
      .eq("id", state.current_player_id);
    await db
      .from("auction_state")
      .update({ current_player_id: null, bidding_open: false })
      .eq("id", 1);
    return { ok: true };
  });

export const relistPlayer = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; playerId: string }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: p } = await db
      .from("players")
      .select("original_base_price")
      .eq("id", data.playerId)
      .maybeSingle();
    if (!p) throw new Error("Player not found");
    const half = Math.max(1, Math.round((Number(p.original_base_price) / 2) * 10) / 10);
    await db.from("bids").delete().eq("player_id", data.playerId);
    await db
      .from("players")
      .update({ base_price: half, status: "on_auction" })
      .eq("id", data.playerId);
    await db
      .from("auction_state")
      .update({
        current_player_id: data.playerId,
        bidding_open: true,
        round_type: "unsold",
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    return { basePrice: half };
  });

export const lotteryAssign = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; teamId: string; category: Cat }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: pool } = await db
      .from("players")
      .select("id, name")
      .eq("category", data.category)
      .in("status", ["in_unsold_pool", "unsold", "available"]);
    if (!pool || pool.length === 0) throw new Error("No remaining players in that category");
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    const { data: team } = await db
      .from("teams")
      .select("remaining_budget")
      .eq("id", data.teamId)
      .maybeSingle();
    if (!team) throw new Error("Team not found");
    await db
      .from("players")
      .update({ status: "sold", sold_to_team_id: data.teamId, sold_price: 1 })
      .eq("id", pick.id);
    await db
      .from("teams")
      .update({ remaining_budget: Math.max(0, Number(team.remaining_budget) - 1) })
      .eq("id", data.teamId);
    return { player: pick.name };
  });

export const resetAuction = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    await db.from("bids").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db
      .from("players")
      .update({ status: "available", sold_to_team_id: null, sold_price: null })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    const { data: teams } = await db.from("teams").select("id, starting_budget");
    for (const t of teams ?? []) {
      await db.from("teams").update({ remaining_budget: t.starting_budget }).eq("id", t.id);
    }
    await db
      .from("auction_state")
      .update({ current_player_id: null, bidding_open: false, round_type: "main" })
      .eq("id", 1);
    return { ok: true };
  });
