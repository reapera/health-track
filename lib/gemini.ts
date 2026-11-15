import { FOOD_MEALS, parseFoodEntry, type NewFoodEntry } from "./food";

const API = "https://generativelanguage.googleapis.com/v1beta/models";
const TOOL_NAME = "propose_food_log";

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface EstimateResult {
  reply: string;
  items: NewFoodEntry[];
}

function systemPrompt(clientDate: string, clientTime: string): string {
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
    `Today is ${clientDate} and the user's local time is ${clientTime}. Use today's date unless they say otherwise.`,
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
        },
        required: ["items"],
      },
    },
  ],
};

interface Part {
  text?: string;
  thought?: boolean;
  functionCall?: { name?: string; args?: { items?: unknown } };
}

export async function estimateFood(turns: ChatTurn[], clientDate: string, clientTime: string): Promise<EstimateResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set on the server. Add it in Vercel and redeploy.");
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  const res = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(clientDate, clientTime) }] },
      contents: turns.map((t) => ({ role: t.role === "user" ? "user" : "model", parts: [{ text: t.text }] })),
      tools: [tool],
    }),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: { message?: string } }).error?.message;
    throw new Error(`Gemini: ${message ?? `HTTP ${res.status}`}`);
  }

  const parts: Part[] = (data as { candidates?: { content?: { parts?: Part[] } }[] }).candidates?.[0]?.content?.parts ?? [];
  const reply = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join("").trim();

  const items: NewFoodEntry[] = [];
  for (const part of parts) {
    const call = part.functionCall;
    if (call?.name !== TOOL_NAME || !Array.isArray(call.args?.items)) continue;
    for (const raw of call.args.items.slice(0, 20)) {
      if (!raw || typeof raw !== "object") continue;
      const r = raw as Record<string, unknown>;
      const parsed = parseFoodEntry({
        foodItem: r.food_item,
        meal: r.meal,
        calories: r.calories,
        protein: r.protein_g,
        // Fall back to today if the model returns a malformed date
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(r.date)) ? r.date : clientDate,
        note: "AI estimate",
      });
      if (parsed.ok) items.push(parsed.entry);
    }
  }

  if (!reply && items.length === 0) throw new Error("Gemini returned an empty response. Try rephrasing.");
  return { reply, items };
}
