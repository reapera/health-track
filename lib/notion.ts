import { Client, isFullPage } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

type FullEntry = PageObjectResponse;

const notion = new Client({ auth: process.env.NOTION_TOKEN });

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
      await notion.databases.query({
        database_id: id,
        filter: { property: "Date", date: { on_or_after: "2099-01-01" } },
        sorts: [],
      });
      return "ok";
    } catch (err) {
      return err instanceof Error ? err.message : "error";
    }
  }
  const [weight, food, workout, steps] = await Promise.all([
    probe(DB.weight),
    probe(DB.food),
    probe(DB.workout),
    probe(DB.steps),
  ]);
  return { "Weight Log": weight, "Food Log": food, "Workout Log": workout, "Steps Log": steps };
}

async function queryDB(databaseId: string, startDate: string): Promise<FullEntry[]> {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Date",
      date: { on_or_after: startDate },
    },
    sorts: [{ property: "Date", direction: "ascending" }],
  });
  return response.results.filter(isFullPage);
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
