import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import type { NewFoodEntry } from "./food";

type FullEntry = PageObjectResponse;

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const NOTION_API = "https://api.notion.com/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };
}

function getText(page: FullEntry, key: string): string {
  const prop = page.properties[key];
  if (!prop) return "";
  if (prop.type === "rich_text") return prop.rich_text.map((r) => r.plain_text).join("");
  if (prop.type === "title") return prop.title.map((r) => r.plain_text).join("");
  return "";
}

function getNumber(page: FullEntry, key: string): number | null {
  const prop = page.properties[key];
  if (!prop || prop.type !== "number") return null;
  return prop.number;
}

function getDate(page: FullEntry, key: string): string | null {
  const prop = page.properties[key];
  if (!prop || prop.type !== "date" || !prop.date) return null;
  return prop.date.start;
}

function getSelect(page: FullEntry, key: string): string | null {
  const prop = page.properties[key];
  if (!prop || prop.type !== "select" || !prop.select) return null;
  return prop.select.name;
}

const DB = {
  weight:  "3570c782-4a59-8139-8000-d8b360d6064a",
  food:    "3570c782-4a59-81ee-a3d8-da71155f7801",
  workout: "3570c782-4a59-8141-8842-fce74812fd2e",
  steps:   "3570c782-4a59-817a-a562-ecd83d8b9876",
  lab:     "3b80c782-4a59-8196-9137-c7ee43de894e",
};

export async function checkToken(): Promise<{ ok: boolean; detail: string }> {
  try {
    const user = await notion.users.me({});
    return { ok: true, detail: `Connected as ${user.name ?? user.id}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function checkConnections(): Promise<Record<string, "ok" | string>> {
  async function probe(id: string): Promise<"ok" | string> {
    try {
      const res = await fetch(`${NOTION_API}/databases/${id}/query`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ filter: { property: "Date", date: { on_or_after: "2099-01-01" } } }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return (body as { message?: string }).message ?? `HTTP ${res.status}`;
      }
      return "ok";
    } catch (err) {
      return err instanceof Error ? err.message : "error";
    }
  }
  const [weight, food, workout, steps, lab] = await Promise.all([
    probe(DB.weight), probe(DB.food), probe(DB.workout), probe(DB.steps), probe(DB.lab),
  ]);
  return { "Weight Log": weight, "Food Log": food, "Workout Log": workout, "Steps Log": steps, "Lab Results": lab };
}

async function queryDB(databaseId: string, startDate: string): Promise<FullEntry[]> {
  const results: FullEntry[] = [];
  let cursor: string | undefined;

  do {
    const body: Record<string, unknown> = {
      filter: { property: "Date", date: { on_or_after: startDate } },
      sorts: [{ property: "Date", direction: "ascending" }],
    };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? `Notion API error ${res.status}`);
    }
    const data = await res.json();
    results.push(...(data.results ?? []).filter((p: FullEntry) => p.object === "page"));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return results;
}

export interface WeightEntry {
  date: string;
  weight: number | null;
  bodyFat: string;
  note: string;
}

export interface FoodEntry {
  date: string;
  meal: string | null;
  name: string;
  foodItem: string;
  calories: number | null;
  protein: number | null;
  note: string;
}

export interface WorkoutEntry {
  date: string;
  level: string;
  exercise: string;
  reps: number | null;
  notes: string;
}

export interface StepsEntry {
  date: string;
  steps: number | null;
  note: string;
}

export async function fetchWeightLog(startDate: string): Promise<WeightEntry[]> {
  const pages = await queryDB(DB.weight, startDate);
  return pages.map((p) => ({
    date: getDate(p, "Date") ?? "",
    weight: getNumber(p, "Weight (kg)"),
    bodyFat: getText(p, "Body Fat %"),
    note: getText(p, "Note"),
  }));
}

export async function fetchFoodLog(startDate: string): Promise<FoodEntry[]> {
  const pages = await queryDB(DB.food, startDate);
  return pages.map((p) => ({
    date: getDate(p, "Date") ?? "",
    meal: getSelect(p, "Meal"),
    name: getText(p, "Name"),
    foodItem: getText(p, "Food Item"),
    calories: getNumber(p, "Calories"),
    protein: getNumber(p, "Protein (g)"),
    note: getText(p, "Note"),
  }));
}

export async function fetchWorkoutLog(startDate: string): Promise<WorkoutEntry[]> {
  const pages = await queryDB(DB.workout, startDate);
  return pages.map((p) => ({
    date: getDate(p, "Date") ?? "",
    level: getText(p, "Level"),
    exercise: getText(p, "Exercise"),
    reps: getNumber(p, "Reps"),
    notes: getText(p, "Notes"),
  }));
}

export async function fetchStepsLog(startDate: string): Promise<StepsEntry[]> {
  const pages = await queryDB(DB.steps, startDate);
  return pages.map((p) => ({
    date: getDate(p, "Date") ?? "",
    steps: getNumber(p, "Steps"),
    note: getText(p, "Note"),
  }));
}

export interface LabEntry {
  date: string;
  test: string;
  value: number | null;
  unit: string;
  flag: string | null;
  referenceRange: string;
  testType: string | null;
  note: string;
}

export async function fetchLabLog(startDate: string): Promise<LabEntry[]> {
  const pages = await queryDB(DB.lab, startDate);
  return pages.map((p) => ({
    date: getDate(p, "Date") ?? "",
    test: getText(p, "Test") || getText(p, "Name"),
    value: getNumber(p, "Value"),
    unit: getText(p, "Unit"),
    flag: getSelect(p, "Flag"),
    referenceRange: getText(p, "Reference Range"),
    testType: getSelect(p, "Test Type"),
    note: getText(p, "Note"),
  }));
}

export async function createFoodEntry(entry: NewFoodEntry): Promise<void> {
  const text = (content: string) => [{ type: "text", text: { content } }];
  const properties: Record<string, unknown> = {
    Name: { title: text(entry.foodItem) },
    "Food Item": { rich_text: text(entry.foodItem) },
    Date: { date: { start: entry.date } },
    Meal: { select: { name: entry.meal } },
    Calories: { number: entry.calories },
  };
  if (entry.protein !== null) properties["Protein (g)"] = { number: entry.protein };
  if (entry.note) properties.Note = { rich_text: text(entry.note) };

  const res = await fetch(`${NOTION_API}/pages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ parent: { database_id: DB.food }, properties }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `Notion API error ${res.status}`);
  }
}
