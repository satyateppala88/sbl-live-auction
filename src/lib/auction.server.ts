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

  // category cap: at most 2 Male, 1 Female, 1 Child per team (the captain is the third man)
  const CATEGORY_CAP: Record<string, number> = { male: 2, female: 1, kid: 1 };
  const CATEGORY_NAME: Record<string, string> = { male: "Male", female: "Female", kid: "Child" };
  const catCap = CATEGORY_CAP[player.category] ?? 99;
  const { count: catCount } = await db
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("sold_to_team_id", teamId)
    .eq("status", "sold")
    .eq("category", player.category);
  if ((catCount ?? 0) >= catCap)
    throw new Error(
      `Your ${CATEGORY_NAME[player.category] ?? player.category} quota is already full (max ${catCap})`,
    );

  const { data: top } = await db
    .from("bids")
    .select("amount, team_id")
    .eq("player_id", player.id)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  const amount = top ? Number(top.amount) + 1 : Number(player.base_price);
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
    .update({
      current_player_id: null,
      bidding_open: false,
      block_started_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  await db.from("auction_log").insert({
    event_type: "sold",
    player_id: state.current_player_id,
    team_id: top.team_id,
    amount: top.amount,
  });


  return { teamId: top.team_id, amount: Number(top.amount) };
}

const PHOTO_BUCKET = "player-photos";
const TEN_YEARS = 60 * 60 * 24 * 3650;

function decodeBase64(b64: string) {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function uploadPhotoServer(opts: {
  kind: "player" | "team" | "team2";
  id: string;
  base64: string;
  contentType?: string;
}) {
  const db = supabaseAdmin;
  const bytes = decodeBase64(opts.base64);
  const path = `${opts.kind}/${opts.id}-${Date.now()}.jpg`;
  const { error: upErr } = await db.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType: opts.contentType ?? "image/jpeg", upsert: true });
  if (upErr) throw new Error(upErr.message);

  const { data: signed, error: signErr } = await db.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !signed) throw new Error(signErr?.message ?? "Could not create photo URL");

  if (opts.kind === "player") {
    const { error } = await db
      .from("players")
      .update({ photo_url: signed.signedUrl })
      .eq("id", opts.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db
      .from("teams")
      .update(
        opts.kind === "team"
          ? { captain_photo_url: signed.signedUrl }
          : { captain2_photo_url: signed.signedUrl },
      )
      .eq("id", opts.id);
    if (error) throw new Error(error.message);
  }
  return { url: signed.signedUrl };
}

const CHAT_MESSAGE_MAX = 200;
const CHAT_NAME_MAX = 40;
const CHAT_MIN_INTERVAL_MS = 2000;
// Small, deliberately conservative blocklist -- basic guardrail, not a full moderation system.
const CHAT_BLOCKLIST = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "randi",
  "chutiya",
  "madarchod",
  "behenchod",
  "bhosdi",
];

function containsBlockedWord(text: string) {
  const lower = text.toLowerCase();
  return CHAT_BLOCKLIST.some((w) => lower.includes(w));
}

export async function sendChatServer(displayName: string, message: string, deviceId: string) {
  const name = displayName.trim().slice(0, CHAT_NAME_MAX);
  const msg = message.trim().slice(0, CHAT_MESSAGE_MAX);
  if (!name) throw new Error("Enter a display name first");
  if (!msg) throw new Error("Message can't be empty");
  if (!deviceId) throw new Error("Missing device id");
  if (containsBlockedWord(name) || containsBlockedWord(msg)) {
    throw new Error("Please keep the chat friendly");
  }

  const db = supabaseAdmin;
  const { data: ban } = await db
    .from("banned_devices")
    .select("device_id")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (ban) throw new Error("You've been removed from the chat by the organizer");
  const { data: last } = await db
    .from("chat_messages")
    .select("created_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last) {
    const elapsed = Date.now() - new Date(last.created_at).getTime();
    if (elapsed < CHAT_MIN_INTERVAL_MS) throw new Error("You're sending messages too fast");
  }

  const { error } = await db
    .from("chat_messages")
    .insert({ display_name: name, message: msg, device_id: deviceId });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteChatServer(passcode: string, id: string) {
  await assertAdmin(passcode);
  const db = supabaseAdmin;
  const { error } = await db.from("chat_messages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function kickDeviceServer(
  passcode: string,
  deviceId: string,
  displayName?: string,
  reason?: string,
) {
  await assertAdmin(passcode);
  const db = supabaseAdmin;
  const { error } = await db
    .from("banned_devices")
    .upsert({ device_id: deviceId, display_name: displayName ?? null, reason: reason ?? null });
  if (error) throw new Error(error.message);
  // scrub their existing messages so nothing abusive lingers
  await db.from("chat_messages").delete().eq("device_id", deviceId);
  return { ok: true };
}

export async function unbanDeviceServer(passcode: string, deviceId: string) {
  await assertAdmin(passcode);
  const db = supabaseAdmin;
  const { error } = await db.from("banned_devices").delete().eq("device_id", deviceId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** Public self-check: a device asks "am I banned?" — returns only a boolean, never the list. */
export async function checkBannedServer(deviceId: string) {
  if (!deviceId) return { banned: false };
  const db = supabaseAdmin;
  const { data } = await db
    .from("banned_devices")
    .select("device_id")
    .eq("device_id", deviceId)
    .maybeSingle();
  return { banned: !!data };
}

// ---------- captain pre-auction targets (private per team) ----------

export async function getTargetsServer(teamId: string, pin: string) {
  await assertCaptain(teamId, pin);
  const db = supabaseAdmin;
  const { data, error } = await db
    .from("captain_targets")
    .select("player_id, min_price, max_price, note")
    .eq("team_id", teamId);
  if (error) throw new Error(error.message);
  return { targets: data ?? [] };
}

export async function setTargetServer(
  teamId: string,
  pin: string,
  playerId: string,
  minPrice: number | null,
  maxPrice: number | null,
) {
  await assertCaptain(teamId, pin);
  const db = supabaseAdmin;
  // both blank -> clear the row entirely
  if (minPrice === null && maxPrice === null) {
    const { error } = await db
      .from("captain_targets")
      .delete()
      .eq("team_id", teamId)
      .eq("player_id", playerId);
    if (error) throw new Error(error.message);
    return { ok: true, cleared: true };
  }
  const { error } = await db.from("captain_targets").upsert({
    team_id: teamId,
    player_id: playerId,
    min_price: minPrice,
    max_price: maxPrice,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}
