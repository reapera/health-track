"use server";

import { describeEntry, parseFoodEntry, type NewFoodEntry } from "@/lib/food";
import { estimateFood, type ChatTurn } from "@/lib/gemini";
import { refresh } from "next/cache";
import { createFoodEntry, deleteFoodEntry, updateFoodEntry } from "@/lib/notion";
import { passcodeError } from "@/lib/passcode";

// Server Actions are reachable by direct POST, so every action checks the passcode itself.

export interface AddFoodState {
  status: "idle" | "ok" | "error";
  message: string;
  // Echoed back on error so the form keeps what was typed
  values?: { food: string; calories: string; protein: string; note: string };
  // Entries added so far in this form session, newest first
  added: string[];
}

export async function addFood(prev: AddFoodState, formData: FormData): Promise<AddFoodState> {
  const str = (key: string) => String(formData.get(key) ?? "").trim();
  const values = { food: str("food"), calories: str("calories"), protein: str("protein"), note: str("note") };
  const fail = (message: string): AddFoodState => ({ status: "error", message, values, added: prev.added });

  const denied = passcodeError(str("passcode"));
  if (denied) return fail(denied);

  const parsed = parseFoodEntry({
    foodItem: values.food,
    calories: values.calories,
    protein: values.protein,
    note: values.note,
    date: str("date"),
    meal: str("meal"),
  });
  if (!parsed.ok) return fail(parsed.error);

  try {
    await createFoodEntry(parsed.entry);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to save to Notion.");
  }

  const line = describeEntry(parsed.entry);
  return { status: "ok", message: line, added: [line, ...prev.added].slice(0, 50) };
}

export type ChatFoodResult =
  | { ok: true; reply: string; items: NewFoodEntry[] }
  | { ok: false; error: string; auth?: boolean };

// Asks the LLM for an estimate. Nothing is written to Notion here.
export async function chatFood(
  passcode: string,
  turns: ChatTurn[],
  clientDate: string,
  clientTime: string,
  logDate?: string
): Promise<ChatFoodResult> {
  const denied = passcodeError(String(passcode ?? ""));
  if (denied) return { ok: false, error: denied, auth: true };

  if (!Array.isArray(turns) || turns.length === 0) return { ok: false, error: "Say what you ate." };
  const clean: ChatTurn[] = turns.slice(-20).map((t) => ({
    role: t?.role === "assistant" ? "assistant" : "user",
    text: String(t?.text ?? "").slice(0, 2000),
  }));
  if (clean.at(-1)!.role !== "user" || !clean.at(-1)!.text.trim()) return { ok: false, error: "Say what you ate." };
  const date = /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : new Date().toISOString().slice(0, 10);
  const time = /^\d{2}:\d{2}$/.test(clientTime) ? clientTime : "12:00";

  try {
    const target = typeof logDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(logDate) ? logDate : date;
    const { reply, items } = await estimateFood(clean, date, time, target);
    return { ok: true, reply, items };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reach Gemini." };
  }
}

export type LogFoodsResult =
  | { ok: true; logged: number }
  | { ok: false; error: string; logged: number; auth?: boolean };

// Writes the entries the user confirmed. Values come from the client, so they are re-validated.
export async function logFoods(passcode: string, items: unknown[]): Promise<LogFoodsResult> {
  const denied = passcodeError(String(passcode ?? ""));
  if (denied) return { ok: false, error: denied, logged: 0, auth: true };
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    return { ok: false, error: "Nothing to log.", logged: 0 };
  }

  const entries: NewFoodEntry[] = [];
  for (const raw of items) {
    const parsed = parseFoodEntry((raw ?? {}) as Record<string, unknown>);
    if (!parsed.ok) return { ok: false, error: parsed.error, logged: 0 };
    entries.push(parsed.entry);
  }

  let logged = 0;
  try {
    for (const entry of entries) {
      await createFoodEntry(entry);
      logged++;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save to Notion.";
    return { ok: false, error: logged > 0 ? `${message} (${logged} of ${entries.length} saved)` : message, logged };
  }
  return { ok: true, logged };
}

export type EditFoodResult = { ok: true } | { ok: false; error: string; auth?: boolean };

export async function updateFood(passcode: string, id: string, raw: unknown): Promise<EditFoodResult> {
  const denied = passcodeError(String(passcode ?? ""));
  if (denied) return { ok: false, error: denied, auth: true };
  const parsed = parseFoodEntry((raw ?? {}) as Record<string, unknown>);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  try {
    await updateFoodEntry(String(id), parsed.entry);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update Notion." };
  }
  refresh();
  return { ok: true };
}

export async function deleteFood(passcode: string, id: string): Promise<EditFoodResult> {
  const denied = passcodeError(String(passcode ?? ""));
  if (denied) return { ok: false, error: denied, auth: true };
  try {
    await deleteFoodEntry(String(id));
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete in Notion." };
  }
  refresh();
  return { ok: true };
}
