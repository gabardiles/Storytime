import { supabaseServer } from "./supabase-server";

export { calculateChapterCost } from "./coinPricing";

export type CoinTransactionType =
  | "story_create"
  | "chapter_continue"
  | "admin_topup"
  | "signup_bonus";

const SIGNUP_BONUS = 10;

/**
 * Returns the user's current coin balance.
 * Creates the row with the signup bonus if it doesn't exist yet.
 */
export async function getBalance(userId: string): Promise<number> {
  const sb = supabaseServer();
  const { data } = await sb
    .from("user_coins")
    .select("balance")
    .eq("user_id", userId)
    .single();

  if (data) return data.balance as number;

  const { error: insertErr } = await sb.from("user_coins").insert({
    user_id: userId,
    balance: SIGNUP_BONUS,
    updated_at: new Date().toISOString(),
  });

  if (insertErr) {
    // Race condition: another request already created the row
    const { data: retry } = await sb
      .from("user_coins")
      .select("balance")
      .eq("user_id", userId)
      .single();
    if (retry) return retry.balance as number;
    throw insertErr;
  }

  await sb.from("coin_transactions").insert({
    user_id: userId,
    amount: SIGNUP_BONUS,
    type: "signup_bonus" as CoinTransactionType,
    description: "Welcome bonus",
  });

  return SIGNUP_BONUS;
}

/**
 * Atomically deduct coins from the user's balance and log a transaction.
 * Throws if the user has insufficient balance.
 */
export async function deductCoins(
  userId: string,
  amount: number,
  type: CoinTransactionType,
  referenceId: string | null,
  description: string
): Promise<number> {
  const sb = supabaseServer();

  // Atomic: decrement only if balance >= amount
  const { data, error } = await sb.rpc("deduct_coins", {
    p_user_id: userId,
    p_amount: amount,
  });

  if (error) {
    // If the RPC doesn't exist yet, fall back to manual check
    if (error.message?.includes("function") || error.code === "42883") {
      return await deductCoinsFallback(userId, amount, type, referenceId, description);
    }
    throw error;
  }

  const newBalance = data as number;
  if (newBalance < 0) {
    // Shouldn't happen with the RPC, but safety check
    throw new Error("Insufficient coins");
  }

  await sb.from("coin_transactions").insert({
    user_id: userId,
    amount: -amount,
    type,
    reference_id: referenceId,
    description,
  });

  return newBalance;
}

/**
 * Fallback deduction without RPC — uses select + update with a balance check.
 * Less atomic but works without deploying a Postgres function.
 */
async function deductCoinsFallback(
  userId: string,
  amount: number,
  type: CoinTransactionType,
  referenceId: string | null,
  description: string
): Promise<number> {
  const sb = supabaseServer();

  const { data: row } = await sb
    .from("user_coins")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const currentBalance = (row?.balance as number) ?? 0;
  if (currentBalance < amount) {
    throw new Error("Insufficient coins");
  }

  const newBalance = currentBalance - amount;
  const { error: updateErr } = await sb
    .from("user_coins")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (updateErr) throw updateErr;

  await sb.from("coin_transactions").insert({
    user_id: userId,
    amount: -amount,
    type,
    reference_id: referenceId,
    description,
  });

  return newBalance;
}
