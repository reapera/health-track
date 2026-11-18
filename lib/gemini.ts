import { calorieTarget, FOOD_MEALS, parseFoodEntry, type NewFoodEntry } from "./food";

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const TOOL_NAME = "propose_food_log";

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface HealthNote {
  level: "heads_up" | "warning";
  note: string;
}

export interface EstimateResult {
  reply: string;
  items: NewFoodEntry[];
  health: HealthNote | null;
}

// What is already saved in Notion for the date being logged
export interface DayContext {
  calories: number;
  protein: number;
  items: string[];
}

function dayContextText(logDate: string, day: DayContext | null): string {
  if (!day) return `It is unknown what else was eaten on ${logDate}.`;
  if (day.items.length === 0) return `Nothing else is logged yet for ${logDate}.`;
  return (
    `Already saved for ${logDate} (${day.calories} kcal, ${day.protein}g protein in total): ${day.items.join("; ")}. ` +
    "These are saved already: never include them in the tool call."
  );
}

function systemPrompt(clientDate: string, clientTime: string, logDate: string, day: DayContext | null): string {
  const target = calorieTarget();
  return [
    "You are the food logging assistant inside a personal health tracker.",
    "The user tells you what they ate, in English or Indonesian. Estimate calories (kcal) and protein (g) for each item,",
    "assuming a typical single serving unless they give a quantity. Do not ask clarifying questions unless the message is",
    "impossible to estimate; make a reasonable assumption and state it briefly instead.",
    `When the user describes food, call ${TOOL_NAME} once with every item, one entry per distinct food or drink.`,
    "If they ask to change a proposal (portion, meal, date, numbers), call the tool again with the full corrected list.",
    "The tool only shows a proposal: the user confirms it in the app before anything is saved, so never say it has been logged.",
    "Alongside the tool call, reply in one or two short sentences noting key assumptions. No markdown.",
    `Meal must be one of: ${FOOD_MEALS.join(", ")}. Use the meal the user states; otherwise infer it from the current time.`,
    logDate === clientDate
      ? `Today is ${clientDate} and the user's local time is ${clientTime}. Use today's date unless they say otherwise.`
      : `Today is ${clientDate}, but the user is backfilling ${logDate}: use ${logDate} for every entry unless they name another date. Infer the meal from the food, not the current time.`,
    dayContextText(logDate, day),
    target
      ? `The user's daily calorie target is ${target} kcal.`
      : "No daily calorie target is set; treat about 2,000-2,500 kcal as a general adult reference.",
    "Health feedback: judge the proposal together with what is already saved that day, and set health_level in the tool call.",
    "'warning' when it is clearly excessive (one meal far above a normal portion, or it pushes the day well past the target),",
    "deep-fried or very oily, or very high in sugar or saturated fat. 'heads_up' for milder concerns: fried food, a sugary drink,",
    "a very low-protein meal, or a day total getting high. Otherwise 'none'; most ordinary meals are 'none'.",
    "For heads_up or warning, write health_note: one or two short, friendly sentences naming the concern and one practical",
    "suggestion (a lighter next meal, a swap, a smaller portion, adding vegetables or protein). No guilt, no lecturing,",
    "no medical claims. Write it in the language the user wrote in, and keep this feedback out of the plain-text reply.",
    "If the message is not about food intake, answer briefly without calling the tool.",
  ].join(" ");
}

const tool = {
  functionDeclarations: [
    {
      name: TOOL_NAME,
      description: "Show the user a list of food log entries with estimated nutrition, for them to confirm.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                food_item: { type: "string", description: "Short name including portion, e.g. 'Nasi goreng (1 plate)'" },
                meal: { type: "string", enum: [...FOOD_MEALS] },
                calories: { type: "number", description: "Estimated kcal" },
                protein_g: { type: "number", description: "Estimated protein in grams" },
                date: { type: "string", description: "YYYY-MM-DD" },
              },
              required: ["food_item", "meal", "calories", "protein_g", "date"],
            },
          },
          health_level: {
            type: "string",
            enum: ["none", "heads_up", "warning"],
            description: "How concerning this meal is, given the rest of the day",
          },
          health_note: { type: "string", description: "Short friendly feedback; empty when health_level is none" },
        },
        required: ["items", "health_level"],
      },
    },
  ],
};

interface Part {
  text?: string;
  thought?: boolean;
  functionCall?: { name?: string; args?: { items?: unknown; health_level?: unknown; health_note?: unknown } };
}

export async function estimateFood(
  turns: ChatTurn[],
  clientDate: string,
  clientTime: string,
  logDate: string = clientDate,
  day: DayContext | null = null
): Promise<EstimateResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set on the server. Add it in Vercel and redeploy.");
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  let res: Response;
  try {
    res = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(clientDate, clientTime, logDate, day) }] },
        contents: turns.map((t) => ({ role: t.role === "user" ? "user" : "model", parts: [{ text: t.text }] })),
        tools: [tool],
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error(`Gemini (${model}) took longer than 25s to respond. Try again.`);
    }
    throw new Error(`Could not reach Gemini: ${err instanceof Error ? err.message : "network error"}`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: { message?: string } }).error?.message;
    throw new Error(`Gemini: ${message ?? `HTTP ${res.status}`}`);
  }

  const parts: Part[] = (data as { candidates?: { content?: { parts?: Part[] } }[] }).candidates?.[0]?.content?.parts ?? [];
  const reply = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("").trim();

  const items: NewFoodEntry[] = [];
  let health: HealthNote | null = null;
  for (const part of parts) {
    const call = part.functionCall;
    if (call?.name !== TOOL_NAME || !Array.isArray(call.args?.items)) continue;
    const level = call.args.health_level;
    const note = String(call.args.health_note ?? "").trim().slice(0, 400);
    if ((level === "heads_up" || level === "warning") && note) health = { level, note };
    for (const raw of call.args.items.slice(0, 20)) {
      if (!raw || typeof raw !== "object") continue;
      const r = raw as Record<string, unknown>;
      const parsed = parseFoodEntry({
        foodItem: r.food_item,
        meal: r.meal,
        calories: r.calories,
        protein: r.protein_g,
        // Fall back to the selected date if the model returns a malformed one
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(r.date)) ? r.date : logDate,
        note: "AI estimate",
      });
      if (parsed.ok) items.push(parsed.entry);
    }
  }

  if (!reply && items.length === 0) throw new Error("Gemini returned an empty response. Try rephrasing.");
  return { reply, items, health };
}
