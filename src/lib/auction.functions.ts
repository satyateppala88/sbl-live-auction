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
      captain2_name: string;
      color: string;
      base_budget: number;
      captain_tier_id: string | null;
      max_roster_size: number;
      pin: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");

    // The captain "costs" the team their tier's base price:
    // effective (spendable) purse = base_budget - captain tier base.
    let captainBase = 0;
    if (data.captain_tier_id) {
      const { data: tier } = await db
        .from("tiers")
        .select("base_price")
        .eq("id", data.captain_tier_id)
        .maybeSingle();
      captainBase = tier ? Number(tier.base_price) : 0;
    }
    const effective = Math.max(0, Number(data.base_budget) - captainBase);

    const base = {
      name: data.name,
      captain_name: data.captain_name,
      captain2_name: data.captain2_name,
      color: data.color,
      base_budget: data.base_budget,
      captain_tier_id: data.captain_tier_id,
      starting_budget: effective,
      max_roster_size: data.max_roster_size,
    };
    let teamId = data.id;
    if (teamId) {
      // preserve any spend-to-date so changing the captain tier mid-event stays correct
      const { data: cur } = await db
        .from("teams")
        .select("starting_budget, remaining_budget")
        .eq("id", teamId)
        .maybeSingle();
      const spent = cur ? Number(cur.starting_budget) - Number(cur.remaining_budget) : 0;
      const { error } = await db
        .from("teams")
        .update({ ...base, remaining_budget: Math.max(0, effective - spent) })
        .eq("id", teamId);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await db
        .from("teams")
        .insert({ ...base, remaining_budget: effective })
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
        block_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    return { ok: true };
  });

export const resetTimer = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: state } = await db.from("auction_state").select("*").eq("id", 1).maybeSingle();
    if (!state?.current_player_id) throw new Error("No player on the block");
    await db
      .from("auction_state")
      .update({ block_started_at: new Date().toISOString() })
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
      .update({
        current_player_id: null,
        bidding_open: false,
        round_type: "main",
        block_started_at: null,
      })
      .eq("id", 1);
    await db.from("auction_log").insert({ event_type: "reset", note: "Auction reset by admin" });
    return { ok: true };
  });

export const uploadPhoto = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      passcode: string;
      kind: "player" | "team" | "team2";
      id: string;
      base64: string;
      contentType?: string;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { assertAdmin, uploadPhotoServer } = await import("./auction.server");
    await assertAdmin(data.passcode);
    return uploadPhotoServer({
      kind: data.kind,
      id: data.id,
      base64: data.base64,
      ...(data.contentType ? { contentType: data.contentType } : {}),
    });
  });

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator((d: { displayName: string; message: string; deviceId: string }) => d)
  .handler(async ({ data }) => {
    const { sendChatServer } = await import("./auction.server");
    return sendChatServer(data.displayName, data.message, data.deviceId);
  });

export const deleteChat = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; id: string }) => d)
  .handler(async ({ data }) => {
    const { deleteChatServer } = await import("./auction.server");
    return deleteChatServer(data.passcode, data.id);
  });

export const kickDevice = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { passcode: string; deviceId: string; displayName?: string; reason?: string }) => d,
  )
  .handler(async ({ data }) => {
    const { kickDeviceServer } = await import("./auction.server");
    return kickDeviceServer(data.passcode, data.deviceId, data.displayName, data.reason);
  });

export const unbanDevice = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; deviceId: string }) => d)
  .handler(async ({ data }) => {
    const { unbanDeviceServer } = await import("./auction.server");
    return unbanDeviceServer(data.passcode, data.deviceId);
  });

export const checkBanned = createServerFn({ method: "POST" })
  .inputValidator((d: { deviceId: string }) => d)
  .handler(async ({ data }) => {
    const { checkBannedServer } = await import("./auction.server");
    return checkBannedServer(data.deviceId);
  });

export const getTargets = createServerFn({ method: "POST" })
  .inputValidator((d: { teamId: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const { getTargetsServer } = await import("./auction.server");
    return getTargetsServer(data.teamId, data.pin);
  });

export const setTarget = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      teamId: string;
      pin: string;
      playerId: string;
      minPrice: number | null;
      maxPrice: number | null;
    }) => d,
  )
  .handler(async ({ data }) => {
    const { setTargetServer } = await import("./auction.server");
    return setTargetServer(data.teamId, data.pin, data.playerId, data.minPrice, data.maxPrice);
  });

export const setStreamUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { passcode: string; url: string | null }) => d)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./auction.server");
    await assertAdmin(data.passcode);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const url = data.url && data.url.trim() ? data.url.trim() : null;
    await db.from("auction_state").update({ live_stream_url: url }).eq("id", 1);
    return { ok: true };
  });
